import React, { useState } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Radio, 
  Ticket, 
  FileText, 
  Network, 
  LogOut, 
  Wifi, 
  User, 
  Layers,
  ArrowLeft,
  Sparkles,
  UserCog
} from 'lucide-react';
import { AdminUser } from '../types';
import { SystemStatsView } from './SystemStatsView';
import { ConnectedDevices } from './ConnectedDevices';
import { VoucherManager } from './VoucherManager';
import { SessionLogs } from './SessionLogs';
import { GatewayToolkit } from './GatewayToolkit';
import { AccountCenter } from './AccountCenter';

interface AdminDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onReturnToPortal: () => void;
  onOpenLabSimulator: () => void;
  isSimulatorActive?: boolean;
  onUserUpdated?: (user: AdminUser) => void;
}

type TabType = 'overview' | 'sessions' | 'vouchers' | 'logs' | 'gateway' | 'account';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
  onReturnToPortal,
  onOpenLabSimulator,
  isSimulatorActive,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/school-seal.svg" 
            alt="Annafunan Integrated School Logo" 
            referrerPolicy="no-referrer" 
            className="w-11 h-11 object-contain drop-shadow-sm shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                Annafunan Integrated School
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Admin Gateway
              </span>
            </div>
          </div>
        </div>

        {/* User badge and actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Networking Course Lab Toggle */}
          <button
            id="btn-admin-lab-sim"
            type="button"
            onClick={onOpenLabSimulator}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all border font-medium ${
              isSimulatorActive
                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                : 'bg-slate-850 bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-blue-500/60'
            }`}
            title="Networking Course: Virtual Client & Gateway Simulator"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Network Lab</span> Sim
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              activeTab === 'account'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
            title="Account Center: Change Admin Name & Password"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white">{adminUser.name}</span>
            <span className="text-slate-500">({adminUser.role.replace('_', ' ')})</span>
          </button>

          <button
            onClick={onReturnToPortal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Preview Student Portal Landing"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Student View</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-900/50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Log out from Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 sm:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          {[
            { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
            { id: 'sessions', label: 'Connected Devices', icon: Radio },
            { id: 'vouchers', label: 'Voucher Inventory', icon: Ticket },
            { id: 'logs', label: 'Session Audit Logs', icon: FileText },
            { id: 'gateway', label: 'MikroTik ED50OUG Gateway', icon: Network },
            { id: 'account', label: 'Account Center', icon: UserCog },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && <SystemStatsView />}
        {activeTab === 'sessions' && <ConnectedDevices />}
        {activeTab === 'vouchers' && <VoucherManager />}
        {activeTab === 'logs' && <SessionLogs />}
        {activeTab === 'gateway' && <GatewayToolkit />}
        {activeTab === 'account' && <AccountCenter adminUser={adminUser} onUserUpdated={onUserUpdated} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 sm:px-8 py-4 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Annafunan Integrated School &bull; Network & Systems Administration Office
        </div>
        <div className="flex items-center gap-3">
          <span>MikroTik RouterOS v7.15 (ED50OUG)</span>
          <span>&bull;</span>
          <span>RouterBOARD Hotspot</span>
          <span>&bull;</span>
          <span className="text-emerald-400">RouterOS Online</span>
        </div>
      </footer>
    </div>
  );
};
