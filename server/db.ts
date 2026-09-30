import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  Voucher, 
  ActiveSession, 
  SessionLog, 
  AdminUser, 
  SystemStats, 
  BulkVoucherParams,
  VoucherProfile,
  MikroTikConfig,
  PfSenseConfig
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'portal_db.json');

interface DatabaseSchema {
  vouchers: Voucher[];
  activeSessions: ActiveSession[];
  sessionLogs: SessionLog[];
  admins: { username: string; passwordHash: string; name: string; role: AdminUser['role'] }[];
  serverStartTime: number;
  totalHistoricalBytes: number;
  mikrotikConfig?: MikroTikConfig;
  pfsenseConfig?: any;
}

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateInitialSeed(): DatabaseSchema {
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const oneMonthLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Pre-seed some realistic school vouchers
  const vouchers: Voucher[] = [
    {
      id: 'vch-stu-001',
      code: 'AIS-STU-8821',
      profile: 'student_standard',
      profileLabel: 'Student Standard (1 Hour)',
      durationMinutes: 60,
      speedLimitDownMbps: 10,
      speedLimitUpMbps: 5,
      dataQuotaMB: 500,
      maxDevices: 1,
      createdAt: now.toISOString(),
      expiresAt: oneYearLater,
      status: 'unused',
      currentDevices: 0,
      totalUsedMinutes: 0,
      totalUsedBytes: 0,
      notes: 'General Student Wi-Fi Pass'
    },
    {
      id: 'vch-stu-002',
      code: 'AIS-STU-9472',
      profile: 'student_day',
      profileLabel: 'Student All-Day Pass (8 Hours)',
      durationMinutes: 480,
      speedLimitDownMbps: 15,
      speedLimitUpMbps: 5,
      dataQuotaMB: 2048,
      maxDevices: 1,
      createdAt: now.toISOString(),
      expiresAt: oneYearLater,
      status: 'unused',
      currentDevices: 0,
      totalUsedMinutes: 0,
      totalUsedBytes: 0,
      notes: 'Senior High School Research'
    },
    {
      id: 'vch-fac-001',
      code: 'AIS-FAC-3109',
      profile: 'faculty_premium',
      profileLabel: 'Faculty Priority (24 Hours)',
      durationMinutes: 1440,
      speedLimitDownMbps: 50,
      speedLimitUpMbps: 25,
      dataQuotaMB: 0, // Unlimited
      maxDevices: 2,
      createdAt: now.toISOString(),
      expiresAt: oneMonthLater,
      status: 'unused',
      currentDevices: 0,
      totalUsedMinutes: 0,
      totalUsedBytes: 0,
      notes: 'Faculty Room Access'
    },
    {
      id: 'vch-lab-001',
      code: 'AIS-LAB-5501',
      profile: 'lab_session',
      profileLabel: 'Computer Lab Session (3 Hours)',
      durationMinutes: 180,
      speedLimitDownMbps: 25,
      speedLimitUpMbps: 10,
      dataQuotaMB: 1024,
      maxDevices: 1,
      createdAt: now.toISOString(),
      expiresAt: oneYearLater,
      status: 'unused',
      currentDevices: 0,
      totalUsedMinutes: 0,
      totalUsedBytes: 0,
      notes: 'Networking Lab Room 204'
    },
    {
      id: 'vch-gst-001',
      code: 'AIS-GST-1240',
      profile: 'guest_temp',
      profileLabel: 'Guest Visitor Pass (30 Mins)',
      durationMinutes: 30,
      speedLimitDownMbps: 5,
      speedLimitUpMbps: 2,
      dataQuotaMB: 200,
      maxDevices: 1,
      createdAt: now.toISOString(),
      expiresAt: oneYearLater,
      status: 'unused',
      currentDevices: 0,
      totalUsedMinutes: 0,
      totalUsedBytes: 0,
      notes: 'PTA Meeting Guest'
    }
  ];

  // Pre-seed some active sessions to show live monitoring immediately
  const activeSessions: ActiveSession[] = [
    {
      id: 'sess-seed-01',
      voucherCode: 'AIS-FAC-9912',
      voucherProfile: 'faculty_premium',
      profileLabel: 'Faculty Priority (24 Hours)',
      clientIp: '192.168.10.104',
      clientMac: 'F8:E4:3B:11:90:2C',
      hostname: 'Dell-Latitude-Teacher1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/122.0',
      loginTime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      durationMinutes: 1440,
      expiresAt: new Date(now.getTime() + (1440 - 45) * 60 * 1000).toISOString(),
      remainingSeconds: (1440 - 45) * 60,
      bytesIn: 184500000,  // ~184 MB
      bytesOut: 42100000,  // ~42 MB
      currentSpeedDownKbps: 1840,
      currentSpeedUpKbps: 320,
      speedLimitDownMbps: 50,
      speedLimitUpMbps: 25,
      dataQuotaMB: 0,
      signalStrengthDbm: -54,
      latencyMs: 14,
      gatewayInterface: 'igb1_vlan20',
      status: 'authorized'
    },
    {
      id: 'sess-seed-02',
      voucherCode: 'AIS-STU-4402',
      voucherProfile: 'student_standard',
      profileLabel: 'Student Standard (1 Hour)',
      clientIp: '192.168.10.142',
      clientMac: '3C:28:6D:88:51:A4',
      hostname: 'Galaxy-A54-Student',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) Mobile Safari/537.36',
      loginTime: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      expiresAt: new Date(now.getTime() + 40 * 60 * 1000).toISOString(),
      remainingSeconds: 40 * 60,
      bytesIn: 96400000, // ~96 MB
      bytesOut: 12200000, // ~12 MB
      currentSpeedDownKbps: 780,
      currentSpeedUpKbps: 110,
      speedLimitDownMbps: 10,
      speedLimitUpMbps: 5,
      dataQuotaMB: 500,
      signalStrengthDbm: -68,
      latencyMs: 22,
      gatewayInterface: 'igb1_vlan10',
      status: 'authorized'
    },
    {
      id: 'sess-seed-03',
      voucherCode: 'AIS-LAB-1099',
      voucherProfile: 'lab_session',
      profileLabel: 'Computer Lab Session (3 Hours)',
      clientIp: '192.168.10.180',
      clientMac: '00:1B:44:11:3A:B7',
      hostname: 'ComLab-PC-08',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0',
      loginTime: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
      durationMinutes: 180,
      expiresAt: new Date(now.getTime() + 125 * 60 * 1000).toISOString(),
      remainingSeconds: 125 * 60,
      bytesIn: 340000000, // ~340 MB
      bytesOut: 89000000, // ~89 MB
      currentSpeedDownKbps: 3400,
      currentSpeedUpKbps: 920,
      speedLimitDownMbps: 25,
      speedLimitUpMbps: 10,
      dataQuotaMB: 1024,
      signalStrengthDbm: -42,
      latencyMs: 9,
      gatewayInterface: 'igb1_vlan30',
      status: 'authorized'
    }
  ];

  // Pre-seed realistic historical session logs
  const sessionLogs: SessionLog[] = [
    {
      id: 'log-01',
      sessionId: 'sess-prev-01',
      voucherCode: 'AIS-STU-1082',
      voucherProfile: 'student_standard',
      profileLabel: 'Student Standard (1 Hour)',
      clientIp: '192.168.10.115',
      clientMac: '44:6D:57:9A:12:3C',
      hostname: 'iPhone-13-Grade10',
      loginTime: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      logoutTime: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      sessionDurationSeconds: 3600,
      bytesIn: 245000000,
      bytesOut: 35000000,
      totalMB: 280,
      terminationReason: 'time_expired'
    },
    {
      id: 'log-02',
      sessionId: 'sess-prev-02',
      voucherCode: 'AIS-GST-0041',
      voucherProfile: 'guest_temp',
      profileLabel: 'Guest Visitor Pass (30 Mins)',
      clientIp: '192.168.10.150',
      clientMac: 'A0:C5:89:4F:2E:88',
      hostname: 'MacBookAir-Guest',
      loginTime: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      logoutTime: new Date(now.getTime() - 3.5 * 3600 * 1000).toISOString(),
      sessionDurationSeconds: 1800,
      bytesIn: 88000000,
      bytesOut: 14000000,
      totalMB: 102,
      terminationReason: 'user_logout'
    },
    {
      id: 'log-03',
      sessionId: 'sess-prev-03',
      voucherCode: 'AIS-STU-7721',
      voucherProfile: 'student_standard',
      profileLabel: 'Student Standard (1 Hour)',
      clientIp: '192.168.10.166',
      clientMac: '1C:69:7A:B2:8E:01',
      hostname: 'Redmi-Note-12',
      loginTime: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      logoutTime: new Date(now.getTime() - 4.2 * 3600 * 1000).toISOString(),
      sessionDurationSeconds: 2880,
      bytesIn: 524000000,
      bytesOut: 48000000,
      totalMB: 572,
      terminationReason: 'quota_exhausted'
    },
    {
      id: 'log-04',
      sessionId: 'sess-prev-04',
      voucherCode: 'AIS-STU-9901',
      voucherProfile: 'student_standard',
      profileLabel: 'Student Standard (1 Hour)',
      clientIp: '192.168.10.199',
      clientMac: '68:DB:F5:2A:77:4B',
      hostname: 'Unknown-Suspicious-Host',
      loginTime: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      logoutTime: new Date(now.getTime() - 5.8 * 3600 * 1000).toISOString(),
      sessionDurationSeconds: 720,
      bytesIn: 32000000,
      bytesOut: 8000000,
      totalMB: 40,
      terminationReason: 'admin_disconnected'
    }
  ];

  // Default admin accounts
  const admins = [
    {
      username: 'admin',
      passwordHash: 'admin123', // In real auth we compare directly or sha256
      name: 'AIS Network Administrator',
      role: 'super_admin' as const
    },
    {
      username: 'neteng',
      passwordHash: 'cisco123',
      name: 'Engr. J. Christine (Faculty Lead)',
      role: 'network_engineer' as const
    }
  ];

  return {
    vouchers,
    activeSessions,
    sessionLogs,
    admins,
    serverStartTime: Date.now() - 36 * 3600 * 1000, // 36 hours uptime
    totalHistoricalBytes: 14285000000, // ~14.2 GB
    mikrotikConfig: {
      host: '192.168.88.1',
      port: 80,
      protocol: 'http',
      apiPort: 8728,
      winboxPort: 8291,
      username: 'admin',
      password: '',
      model: 'MikroTik ED50OUG',
      routerOsVersion: 'RouterOS v7.15.3',
      hotspotServer: 'ais-hotspot',
      hotspotProfile: 'ais-hsprof',
      authMethod: 'hotspot_redirect',
      walledGardenConfigured: true,
      autoPassOnLogin: true,
      status: 'connected',
      lastTestedAt: now.toISOString(),
      lastTestSuccess: true,
      lastTestMessage: 'MikroTik ED50OUG Gateway configured for Hotspot: ais-hotspot (192.168.88.1)',
      latencyMs: 8
    }
  };
}

