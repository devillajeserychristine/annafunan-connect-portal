import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  BadgeCheck,
  Shield,
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface AccountCenterProps {
  adminUser: AdminUser;
  onUserUpdated?: (updatedUser: AdminUser) => void;
}

export const AccountCenter: React.FC<AccountCenterProps> = ({
  adminUser,
  onUserUpdated
}) => {
  // Account Information State
  const [name, setName] = useState(adminUser.name);
  const [username, setUsername] = useState(adminUser.username);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI Controls
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Basic validations
    if (!name.trim()) {
      setErrorMessage('Administrator name cannot be empty.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Username cannot be empty.');
      return;
    }

    // If attempting to change password or username, ensure validation
    const isChangingPassword = Boolean(newPassword.trim());
    const isChangingUsername = username.trim().toLowerCase() !== adminUser.username.toLowerCase();

    if (isChangingPassword) {
      if (!currentPassword) {
        setErrorMessage('Please enter your current password to verify your identity.');
        return;
      }
      if (newPassword.length < 4) {
        setErrorMessage('New password must be at least 4 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirmation do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.updateAdminAccount({
        currentUsername: adminUser.username,
        currentPassword: currentPassword || undefined,
        newName: name.trim(),
        newUsername: username.trim(),
        newPassword: isChangingPassword ? newPassword.trim() : undefined
      });

      if (res.success && res.updatedUser) {
        setSuccessMessage('Administrator account profile and credentials have been successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onUserUpdated) {
          onUserUpdated(res.updatedUser);
        }
      } else {
        setErrorMessage(res.message || 'Failed to update account credentials.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while updating admin account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Administrator Account Center</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider">
                {adminUser.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage gateway administration credentials, display names, and console security credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 self-start sm:self-auto">
          <Fingerprint className="w-4 h-4 text-emerald-400" />
          <span>Active User: <strong className="text-slate-200">{adminUser.username}</strong></span>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-3 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleUpdateAccount} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Profile Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <User className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Administrator Profile</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Display / Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Christine Devilla (ICT Administrator)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Shown on top of the Admin Console and in audit session logs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Login Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Used to authenticate into the School Admin Console.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Access Level:</span>
                <span className="font-semibold text-emerald-400">Full Gateway Controller</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Voucher Generation:</span>
                <span className="text-slate-200">Authorized</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Firewall Bypass:</span>
                <span className="text-slate-200">Authorized</span>
              </div>
            </div>
          </div>

          {/* Right Column: Password & Security */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Change Admin Password</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Password <span className="text-slate-500 font-normal">(needed if changing password)</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword && (
              <div className="text-[11px] space-y-1">
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Minimum 4 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassword === confirmPassword && confirmPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving Changes...' : 'Save Account Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
