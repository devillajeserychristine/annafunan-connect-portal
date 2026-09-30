import { 
  Voucher, 
  ActiveSession, 
  SessionLog, 
  SystemStats, 
  AdminUser, 
  BulkVoucherParams,
  MikroTikConfig,
  MikroTikTestResult,
  PfSenseConfig,
  PfSenseTestResult
} from '../types';

export const api = {
  async getPortalStatus(clientIp?: string, clientMac?: string): Promise<{ 
    isAuthorized: boolean; 
    session?: ActiveSession;
    detectedClient: { ip: string; mac: string; gateway: string; ssid: string; };
  }> {
    const params = new URLSearchParams();
    if (clientIp) params.set('clientip', clientIp);
    if (clientMac) params.set('clientmac', clientMac);
    
    const res = await fetch(`/api/portal/status?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch portal status');
    return res.json();
  },

  async authenticateVoucher(params: {
    voucherCode: string;
    clientIp?: string;
    clientMac?: string;
    userAgent?: string;
    hostname?: string;
  }): Promise<{ success: boolean; message: string; session?: ActiveSession }> {
    const res = await fetch('/api/auth/voucher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async clientLogout(sessionId?: string, clientMac?: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/portal/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, clientMac }),
    });
    return res.json();
  },

  async adminLogin(username: string, password: string): Promise<{ success: boolean; user?: AdminUser; message?: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async updateAdminAccount(params: {
    currentUsername: string;
    currentPassword?: string;
    newName?: string;
    newUsername?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; message: string; updatedUser?: AdminUser }> {
    const res = await fetch('/api/admin/update-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async authorizeDevice(params: {
    clientIp: string;
    clientMac: string;
    hostname?: string;
    durationMinutes?: number;
    speedLimitDownMbps?: number;
    speedLimitUpMbps?: number;
    notes?: string;
  }): Promise<{ success: boolean; session?: ActiveSession; message?: string }> {
    const res = await fetch('/api/admin/authorize-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getVouchers(search?: string, status?: string): Promise<Voucher[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const res = await fetch(`/api/vouchers?${params.toString()}`);
    return res.json();
  },

  async generateBulkVouchers(payload: BulkVoucherParams): Promise<{ success: boolean; count: number; vouchers: Voucher[] }> {
    const res = await fetch('/api/vouchers/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async revokeVoucher(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/vouchers/${id}/revoke`, { method: 'POST' });
    return res.json();
  },

  async deleteVoucher(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getActiveSessions(): Promise<ActiveSession[]> {
    const res = await fetch('/api/sessions');
    return res.json();
  },

  async disconnectSession(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/sessions/${id}/disconnect`, { method: 'POST' });
    return res.json();
  },

  async disconnectByMac(clientMac: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/sessions/disconnect-mac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientMac }),
    });
    return res.json();
  },

  async getSessionLogs(limit = 100): Promise<SessionLog[]> {
    const res = await fetch(`/api/logs?limit=${limit}`);
    return res.json();
  },

  async getSystemStats(): Promise<SystemStats> {
    const res = await fetch('/api/stats');
    return res.json();
  },

  async getMikroTikRadiusGuide(): Promise<any> {
    const res = await fetch('/api/gateway/mikrotik-radius-guide');
    return res.json();
  },

  async getMikroTikConfig(): Promise<MikroTikConfig> {
    const res = await fetch('/api/gateway/mikrotik/config');
    return res.json();
  },

  async updateMikroTikConfig(config: Partial<MikroTikConfig>): Promise<{ success: boolean; config: MikroTikConfig }> {
    const res = await fetch('/api/gateway/mikrotik/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async testMikroTikConnection(config?: Partial<MikroTikConfig>): Promise<MikroTikTestResult> {
    const res = await fetch('/api/gateway/mikrotik/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || {}),
    });
    return res.json();
  },

  async getMikroTikStatus(): Promise<any> {
    const res = await fetch('/api/gateway/mikrotik/status');
    return res.json();
  },

  // Backward-compatible wrappers
  async getRadiusGuide(): Promise<any> {
    return this.getMikroTikRadiusGuide();
  },

  async getPfSenseConfig(): Promise<MikroTikConfig> {
    return this.getMikroTikConfig();
  },

  async updatePfSenseConfig(config: Partial<MikroTikConfig>): Promise<{ success: boolean; config: MikroTikConfig }> {
    return this.updateMikroTikConfig(config);
  },

  async testPfSenseConnection(config?: Partial<MikroTikConfig>): Promise<MikroTikTestResult> {
    return this.testMikroTikConnection(config);
  },

  async getPfSenseStatus(): Promise<any> {
    return this.getMikroTikStatus();
  }
};