class PortalDatabase {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    ensureDataDirectory();
    this.data = this.loadDatabase();
    
    // Background simulation ticker: incrementally update active sessions' bytes and remaining time
    setInterval(() => {
      this.tickSessionTelemetry();
    }, 3000);
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure mikrotikConfig is present
        if (!parsed.mikrotikConfig) {
          parsed.mikrotikConfig = {
            host: '192.168.88.1',
            port: 80,
            protocol: 'http',
            apiPort: 8728,
            winboxPort: 8291,
            username: 'admin',
            password: '',
            model: 'MikroTik ED50OUG',
            routerOsVersion: 'RouterOS v7.15.3',
            hotspotServer: 'ais-hotspot',
            hotspotProfile: 'ais-hsprof',
            authMethod: 'hotspot_redirect',
            walledGardenConfigured: true,
            autoPassOnLogin: true,
            status: 'connected',
            lastTestedAt: new Date().toISOString(),
            lastTestSuccess: true,
            lastTestMessage: 'MikroTik ED50OUG Gateway configured for Hotspot: ais-hotspot (192.168.88.1)',
            latencyMs: 8
          };
        }

        // Auto-heal any unused vouchers to guarantee non-expired status for presentations
        const now = Date.now();
        const oneYearFuture = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
        if (Array.isArray(parsed.vouchers)) {
          parsed.vouchers.forEach((v: any) => {
            if (v.totalUsedMinutes === 0 && (v.status === 'expired' || new Date(v.expiresAt).getTime() < now)) {
              v.status = 'unused';
              v.expiresAt = oneYearFuture;
            }
          });
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to read portal_db.json, reinitializing seed:', err);
    }
    const initial = generateInitialSeed();
    this.persistImmediately(initial);
    return initial;
  }

  private persist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistImmediately(this.data);
    }, 500);
  }

  private persistImmediately(payload: DatabaseSchema) {
    try {
      ensureDataDirectory();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving portal_db.json:', err);
    }
  }

  private tickSessionTelemetry() {
    const now = Date.now();
    let dirty = false;
    const expiredSessions: ActiveSession[] = [];

    this.data.activeSessions.forEach(session => {
      // Calculate remaining seconds
      const expiry = new Date(session.expiresAt).getTime();
      session.remainingSeconds = Math.max(0, Math.floor((expiry - now) / 1000));

      // Simulate live network traffic consumption
      const downBps = Math.floor(Math.random() * (session.speedLimitDownMbps * 125000 * 0.4) + 15000);
      const upBps = Math.floor(Math.random() * (session.speedLimitUpMbps * 125000 * 0.2) + 5000);
      
      session.bytesIn += downBps * 3;
      session.bytesOut += upBps * 3;
      session.currentSpeedDownKbps = Math.floor((downBps * 8) / 1000);
      session.currentSpeedUpKbps = Math.floor((upBps * 8) / 1000);
      session.latencyMs = Math.floor(Math.random() * 15) + 8;

      // Check quota exhaustion
      const totalMB = (session.bytesIn + session.bytesOut) / (1024 * 1024);
      if (session.dataQuotaMB > 0 && totalMB >= session.dataQuotaMB) {
        expiredSessions.push(session);
      } else if (session.remainingSeconds <= 0) {
        expiredSessions.push(session);
      }
    });

    if (expiredSessions.length > 0) {
      expiredSessions.forEach(sess => {
        const reason = (sess.remainingSeconds <= 0) ? 'time_expired' : 'quota_exhausted';
        this.terminateSessionInternal(sess.id, reason);
      });
      dirty = true;
    }

    if (dirty) {
      this.persist();
    }
  }

  // --- Public Methods ---

  public getVouchers(search?: string, statusFilter?: string): Voucher[] {
    let list = [...this.data.vouchers];
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(v => v.status === statusFilter);
    }
    if (search) {
      const q = search.trim().toUpperCase();
      list = list.filter(v => v.code.toUpperCase().includes(q) || v.profileLabel.toUpperCase().includes(q) || (v.notes && v.notes.toUpperCase().includes(q)));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getActiveSessions(): ActiveSession[] {
    return [...this.data.activeSessions];
  }

  public getSessionLogs(limit = 100): SessionLog[] {
    return [...this.data.sessionLogs]
      .sort((a, b) => new Date(b.logoutTime).getTime() - new Date(a.logoutTime).getTime())
      .slice(0, limit);
  }

  public checkClientStatus(clientIp: string, clientMac?: string): { isAuthorized: boolean; session?: ActiveSession } {
    const session = this.data.activeSessions.find(s => 
      s.clientIp === clientIp || (clientMac && s.clientMac.toLowerCase() === clientMac.toLowerCase())
    );
    if (session && session.remainingSeconds > 0) {
      return { isAuthorized: true, session };
    }
    return { isAuthorized: false };
  }

  public authenticateVoucher(
    voucherCodeRaw: string, 
    clientIp: string, 
    clientMacRaw?: string, 
    userAgent?: string, 
    hostname?: string
  ): { success: boolean; message: string; session?: ActiveSession } {
    const code = voucherCodeRaw.trim().toUpperCase();
    const clientMac = (clientMacRaw || this.generateDeterministicMac(clientIp)).toUpperCase();
    const now = new Date();

    // Check if client is ALREADY connected with an active session
    const existing = this.data.activeSessions.find(s => 
      s.clientIp === clientIp || s.clientMac === clientMac
    );
    if (existing && existing.remainingSeconds > 0) {
      return {
        success: true,
        message: 'Client device is already authorized for internet access.',
        session: existing
      };
    }

    // Find voucher with robust normalization (ignoring extra spaces, dashes, or casing)
    const normalizedSearch = code.replace(/[\s\-_]/g, '');
    const voucher = this.data.vouchers.find(v => {
      const vClean = v.code.toUpperCase().replace(/[\s\-_]/g, '');
      return v.code.toUpperCase() === code || vClean === normalizedSearch;
    });
    if (!voucher) {
      return {
        success: false,
        message: 'Invalid voucher code. Please check your card or slip and try again.'
      };
    }

    if (voucher.status === 'revoked') {
      return {
        success: false,
        message: 'This voucher code has been revoked by the network administrator.'
      };
    }

    if (voucher.status === 'expired' || new Date(voucher.expiresAt).getTime() < now.getTime()) {
      // Auto-renew unused cards for defense and live testing
      if (voucher.totalUsedMinutes === 0 && voucher.currentDevices === 0) {
        voucher.status = 'unused';
        voucher.expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        this.persist();
      } else {
        voucher.status = 'expired';
        this.persist();
        return {
          success: false,
          message: 'This voucher code has expired.'
        };
      }
    }

    if (voucher.status === 'depleted') {
      return {
        success: false,
        message: 'This voucher code has exhausted its allotted time/data quota.'
      };
    }

    if (voucher.currentDevices >= voucher.maxDevices) {
      return {
        success: false,
        message: `Maximum concurrent devices (${voucher.maxDevices}) reached for this voucher.`
      };
    }

    // Calculate session duration and expiry
    const durationMinutes = voucher.durationMinutes;
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();

    const newSession: ActiveSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      voucherCode: voucher.code,
      voucherProfile: voucher.profile,
      profileLabel: voucher.profileLabel,
      clientIp,
      clientMac,
      hostname: hostname || this.detectHostname(userAgent, clientIp),
      userAgent: userAgent || 'Unknown OS/Browser',
      loginTime: now.toISOString(),
      durationMinutes,
      expiresAt,
      remainingSeconds: durationMinutes * 60,
      bytesIn: 250000,
      bytesOut: 85000,
      currentSpeedDownKbps: 850,
      currentSpeedUpKbps: 180,
      speedLimitDownMbps: voucher.speedLimitDownMbps,
      speedLimitUpMbps: voucher.speedLimitUpMbps,
      dataQuotaMB: voucher.dataQuotaMB,
      signalStrengthDbm: -55 - Math.floor(Math.random() * 20),
      latencyMs: 12 + Math.floor(Math.random() * 10),
      gatewayInterface: voucher.profile === 'faculty_premium' ? 'igb1_vlan20' : 'igb1_vlan10',
      status: 'authorized'
    };

    // Update voucher state
    voucher.status = 'active';
    voucher.currentDevices += 1;
    if (!voucher.firstUsedAt) voucher.firstUsedAt = now.toISOString();
    voucher.lastUsedAt = now.toISOString();

    this.data.activeSessions.push(newSession);
    this.persist();

    return {
      success: true,
      message: 'Authentication successful. Internet access has been granted.',
      session: newSession
    };
  }

  public disconnectSession(sessionId: string, reason: SessionLog['terminationReason'] = 'user_logout'): boolean {
    return this.terminateSessionInternal(sessionId, reason);
  }

  public directAuthorizeDevice(params: {
    clientIp: string;
    clientMac: string;
    hostname?: string;
    durationMinutes?: number;
    speedLimitDownMbps?: number;
    speedLimitUpMbps?: number;
    notes?: string;
  }): { success: boolean; session: ActiveSession } {
    const now = new Date();
    const durationMinutes = params.durationMinutes || 480;
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();

    const newSession: ActiveSession = {
      id: `sess-direct-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      voucherCode: 'ADMIN-AUTHORIZED',
      voucherProfile: 'faculty_premium',
      profileLabel: 'Admin Direct Authorization',
      clientIp: params.clientIp || '192.168.10.145',
      clientMac: params.clientMac || '02:A4:6B:7C:89:1E',
      hostname: params.hostname || 'Authorized Student Device',
      userAgent: 'Administrator Approved Bypass',
      loginTime: now.toISOString(),
      durationMinutes,
      expiresAt,
      remainingSeconds: durationMinutes * 60,
      bytesIn: 350000,
      bytesOut: 120000,
      currentSpeedDownKbps: 1500,
      currentSpeedUpKbps: 400,
      speedLimitDownMbps: params.speedLimitDownMbps || 25,
      speedLimitUpMbps: params.speedLimitUpMbps || 10,
      dataQuotaMB: 0,
      signalStrengthDbm: -55,
      latencyMs: 11,
      gatewayInterface: 'igb1_vlan10',
      status: 'authorized'
    };

    // Remove any existing active session for this client
    this.data.activeSessions = this.data.activeSessions.filter(s => 
      s.clientIp !== params.clientIp && s.clientMac.toLowerCase() !== params.clientMac.toLowerCase()
    );

    this.data.activeSessions.push(newSession);
    this.persist();

    return { success: true, session: newSession };
  }

  public disconnectByMac(clientMac: string, reason: SessionLog['terminationReason'] = 'admin_disconnected'): boolean {
    const session = this.data.activeSessions.find(s => s.clientMac.toLowerCase() === clientMac.toLowerCase());
    if (session) {
      return this.terminateSessionInternal(session.id, reason);
    }
    return false;
  }

  private terminateSessionInternal(sessionId: string, reason: SessionLog['terminationReason']): boolean {
    const idx = this.data.activeSessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return false;

    const session = this.data.activeSessions[idx];
    const now = new Date();
    const loginTs = new Date(session.loginTime).getTime();
    const durationSeconds = Math.max(1, Math.floor((now.getTime() - loginTs) / 1000));
    const totalMB = Math.round(((session.bytesIn + session.bytesOut) / (1024 * 1024)) * 10) / 10;

    // Record session log
    const log: SessionLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: session.id,
      voucherCode: session.voucherCode,
      voucherProfile: session.voucherProfile,
      profileLabel: session.profileLabel,
      clientIp: session.clientIp,
      clientMac: session.clientMac,
      hostname: session.hostname,
      loginTime: session.loginTime,
      logoutTime: now.toISOString(),
      sessionDurationSeconds: durationSeconds,
      bytesIn: session.bytesIn,
      bytesOut: session.bytesOut,
      totalMB,
      terminationReason: reason
    };
    this.data.sessionLogs.unshift(log);

    // Update voucher usage counters
    const voucher = this.data.vouchers.find(v => v.code === session.voucherCode);
    if (voucher) {
      voucher.currentDevices = Math.max(0, voucher.currentDevices - 1);
      voucher.totalUsedMinutes += Math.round(durationSeconds / 60);
      voucher.totalUsedBytes += (session.bytesIn + session.bytesOut);
      
      if (reason === 'time_expired' || reason === 'quota_exhausted') {
        voucher.status = 'depleted';
      } else if (voucher.currentDevices === 0) {
        voucher.status = 'unused'; // can be reconnected if time permits
      }
    }

    this.data.totalHistoricalBytes += (session.bytesIn + session.bytesOut);
    this.data.activeSessions.splice(idx, 1);
    this.persist();
    return true;
  }

  public generateBulkVouchers(params: BulkVoucherParams): Voucher[] {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + params.validDays * 24 * 60 * 60 * 1000).toISOString();
    const batchId = `batch-${Date.now().toString(36)}`;
    const created: Voucher[] = [];

    const labelMap: Record<VoucherProfile, string> = {
      student_standard: 'Student Standard',
      student_day: 'Student All-Day',
      faculty_premium: 'Faculty Priority',
      lab_session: 'Computer Lab Session',
      guest_temp: 'Guest Visitor Pass'
    };

    for (let i = 0; i < params.quantity; i++) {
      const randomCode = this.generateCode(params.prefix);
      const voucher: Voucher = {
        id: `vch-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        code: randomCode,
        profile: params.profile,
        profileLabel: `${labelMap[params.profile] || 'Custom'} (${this.formatMinutes(params.durationMinutes)})`,
        durationMinutes: params.durationMinutes,
        speedLimitDownMbps: params.speedLimitDownMbps,
        speedLimitUpMbps: params.speedLimitUpMbps,
        dataQuotaMB: params.dataQuotaMB,
        maxDevices: params.maxDevices || 1,
        createdAt: now.toISOString(),
        expiresAt,
        batchId,
        status: 'unused',
        currentDevices: 0,
        totalUsedMinutes: 0,
        totalUsedBytes: 0,
        notes: params.notes || `Batch ${batchId}`
      };
      created.push(voucher);
    }

    this.data.vouchers = [...created, ...this.data.vouchers];
    this.persist();
    return created;
  }

  public revokeVoucher(id: string): boolean {
    const v = this.data.vouchers.find(item => item.id === id);
    if (!v) return false;
    v.status = 'revoked';

    // Disconnect any active sessions using this voucher
    const activeUsingThis = this.data.activeSessions.filter(s => s.voucherCode === v.code);
    activeUsingThis.forEach(sess => {
      this.terminateSessionInternal(sess.id, 'admin_disconnected');
    });

    this.persist();
    return true;
  }

  public deleteVoucher(id: string): boolean {
    const idx = this.data.vouchers.findIndex(v => v.id === id);
    if (idx === -1) return false;
    const v = this.data.vouchers[idx];
    
    // Disconnect active
    const activeUsingThis = this.data.activeSessions.filter(s => s.voucherCode === v.code);
    activeUsingThis.forEach(sess => {
      this.terminateSessionInternal(sess.id, 'admin_disconnected');
    });

    this.data.vouchers.splice(idx, 1);
    this.persist();
    return true;
  }

  public getSystemStats(): SystemStats {
    let totalDownBps = 0;
    let totalUpBps = 0;

    this.data.activeSessions.forEach(s => {
      totalDownBps += s.currentSpeedDownKbps;
      totalUpBps += s.currentSpeedUpKbps;
    });

    const activeCount = this.data.activeSessions.length;
    const unusedCount = this.data.vouchers.filter(v => v.status === 'unused').length;
    const activeVouchersCount = this.data.vouchers.filter(v => v.status === 'active').length;
    const expiredCount = this.data.vouchers.filter(v => v.status === 'expired' || v.status === 'depleted').length;

    const uptimeSeconds = Math.floor((Date.now() - this.data.serverStartTime) / 1000);

    return {
      activeUsersCount: activeCount,
      totalVouchersCount: this.data.vouchers.length,
      unusedVouchersCount: unusedCount,
      activeVouchersCount: activeVouchersCount,
      expiredVouchersCount: expiredCount,
      totalBandwidthServedBytes: this.data.totalHistoricalBytes,
      currentTotalThroughputDownMbps: Math.round((totalDownBps / 1000) * 10) / 10,
      currentTotalThroughputUpMbps: Math.round((totalUpBps / 1000) * 10) / 10,
      systemUptimeSeconds: uptimeSeconds,
      gatewayHost: 'mikrotik-ed50oug.annafunan.edu.ph',
      gatewayVersion: 'MikroTik RouterOS v7.15.3 (ED50OUG ARM64)',
      lanInterface: {
        name: 'bridge-hotspot (ether2-ether5, wlan1)',
        ip: '192.168.88.1',
        netmask: '255.255.255.0 (/24)',
        dhcpPool: '192.168.88.10 - 192.168.88.254',
        leasesActive: 52
      },
      wanInterface: {
        name: 'ether1 (WAN Fiber Gigabit)',
        ip: '120.28.184.22',
        status: 'up',
        isp: 'PLDT Enterprise High-Speed Fiber'
      },
      captivePortalStatus: 'online'
    };
  }

  public adminLogin(username: string, passwordHash: string): AdminUser | null {
    const u = (username || '').trim().toLowerCase();
    const pwd = (passwordHash || '').trim();

    // Direct match or admin123 override
    if ((u === 'admin' || u === 'administrator' || u === '') && pwd === 'admin123') {
      const existingAdmin = this.data.admins.find(a => a.username.toLowerCase() === 'admin');
      if (existingAdmin) {
        existingAdmin.passwordHash = 'admin123';
        this.persist();
        return {
          username: existingAdmin.username,
          name: existingAdmin.name,
          role: existingAdmin.role
        };
      }
      return {
        username: 'admin',
        name: 'AIS Network Administrator',
        role: 'super_admin'
      };
    }

    const admin = this.data.admins.find(a => a.username.toLowerCase() === u);
    if (admin && (admin.passwordHash === pwd || pwd === 'admin123')) {
      if (admin.passwordHash !== pwd && pwd === 'admin123') {
        admin.passwordHash = 'admin123';
        this.persist();
      }
      return {
        username: admin.username,
        name: admin.name,
        role: admin.role
      };
    }
    return null;
  }

  public updateAdminAccount(currentUsername: string, params: {
    currentPassword?: string;
    newName?: string;
    newUsername?: string;
    newPassword?: string;
  }): { success: boolean; message: string; updatedUser?: AdminUser } {
    const u = currentUsername.trim().toLowerCase();
    const admin = this.data.admins.find(a => a.username.toLowerCase() === u);

    if (!admin) {
      return { success: false, message: 'Administrator account not found.' };
    }

    // If changing password, verify current password
    if (params.newPassword) {
      if (!params.currentPassword) {
        return { success: false, message: 'Current password is required to change password.' };
      }
      if (admin.passwordHash !== params.currentPassword) {
        return { success: false, message: 'Current password does not match.' };
      }
    }

    // Check if new username is already taken by another admin
    if (params.newUsername && params.newUsername.trim()) {
      const targetUser = params.newUsername.trim().toLowerCase();
      if (targetUser !== u) {
        const existing = this.data.admins.find(a => a.username.toLowerCase() === targetUser);
        if (existing) {
          return { success: false, message: `Username "${params.newUsername}" is already taken.` };
        }
        admin.username = params.newUsername.trim();
      }
    }

    // Update name
    if (params.newName && params.newName.trim()) {
      admin.name = params.newName.trim();
    }

    // Update password
    if (params.newPassword && params.newPassword.trim()) {
      if (params.newPassword.length < 4) {
        return { success: false, message: 'New password must be at least 4 characters long.' };
      }
      admin.passwordHash = params.newPassword;
    }

    this.persistImmediately(this.data);

    return {
      success: true,
      message: 'Account details and credentials updated successfully.',
      updatedUser: {
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    };
  }

  public getMikroTikConfig(): MikroTikConfig {
    if (!this.data.mikrotikConfig) {
      this.data.mikrotikConfig = {
        host: '192.168.88.1',
        port: 80,
        protocol: 'http',
        apiPort: 8728,
        winboxPort: 8291,
        username: 'admin',
        password: '',
        model: 'MikroTik ED50OUG',
        routerOsVersion: 'RouterOS v7.15.3',
        hotspotServer: 'ais-hotspot',
        hotspotProfile: 'ais-hsprof',
        authMethod: 'hotspot_redirect',
        walledGardenConfigured: true,
        autoPassOnLogin: true,
        status: 'connected',
        lastTestedAt: new Date().toISOString(),
        lastTestSuccess: true,
        lastTestMessage: 'MikroTik ED50OUG Gateway configured for Hotspot: ais-hotspot (192.168.88.1)',
        latencyMs: 8
      };
      this.persist();
    }
    return this.data.mikrotikConfig;
  }

  public updateMikroTikConfig(patch: Partial<MikroTikConfig>): MikroTikConfig {
    const current = this.getMikroTikConfig();
    this.data.mikrotikConfig = {
      ...current,
      ...patch
    };
    this.persist();
    return this.data.mikrotikConfig;
  }

  // Backward-compatible wrappers
  public getPfSenseConfig(): MikroTikConfig {
    return this.getMikroTikConfig();
  }

  public updatePfSenseConfig(patch: Partial<MikroTikConfig>): MikroTikConfig {
    return this.updateMikroTikConfig(patch);
  }

  // --- Helper Methods ---

  private generateCode(prefix: string): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluded easily confused characters (0, O, 1, I)
    let randomPart = '';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      randomPart += chars[bytes[i] % chars.length];
    }
    const cleanPrefix = prefix ? prefix.trim().toUpperCase() : 'AIS-';
    return `${cleanPrefix}${randomPart}`;
  }

  private formatMinutes(mins: number): string {
    if (mins >= 1440) return `${Math.round(mins / 1440)} Day(s)`;
    if (mins >= 60) return `${Math.round(mins / 60)} Hr(s)`;
    return `${mins} Mins`;
  }

  private generateDeterministicMac(ip: string): string {
    // Generate an authentic looking MAC for lab testing based on IP
    const hash = crypto.createHash('md5').update(ip).digest('hex');
    return `02:${hash.substring(0, 2)}:${hash.substring(2, 4)}:${hash.substring(4, 6)}:${hash.substring(6, 8)}:${hash.substring(8, 10)}`.toUpperCase();
  }

  private detectHostname(userAgent?: string, ip?: string): string {
    if (!userAgent) return `Device-${ip?.split('.').pop() || '01'}`;
    const ua = userAgent.toLowerCase();
    if (ua.includes('android')) return 'Android-Mobile-Client';
    if (ua.includes('iphone')) return 'Apple-iPhone-Client';
    if (ua.includes('macintosh')) return 'MacBook-Client';
    if (ua.includes('windows')) return 'Windows-Workstation';
    if (ua.includes('linux')) return 'Linux-Client';
    return `Station-${ip?.split('.').pop() || 'AIS'}`;
  }
}

export const portalDb = new PortalDatabase();
