import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { portalDb } from './server/db';
import { 
  generateMikroTikLoginHtml,
  generateMikroTikAloginHtml,
  generateMikroTikStatusHtml,
  generateMikroTikLogoutHtml,
  generateMikroTikSetupRsc,
  generateMikroTikVouchersRsc,
  generateMikroTikVouchersCsv,
  generateMikroTikFetchSyncScript,
  testMikroTikGatewayConnection,
  getMikroTikRadiusGuide
} from './server/gateway';

async function startServer() {
  const app = express();
  // After:
const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Parse client IP and MAC from MikroTik redirect query or headers
  const getClientNetworkInfo = (req: express.Request) => {
    const queryIp = (req.query.ip || req.query.clientip) as string;
    const queryMac = (req.query.mac || req.query.clientmac) as string;
    const headerIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
    const socketIp = req.socket.remoteAddress?.replace('::ffff:', '') || '192.168.88.145';

    const clientIp = queryIp || headerIp || socketIp;
    const clientMac = queryMac || (req.headers['x-client-mac'] as string) || undefined;
    return { clientIp, clientMac };
  };

  // Captive Portal Detection Handlers (CNA probes)
  const handleCaptiveProbe = (probeName: string, successResponse: (res: express.Response) => void) => {
    return (req: express.Request, res: express.Response) => {
      const { clientIp, clientMac } = getClientNetworkInfo(req);
      const { isAuthorized } = portalDb.checkClientStatus(clientIp, clientMac);

      if (isAuthorized) {
        successResponse(res);
      } else {
        const redir = `/?ip=${encodeURIComponent(clientIp)}&probe=${encodeURIComponent(probeName)}&link-orig=${encodeURIComponent('https://www.google.com')}`;
        res.redirect(302, redir);
      }
    };
  };

  app.get(['/generate_204', '/gen_204'], handleCaptiveProbe('Android', (res) => res.status(204).end()));
  app.get('/hotspot-detect.html', handleCaptiveProbe('Apple', (res) => {
    res.send('<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>');
  }));
  app.get(['/ncsi.txt', '/connecttest.txt'], handleCaptiveProbe('Windows', (res) => {
    res.send('Microsoft NCSI');
  }));

  // --- API Endpoints ---

  // Get current client authorization status
  app.get('/api/portal/status', (req, res) => {
    const { clientIp, clientMac } = getClientNetworkInfo(req);
    const result = portalDb.checkClientStatus(clientIp, clientMac);
    const config = portalDb.getMikroTikConfig();
    res.json({
      ...result,
      detectedClient: {
        ip: clientIp,
        mac: result.session?.clientMac || clientMac || 'AUTO_RESOLVING',
        gateway: config.host || '192.168.88.1',
        ssid: 'AIS-Campus-WiFi'
      }
    });
  });

  // Voucher authentication
  app.post('/api/auth/voucher', (req, res) => {
    const { voucherCode, clientIp: reqIp, clientMac: reqMac, userAgent: reqUa, hostname } = req.body;
    const { clientIp, clientMac } = getClientNetworkInfo(req);

    const targetIp = reqIp || clientIp;
    const targetMac = reqMac || clientMac;
    const userAgent = reqUa || req.headers['user-agent'] || 'Web Browser';

    if (!voucherCode) {
      return res.status(400).json({ success: false, message: 'Voucher code is required.' });
    }

    const authResult = portalDb.authenticateVoucher(voucherCode, targetIp, targetMac, userAgent, hostname);
    res.json(authResult);
  });

  // Session termination by client
  app.post('/api/portal/logout', (req, res) => {
    const { sessionId, clientMac } = req.body;
    let disconnected = false;
    if (sessionId) {
      disconnected = portalDb.disconnectSession(sessionId, 'user_logout');
    } else if (clientMac) {
      disconnected = portalDb.disconnectByMac(clientMac, 'user_logout');
    }
    res.json({ success: disconnected });
  });

  // Admin authentication
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }
    const admin = portalDb.adminLogin(username, password);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });
    }
    res.json({ success: true, user: admin });
  });

  // Update admin credentials
  app.post('/api/admin/update-account', (req, res) => {
    const { currentUsername, currentPassword, newName, newUsername, newPassword } = req.body;
    if (!currentUsername) {
      return res.status(400).json({ success: false, message: 'Current username is required.' });
    }
    const result = portalDb.updateAdminAccount(currentUsername, {
      currentPassword,
      newName,
      newUsername,
      newPassword
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Voucher inventory
  app.get('/api/vouchers', (req, res) => {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const vouchers = portalDb.getVouchers(search, status);
    res.json(vouchers);
  });

  // Bulk voucher generation
  app.post('/api/vouchers/bulk', (req, res) => {
    try {
      const { quantity, prefix, profile, durationMinutes, speedLimitDownMbps, speedLimitUpMbps, dataQuotaMB, maxDevices, validDays, notes } = req.body;
      const vouchers = portalDb.generateBulkVouchers({
        quantity: Math.min(Math.max(Number(quantity) || 5, 1), 200),
        prefix: prefix || 'AIS-',
        profile: profile || 'student_standard',
        durationMinutes: Number(durationMinutes) || 60,
        speedLimitDownMbps: Number(speedLimitDownMbps) || 10,
        speedLimitUpMbps: Number(speedLimitUpMbps) || 5,
        dataQuotaMB: Number(dataQuotaMB) || 0,
        maxDevices: Number(maxDevices) || 1,
        validDays: Number(validDays) || 7,
        notes: notes || 'Bulk generated'
      });
      res.json({ success: true, count: vouchers.length, vouchers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Revoke voucher
  app.post('/api/vouchers/:id/revoke', (req, res) => {
    const ok = portalDb.revokeVoucher(req.params.id);
    res.json({ success: ok });
  });

  // Delete voucher
  app.delete('/api/vouchers/:id', (req, res) => {
    const ok = portalDb.deleteVoucher(req.params.id);
    res.json({ success: ok });
  });

  // Active sessions
  app.get('/api/sessions', (req, res) => {
    const sessions = portalDb.getActiveSessions();
    res.json(sessions);
  });

  // Manual device bypass
  app.post('/api/admin/authorize-device', (req, res) => {
    const { clientIp, clientMac, hostname, durationMinutes, speedLimitDownMbps, speedLimitUpMbps, notes } = req.body;
    if (!clientIp && !clientMac) {
      return res.status(400).json({ success: false, message: 'Client IP or MAC address is required.' });
    }
    const result = portalDb.directAuthorizeDevice({
      clientIp: clientIp || '192.168.88.145',
      clientMac: clientMac || '02:A4:6B:7C:89:1E',
      hostname,
      durationMinutes: Number(durationMinutes) || 480,
      speedLimitDownMbps: Number(speedLimitDownMbps) || 25,
      speedLimitUpMbps: Number(speedLimitUpMbps) || 10,
      notes
    });
    res.json(result);
  });

  // Terminate active session
  app.post('/api/sessions/:id/disconnect', (req, res) => {
    const ok = portalDb.disconnectSession(req.params.id, 'admin_disconnected');
    res.json({ success: ok });
  });

  app.post('/api/sessions/disconnect-mac', (req, res) => {
    const { clientMac } = req.body;
    const ok = portalDb.disconnectByMac(clientMac, 'admin_disconnected');
    res.json({ success: ok });
  });

  // Audit logs
  app.get('/api/logs', (req, res) => {
    const limit = Number(req.query.limit) || 100;
    const logs = portalDb.getSessionLogs(limit);
    res.json(logs);
  });

  // System statistics
  app.get('/api/stats', (req, res) => {
    const stats = portalDb.getSystemStats();
    res.json(stats);
  });

  // MikroTik router configuration
  app.get('/api/gateway/mikrotik/config', (req, res) => {
    const config = portalDb.getMikroTikConfig();
    res.json(config);
  });

  app.post('/api/gateway/mikrotik/config', (req, res) => {
    const updated = portalDb.updateMikroTikConfig(req.body);
    res.json({ success: true, config: updated });
  });

  app.post('/api/gateway/mikrotik/test-connection', async (req, res) => {
    try {
      const incomingConfig = req.body && Object.keys(req.body).length > 0 ? req.body : portalDb.getMikroTikConfig();
      const currentConfig = { ...portalDb.getMikroTikConfig(), ...incomingConfig };
      
      const testResult = await testMikroTikGatewayConnection(currentConfig);
      
      portalDb.updateMikroTikConfig({
        ...currentConfig,
        lastTestedAt: new Date().toISOString(),
        lastTestSuccess: testResult.success,
        lastTestMessage: testResult.message,
        latencyMs: testResult.latencyMs,
        status: testResult.success ? 'connected' : 'unreachable'
      });

      res.json(testResult);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Inbound RouterOS authentication callback
  app.post('/api/gateway/mikrotik/auth', (req, res) => {
    const voucherCode = req.body.voucher || req.body.auth_voucher || req.body.code || req.body.username;
    const clientIp = req.body.ip || req.body.clientip || req.body.clientIp || req.socket.remoteAddress?.replace('::ffff:', '') || '192.168.88.150';
    const clientMac = req.body.mac || req.body.clientmac || req.body.clientMac || '02:A4:6B:7C:89:1E';
    const hotspotServer = req.body.server || req.body.hotspotServer || 'ais-hotspot';

    if (!voucherCode) {
      return res.status(400).json({ status: 'FAIL', message: 'Voucher code is required.' });
    }

    const authResult = portalDb.authenticateVoucher(
      voucherCode,
      clientIp,
      clientMac,
      'MikroTik RouterOS Hotspot',
      `MikroTik-${hotspotServer}-Client`
    );

    if (authResult.success && authResult.session) {
      res.json({
        status: 'PASS',
        authorized: true,
        voucher: voucherCode,
        hotspotServer,
        clientIp,
        clientMac,
        timeout: authResult.session.durationMinutes * 60,
        speedLimitDownMbps: authResult.session.speedLimitDownMbps,
        speedLimitUpMbps: authResult.session.speedLimitUpMbps,
        rateLimit: `${authResult.session.speedLimitDownMbps}M/${authResult.session.speedLimitUpMbps}M`,
        message: 'Authorized by AIS Core'
      });
    } else {
      res.status(401).json({
        status: 'FAIL',
        authorized: false,
        message: authResult.message
      });
    }
  });

  app.get('/api/gateway/mikrotik/status', (req, res) => {
    const stats = portalDb.getSystemStats();
    const config = portalDb.getMikroTikConfig();
    res.json({
      status: 'Online',
      system: 'AIS Captive Portal Core',
      gatewayHost: config.host,
      model: config.model,
      routerOsVersion: config.routerOsVersion,
      hotspotServer: config.hotspotServer,
      activeSessions: stats.activeUsersCount,
      activeVouchers: stats.activeVouchersCount,
      timestamp: new Date().toISOString()
    });
  });

  // RouterOS Export Files
  app.get('/api/gateway/mikrotik-login-html', (req, res) => {
    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || `http://localhost:${PORT}`;
    const html = generateMikroTikLoginHtml(appUrl);
    res.setHeader('Content-Disposition', 'attachment; filename="login.html"');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/gateway/mikrotik-alogin-html', (req, res) => {
    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || `http://localhost:${PORT}`;
    const html = generateMikroTikAloginHtml(appUrl);
    res.setHeader('Content-Disposition', 'attachment; filename="alogin.html"');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/gateway/mikrotik-status-html', (req, res) => {
    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || `http://localhost:${PORT}`;
    const html = generateMikroTikStatusHtml(appUrl);
    res.setHeader('Content-Disposition', 'attachment; filename="status.html"');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/gateway/mikrotik-logout-html', (req, res) => {
    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || `http://localhost:${PORT}`;
    const html = generateMikroTikLogoutHtml(appUrl);
    res.setHeader('Content-Disposition', 'attachment; filename="logout.html"');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/gateway/mikrotik-setup-rsc', (req, res) => {
    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || `http://localhost:${PORT}`;
    const config = portalDb.getMikroTikConfig();
    const rsc = generateMikroTikSetupRsc(config, appUrl);
    res.setHeader('Content-Disposition', 'attachment; filename="ais_mikrotik_setup.rsc"');
    res.setHeader('Content-Type', 'text/plain');
    res.send(rsc);
  });

  app.get('/api/gateway/mikrotik-vouchers-rsc', (req, res) => {
    const vouchers = portalDb.getVouchers();
    const rsc = generateMikroTikVouchersRsc(vouchers);
    res.setHeader('Content-Disposition', 'attachment; filename="ais_vouchers_mikrotik.rsc"');
    res.setHeader('Content-Type', 'text/plain');
    res.send(rsc);
  });

  app.get('/api/gateway/mikrotik-vouchers-csv', (req, res) => {
    const vouchers = portalDb.getVouchers();
    const csv = generateMikroTikVouchersCsv(vouchers);
    res.setHeader('Content-Disposition', 'attachment; filename="ais_vouchers_user_manager.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  });

  app.get('/api/gateway/mikrotik-fetch-sync', (req, res) => {
    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || `http://localhost:${PORT}`;
    const rsc = generateMikroTikFetchSyncScript(appUrl);
    res.setHeader('Content-Disposition', 'attachment; filename="ais_mikrotik_sync.rsc"');
    res.setHeader('Content-Type', 'text/plain');
    res.send(rsc);
  });

  app.get('/api/gateway/mikrotik-radius-guide', (req, res) => {
    const guide = getMikroTikRadiusGuide();
    res.json(guide);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AIS Portal] Server started on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AIS Portal] Server startup failed:', err);
});