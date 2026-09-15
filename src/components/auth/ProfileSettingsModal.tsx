import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoggedOut: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose, onLoggedOut }: ProfileSettingsModalProps) {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
  const [sex, setSex] = useState(user?.profile?.sex || 'prefer_not_to_say');
  const [heightCm, setHeightCm] = useState(user?.profile?.heightCm || 172);
  const [weightKg, setWeightKg] = useState(user?.profile?.weightKg || 68);
  const [goal, setGoal] = useState(user?.profile?.goal || 'maintain');
  const [activityLevel, setActivityLevel] = useState(user?.profile?.activityLevel || 'moderate');
  const [dietaryPreference, setDietaryPreference] = useState(user?.preferences?.dietaryPreference || 'vegetarian');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.profile?.displayName || '');
      setSex(user.profile?.sex || 'prefer_not_to_say');
      setHeightCm(user.profile?.heightCm || 172);
      setWeightKg(user.profile?.weightKg || 68);
      setGoal(user.profile?.goal || 'maintain');
      setActivityLevel(user.profile?.activityLevel || 'moderate');
      setDietaryPreference(user.preferences?.dietaryPreference || 'vegetarian');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsProcessing(true);

    const result = await updateProfile({
      displayName,
      sex: sex as any,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      goal: goal as any,
      activityLevel: activityLevel as any,
      dietaryPreference: dietaryPreference as any,
    });

    setIsProcessing(false);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Profile and biometrics updated successfully!' });
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to update profile.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsProcessing(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsProcessing(false);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Password changed successfully! Past sessions revoked.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setFeedback({ type: 'error', message: result.error || 'Password update failed.' });
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    onLoggedOut();
  };

  return (
    <div id="scr-profile-settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
              {displayName.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">Account & Biometrics</h2>
              <p className="text-xs text-on-surface-variant">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 px-6 bg-surface-container-lowest">
          <button
            onClick={() => { setActiveTab('profile'); setFeedback(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">badge</span>
            <span>Profile & Health</span>
          </button>
          <button
            onClick={() => { setActiveTab('security'); setFeedback(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
            <span>Password & Security</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                  : 'bg-error/10 text-error border border-error/20'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {feedback.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedback.message}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Sex
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="lose_weight">Lose Weight</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain_weight">Gain Muscle</option>
                    <option value="improve_fitness">Improve Fitness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Dietary Preference
                  </label>
                  <select
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="omnivore">Non-Vegetarian</option>
                    <option value="other">Jain / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                >
                  <option value="sedentary">Sedentary (desk work, minimal movement)</option>
                  <option value="light">Lightly Active (1-2 workouts / week)</option>
                  <option value="moderate">Moderately Active (3-5 workouts / week)</option>
                  <option value="high">Highly Active (6+ intense workouts / week)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="py-2.5 px-5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="py-2.5 px-5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  {isProcessing ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogout}
            className="py-2 px-3 rounded-xl border border-error/30 text-error hover:bg-error/10 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-on-surface-variant hover:text-on-surface text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
