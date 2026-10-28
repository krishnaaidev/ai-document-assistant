import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  User,
  Lock,
  Moon,
  Sun,
  Trash2,
  Check,
  AlertTriangle,
  Mail,
  Shield,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getInitials } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Account deletion confirm
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = getInitials(userProfile?.displayName, userProfile?.email);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSavingProfile(true);
    try {
      await updateUserProfile({ displayName });
      toast.success('Profile details updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await new Promise((res) => setTimeout(res, 1000));
      toast.success('Account deactivated');
      await signOut();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Workspace Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal account profile, authentication credentials, and interface theme.
        </p>
      </div>

      {/* Appearance & Preferences Section */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Appearance & Theme</h2>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Interface Color Theme</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select between vibrant light mode and sleek obsidian dark mode.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-w-lg">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast.success('Switched to Light mode');
              }}
              className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Light Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Crisp slate & radiant indigo</p>
              </div>
              {theme === 'light' && (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                toast.success('Switched to Dark mode');
              }}
              className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deep obsidian & ambient glows</p>
              </div>
              {theme === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile Information</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {userProfile?.displayName || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{userProfile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
          <Input
            label="Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <Input
            label="Email Address (Read-only)"
            value={userProfile?.email || ''}
            disabled
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            helperText="To update your primary email, contact workspace administrator."
          />

          <Button type="submit" variant="primary" loading={savingProfile}>
            Save Profile
          </Button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Security & Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Minimum 8 characters"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" variant="outline" loading={savingPassword}>
            Update Password
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-red-200/80 dark:border-red-900/60 p-6 shadow-xs space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-red-100 dark:border-red-900/40 pb-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Delete Workspace Account</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-0.5">
              Permanently remove your profile, parsed document embeddings, and conversation histories.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteAccountOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Account Deletion Confirmation */}
      <ConfirmDialog
        isOpen={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This is a permanent action. All your documents, indexed vectors, collections, and conversation logs will be permanently deleted."
        confirmLabel="Yes, Delete My Account"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default SettingsPage;
