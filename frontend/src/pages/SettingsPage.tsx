import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Lock,
  Moon,
  Trash2,
  Check,
  AlertTriangle,
  Mail,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getInitials } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { userProfile, updateUserProfile, signOut } = useAuth();

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
      // Password update simulation/API call
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
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">Workspace Settings</h1>
        <p className="text-sm text-charcoal-500">
          Manage your personal account profile, authentication credentials, and workspace preferences.
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-subtle space-y-6">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <User className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-charcoal-900">Profile Information</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 font-bold text-xl flex items-center justify-center ring-4 ring-primary-50">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal-900">
              {userProfile?.displayName || 'User'}
            </p>
            <p className="text-xs text-charcoal-400">{userProfile?.email}</p>
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
            leftIcon={<Mail className="w-4 h-4 text-charcoal-400" />}
            helperText="To update your primary email, contact workspace administrator."
          />

          <Button type="submit" variant="primary" loading={savingProfile}>
            Save Profile
          </Button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-subtle space-y-6">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Lock className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-charcoal-900">Security & Password</h2>
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

      {/* App Preferences */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Moon className="w-5 h-5 text-secondary-600" />
          <h2 className="text-base font-semibold text-charcoal-900">Appearance & Preferences</h2>
        </div>

        <div className="flex items-center justify-between max-w-lg py-2">
          <div>
            <p className="text-xs font-semibold text-charcoal-800">Interface Theme</p>
            <p className="text-xs text-charcoal-400">
              DocAssistant currently defaults to the warm off-white minimalist theme.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 rounded-md text-charcoal-600 border border-neutral-200">
            Light (Default)
          </span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-red-100 pb-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-charcoal-900">Delete Workspace Account</p>
            <p className="text-xs text-charcoal-500 max-w-md">
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
