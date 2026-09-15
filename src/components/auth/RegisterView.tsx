import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';

interface RegisterViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export function RegisterView({ onNavigate }: RegisterViewProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password policy validation rules
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPolicySatisfied = hasMinLength && hasLetter && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPolicySatisfied) {
      setError('Please satisfy all password security requirements before proceeding.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(email, password, displayName);
    setIsSubmitting(false);

    if (result.success) {
      // Direct newly registered user to Onboarding Profile Setup (SCR-ONB-001)
      onNavigate('onboarding');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div id="scr-auth-register" className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
            <span className="material-symbols-outlined text-2xl">person_add</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Create Account</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Start your evidence-based metabolic health journey
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs sm:text-sm flex items-start space-x-2">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Full Name or Nickname
            </label>
            <input
              id="register-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aryan K."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Email Address <span className="text-error">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Password <span className="text-error">*</span>
            </label>
            <input
              id="register-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Confirm Password <span className="text-error">*</span>
            </label>
            <input
              id="register-confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          {/* Password Policy Requirements Card */}
          <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 text-xs space-y-1.5">
            <div className="font-semibold text-on-surface-variant mb-1">Password Policy Requirements:</div>
            <div className={`flex items-center space-x-1.5 ${hasMinLength ? 'text-primary' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[16px]">{hasMinLength ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center space-x-1.5 ${hasLetter ? 'text-primary' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[16px]">{hasLetter ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>Contains at least one letter (a-z, A-Z)</span>
            </div>
            <div className={`flex items-center space-x-1.5 ${hasNumber ? 'text-primary' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[16px]">{hasNumber ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>Contains at least one number (0-9)</span>
            </div>
            <div className={`flex items-center space-x-1.5 ${passwordsMatch ? 'text-primary' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[16px]">{passwordsMatch ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>Passwords match</span>
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={isSubmitting || !isPolicySatisfied}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register & Continue</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-on-surface-variant">
          Already have an account?{' '}
          <button
            id="register-go-to-login"
            type="button"
            onClick={() => onNavigate('auth-login')}
            className="text-primary font-semibold hover:underline ml-1"
          >
            Log in here
          </button>
        </div>
      </div>
    </div>
  );
}
