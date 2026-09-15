import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';

interface OnboardingViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export function OnboardingView({ onNavigate }: OnboardingViewProps) {
  const { user, updateProfile } = useAuth();

  const [sex, setSex] = useState<'female' | 'male' | 'other' | 'prefer_not_to_say'>(
    user?.profile?.sex || 'prefer_not_to_say'
  );
  const [heightCm, setHeightCm] = useState<number>(user?.profile?.heightCm || 172);
  const [weightKg, setWeightKg] = useState<number>(user?.profile?.weightKg || 68);
  const [goal, setGoal] = useState<'maintain' | 'lose_weight' | 'gain_weight' | 'improve_fitness'>(
    user?.profile?.goal || 'lose_weight'
  );
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'high'>(
    user?.profile?.activityLevel || 'moderate'
  );
  const [dietaryPreference, setDietaryPreference] = useState<'omnivore' | 'vegetarian' | 'vegan' | 'other'>(
    user?.preferences?.dietaryPreference || 'vegetarian'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live BMI calculation estimate
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : '22.0';

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-600 bg-amber-500/10' };
    if (val < 24.9) return { label: 'Normal / Healthy', color: 'text-emerald-600 bg-emerald-500/10' };
    if (val < 29.9) return { label: 'Overweight', color: 'text-orange-600 bg-orange-500/10' };
    return { label: 'Obese Class I+', color: 'text-rose-600 bg-rose-500/10' };
  };

  const bmiCat = getBmiCategory(parseFloat(bmi));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const result = await updateProfile({
      sex,
      heightCm,
      weightKg,
      goal,
      activityLevel,
      dietaryPreference,
    });

    setIsSaving(false);

    if (result.success) {
      onNavigate('dashboard');
    } else {
      setError(result.error || 'Failed to save profile settings.');
    }
  };

  return (
    <div id="scr-onboarding-setup" className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xl p-6 sm:p-10">
        {/* Welcome Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            Step 1 of 1 • Profile Personalization
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Welcome, {user?.profile?.displayName || 'Friend'}!
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-lg mx-auto">
            Configure your biometrics and metabolic parameters to tailor your Indian dietary targets and workout recommendations.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-xs sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Biometrics Card */}
          <div className="p-5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30">
            <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary text-lg">straighten</span>
              <span>Physical Biometrics</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Biological Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs sm:text-sm focus:outline-none focus:border-primary"
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
                  min="80"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Realtime BMI Snapshot pill */}
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant font-medium">Estimated Baseline BMI:</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-on-surface text-sm">{bmi} kg/m²</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${bmiCat.color}`}>
                  {bmiCat.label}
                </span>
              </div>
            </div>
          </div>

          {/* Goals and Activity Level */}
          <div className="p-5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 space-y-4">
            <h2 className="text-sm font-bold text-on-surface flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary text-lg">flag</span>
              <span>Health Target & Lifestyle</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Primary Goal
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'lose_weight', label: 'Weight & Fat Loss', icon: 'trending_down' },
                  { id: 'maintain', label: 'Maintain Current Weight', icon: 'balance' },
                  { id: 'gain_weight', label: 'Muscle & Lean Mass', icon: 'fitness_center' },
                  { id: 'improve_fitness', label: 'Cardio & Stamina', icon: 'directions_run' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id as any)}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                      goal === item.id
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Weekly Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs sm:text-sm focus:outline-none focus:border-primary"
              >
                <option value="sedentary">Sedentary (desk worker, minimal exercise)</option>
                <option value="light">Lightly Active (1-2 days exercise per week)</option>
                <option value="moderate">Moderately Active (3-5 days regular training)</option>
                <option value="high">Highly Active (heavy daily athletic exercise)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'vegetarian', label: 'Vegetarian' },
                  { id: 'vegan', label: 'Vegan' },
                  { id: 'omnivore', label: 'Non-Vegetarian' },
                  { id: 'other', label: 'Jain / Other' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDietaryPreference(item.id as any)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs transition ${
                      dietaryPreference === item.id
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-6 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition shadow flex items-center justify-center space-x-2"
          >
            {isSaving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Setup & Enter Dashboard</span>
                <span className="material-symbols-outlined text-lg">check</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
