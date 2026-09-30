export type VoucherProfile = 'student_standard' | 'student_day' | 'faculty_premium' | 'lab_session' | 'guest_temp';

export interface Voucher {
  id: string;
  code: string;
  profile: VoucherProfile;
  profileLabel: string;
  durationMinutes: number; // e.g. 60, 480, 1440
  speedLimitDownMbps: number; // e.g. 10
  speedLimitUpMbps: number;   // e.g. 5
  dataQuotaMB: number; // 0 = unlimited, or e.g. 1024 (1GB)
  maxDevices: number; // usually 1
  createdAt: string;
  expiresAt: string;
  batchId?: string;
  status: 'unused' | 'active' | 'expired' | 'depleted' | 'revoked';
  currentDevices: number;
  totalUsedMinutes: number;
  totalUsedBytes: number;
  firstUsedAt?: string;
  lastUsedAt?: string;
  notes?: string;
}

export interface ActiveSession {
  id: string;
  voucherCode: string;
  voucherProfile: VoucherProfile;
  profileLabel: string;
  clientIp: string;
  clientMac: string;
  hostname?: string;
  userAgent?: string;
  loginTime: string;
  durationMinutes: number;
  expiresAt: string;
  remainingSeconds: number;
  bytesIn: number;  // Download bytes
  bytesOut: number; // Upload bytes
  currentSpeedDownKbps: number;
  currentSpeedUpKbps: number;
  speedLimitDownMbps: number;
  speedLimitUpMbps: number;
  dataQuotaMB: number;
  signalStrengthDbm: number;
  latencyMs: number;
  gatewayInterface: string;
  status: 'authorized' | 'terminating' | 'expired';
}

export interface SessionLog {
  id: string;
  sessionId: string;
  voucherCode: string;
  voucherProfile: VoucherProfile;
  profileLabel: string;
  clientIp: string;
  clientMac: string;
  hostname?: string;
  loginTime: string;
  logoutTime: string;
  sessionDurationSeconds: number;
  bytesIn: number;
  bytesOut: number;
  totalMB: number;
  terminationReason: 'user_logout' | 'time_expired' | 'quota_exhausted' | 'admin_disconnected' | 'idle_timeout';
}

export interface AdminUser {
  username: string;
  name: string;
  role: 'super_admin' | 'network_engineer' | 'lab_instructor';
}

export interface SystemStats {
  activeUsersCount: number;
  totalVouchersCount: number;
  unusedVouchersCount: number;
  activeVouchersCount: number;
  expiredVouchersCount: number;
  totalBandwidthServedBytes: number;
  currentTotalThroughputDownMbps: number;
  currentTotalThroughputUpMbps: number;
  systemUptimeSeconds: number;
  gatewayHost: string;
  gatewayVersion: string;
  lanInterface: {
    name: string;
    ip: string;
    netmask: string;
    dhcpPool: string;
    leasesActive: number;
  };
  wanInterface: {
    name: string;
    ip: string;
    status: 'up' | 'down';
    isp: string;
  };
  captivePortalStatus: 'online' | 'degraded' | 'maintenance';
}

export interface BulkVoucherParams {
  quantity: number;
  prefix: string;
  profile: VoucherProfile;
  durationMinutes: number;
  speedLimitDownMbps: number;
  speedLimitUpMbps: number;
  dataQuotaMB: number;
  maxDevices: number;
  validDays: number;
  notes?: string;
}

export interface ClientNetworkContext {
  clientIp: string;
  clientMac: string;
  gatewayIp: string;
  ssid: string;
  redirurl?: string;
  isSimulated?: boolean;
  linkLoginOnly?: string;
  linkLogin?: string;
  linkOrig?: string;
  serverName?: string;
  serverAddress?: string;
  interfaceName?: string;
  chapId?: string;
  chapChallenge?: string;
  error?: string;
  portalAction?: string;
  portalZone?: string;
}

export interface MikroTikConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiPort: number;
  winboxPort: number;
  username: string;
  password?: string;
  model: string;
  routerOsVersion: string;
  hotspotServer: string;
  hotspotProfile: string;
  authMethod: 'hotspot_redirect' | 'routeros_rest' | 'routeros_api' | 'radius_usermanager';
  walledGardenConfigured: boolean;
  autoPassOnLogin: boolean;
  status: 'connected' | 'unreachable' | 'configured' | 'testing';
  lastTestedAt?: string;
  lastTestSuccess?: boolean;
  lastTestMessage?: string;
  latencyMs?: number;
}

export interface MikroTikTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  statusCode?: number;
  targetUrl: string;
  isPrivateIp?: boolean;
  detectedPorts?: { http: boolean; api: boolean; winbox: boolean };
  details?: string;
  config?: MikroTikConfig;
}

// Backward-compatible type aliases
export type PfSenseConfig = MikroTikConfig;
export type PfSenseTestResult = MikroTikTestResult;

