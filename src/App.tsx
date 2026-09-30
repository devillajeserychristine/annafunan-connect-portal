import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { ActiveSession, AdminUser } from './types';
import { PortalLanding } from './components/PortalLanding';
import { ConnectedStatus } from './components/ConnectedStatus';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { NetworkLabSimulator } from './components/NetworkLabSimulator';

export default function App() {
  const [view, setView] = useState<'portal' | 'admin'>('portal');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = sessionStorage.getItem('ais_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
  const [clientInfo, setClientInfo] = useState<{ 
    ip: string; 
    mac: string; 
    gateway: string; 
    ssid: string;
    portalAction?: string;
    portalZone?: string;
  }>({
    ip: '192.168.88.145',
    mac: '02:A4:6B:7C:89:1E',
    gateway: '192.168.88.1',
    ssid: 'AIS-Campus-WiFi'
  });
  const [showLabSim, setShowLabSim] = useState(false);
  const [redirUrl, setRedirUrl] = useState<string>('https://www.google.com');
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Check URL parameters on mount (supporting MikroTik Hotspot parameters)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // MikroTik sends 'link-orig', 'dst', or 'redirurl'
    const paramRedir = params.get('link-orig') || params.get('dst') || params.get('redirurl');
    // MikroTik sends 'ip' or 'clientip'
    const paramIp = params.get('ip') || params.get('clientip');
    // MikroTik sends 'mac' or 'clientmac'
    const paramMac = params.get('mac') || params.get('clientmac');
    // MikroTik sends 'link-login-only', 'link-login', or 'portal_action'
    const paramPortalAction = params.get('link-login-only') || params.get('link-login') || params.get('portal_action') || params.get('action');
    // MikroTik sends 'server-name', 'server-address', or 'zone'
    const paramPortalZone = params.get('server-name') || params.get('server') || params.get('portal_zone') || params.get('zone');

    if (paramRedir) setRedirUrl(paramRedir);
    if (params.get('admin') !== null || params.get('login') === 'admin') {
      setIsAdminModalOpen(true);
    }
    
    // Check client authorization status
    api.getPortalStatus(paramIp || undefined, paramMac || undefined)
      .then((data) => {
        if (data.detectedClient) {
          setClientInfo(prev => ({
            ...prev,
            ip: paramIp || data.detectedClient.ip || prev.ip,
            mac: paramMac || data.detectedClient.mac || prev.mac,
            gateway: data.detectedClient.gateway || prev.gateway,
            ssid: data.detectedClient.ssid || prev.ssid,
            portalAction: paramPortalAction || prev.portalAction,
            portalZone: paramPortalZone || prev.portalZone
          }));
        }

        if (data.isAuthorized && data.session) {
          setCurrentSession(data.session);
        } else {
          setCurrentSession(null);
        }
      })
      .catch((err) => {
        console.error('Failed to query portal status', err);
      })
      .finally(() => {
        setLoadingInitial(false);
      });
  }, []);

  // Global administrative shortcut listener (Alt+A or Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        if (adminUser) {
          setView(v => v === 'admin' ? 'portal' : 'admin');
        } else {
          setIsAdminModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminUser]);

  // Voucher authentication handler from the single-input landing page
  const handleAuthenticate = async (code: string) => {
    const res = await api.authenticateVoucher({
      voucherCode: code,
      clientIp: clientInfo.ip,
      clientMac: clientInfo.mac,
      hostname: 'Client-Station',
    });

    if (res.success && res.session) {
      setCurrentSession(res.session);

      // MikroTik ED50OUG Captive Portal Handshake:
      // If client was redirected from MikroTik Hotspot (link-login-only / portalAction), post back to MikroTik /login
      if (clientInfo.portalAction) {
        try {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = clientInfo.portalAction;

          // MikroTik username
          const uInput = document.createElement('input');
          uInput.type = 'hidden';
          uInput.name = 'username';
          uInput.value = code;
          form.appendChild(uInput);

          // MikroTik password (same as voucher code in Hotspot voucher setups)
          const pInput = document.createElement('input');
          pInput.type = 'hidden';
          pInput.name = 'password';
          pInput.value = code;
          form.appendChild(pInput);

          // MikroTik destination redirect
          const dstInput = document.createElement('input');
          dstInput.type = 'hidden';
          dstInput.name = 'dst';
          dstInput.value = redirUrl || 'https://www.google.com';
          form.appendChild(dstInput);

          // MikroTik popup flag
          const popupInput = document.createElement('input');
          popupInput.type = 'hidden';
          popupInput.name = 'popup';
          popupInput.value = 'true';
          form.appendChild(popupInput);

          document.body.appendChild(form);
          form.submit();
        } catch (e) {
          console.warn('Could not post to MikroTik Hotspot login form:', e);
        }
      }
    }
    return res;
  };

  // Client disconnect handler
  const handleClientLogout = async () => {
    if (currentSession) {
      await api.clientLogout(currentSession.id, currentSession.clientMac);
      setCurrentSession(null);
    }
  };

  // Admin login success
  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    sessionStorage.setItem('ais_admin_user', JSON.stringify(user));
    setView('admin');
  };

  // Admin logout
  const handleAdminLogout = () => {
    setAdminUser(null);
    sessionStorage.removeItem('ais_admin_user');
    setView('portal');
  };

  // Virtual client switch for networking lab testing
  const handleSelectVirtualClient = async (ip: string, mac: string, hostname: string) => {
    setClientInfo(prev => ({ ...prev, ip, mac }));
    setLoadingInitial(true);
    try {
      const data = await api.getPortalStatus(ip, mac);
      if (data.isAuthorized && data.session) {
        setCurrentSession(data.session);
      } else {
        setCurrentSession(null);
      }
    } finally {
      setLoadingInitial(false);
    }
  };

  if (view === 'admin' && adminUser) {
    return (
      <>
        {showLabSim && (
          <NetworkLabSimulator
            currentIp={clientInfo.ip}
            currentMac={clientInfo.mac}
            onSelectVirtualClient={handleSelectVirtualClient}
            onClose={() => setShowLabSim(false)}
          />
        )}
        <AdminDashboard
          adminUser={adminUser}
          onLogout={handleAdminLogout}
          onReturnToPortal={() => setView('portal')}
          onOpenLabSimulator={() => setShowLabSim(!showLabSim)}
          isSimulatorActive={showLabSim}
          onUserUpdated={setAdminUser}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-sky-50 text-slate-900 flex flex-col font-sans">
      {/* Networking Lab Simulator bar (collapsible banner at top for networking course tests) */}
      {showLabSim && (
        <NetworkLabSimulator
          currentIp={clientInfo.ip}
          currentMac={clientInfo.mac}
          onSelectVirtualClient={handleSelectVirtualClient}
          onClose={() => setShowLabSim(false)}
        />
      )}

      {/* Main View: Connected Screen vs Minimalist Single-Input Landing Page */}
      {currentSession ? (
        <ConnectedStatus
          session={currentSession}
          onDisconnect={handleClientLogout}
          redirUrl={redirUrl}
          adminUser={adminUser}
          onOpenAdmin={() => {
            if (adminUser) setView('admin');
            else setIsAdminModalOpen(true);
          }}
        />
      ) : (
        <PortalLanding
          onAuthenticate={handleAuthenticate}
          clientInfo={clientInfo}
          adminUser={adminUser}
          onOpenAdmin={() => {
            if (adminUser) setView('admin');
            else setIsAdminModalOpen(true);
          }}
          onOpenLabSimulator={() => setShowLabSim(!showLabSim)}
          isSimulatorActive={showLabSim}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
