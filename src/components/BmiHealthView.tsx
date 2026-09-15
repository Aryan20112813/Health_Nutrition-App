import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, BmiApiRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { bmiApi } from '../services/bmiApi';

interface BmiHealthViewProps {
  userProfile: UserProfile;
  onUpdateWeight: (weight: number, height: number) => void;
}

export const BmiHealthView: React.FC<BmiHealthViewProps> = ({
  userProfile,
  onUpdateWeight,
}) => {
  const { user, isAuthenticated } = useAuth();

  // Inputs: Metric units as required by FR-BMI-001 (height cm, weight kg)
  const [heightCm, setHeightCm] = useState<number>(() => {
    return user?.profile?.heightCm || userProfile.heightCm || 175;
  });
  const [weightKg, setWeightKg] = useState<number>(() => {
    return user?.profile?.weightKg || userProfile.weightKg || 70;
  });

  // History state
  const [records, setRecords] = useState<BmiApiRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Field validation error state (FR-BMI-001)
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize with auth user profile if updated
  useEffect(() => {
    if (user?.profile?.heightCm) {
      setHeightCm(user.profile.heightCm);
    }
    if (user?.profile?.weightKg) {
      setWeightKg(user.profile.weightKg);
    }
  }, [user]);

  // Client-side instant calculation: FR-BMI-002: weight(kg) / height(m)^2 rounded to 1 decimal place
  const heightM = heightCm > 0 ? heightCm / 100 : 1.75;
  const bmiValue = heightM > 0 ? parseFloat((weightKg / (heightM * heightM)).toFixed(1)) : 0;

  // Ideal weight range: 18.5 to 24.9 * heightM^2
  const minIdealWeight = parseFloat((18.5 * heightM * heightM).toFixed(1));
  const maxIdealWeight = parseFloat((24.9 * heightM * heightM).toFixed(1));

  // Category classification as defined in PRD/TechSpec/Schema:
  // underweight (< 18.5), normal (18.5 - 24.9), overweight (25.0 - 29.9), obesity (>= 30.0)
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) {
      return {
        key: 'underweight',
        label: 'Underweight',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        barColor: '#3F6F9E',
        description: 'Below the recommended weight range for your height.',
      };
    }
    if (bmi < 25.0) {
      return {
        key: 'normal',
        label: 'Normal weight',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        barColor: '#2F7D59',
        description: 'Within the optimal healthy weight range for your height.',
      };
    }
    if (bmi < 30.0) {
      return {
        key: 'overweight',
        label: 'Overweight',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        barColor: '#B77A18',
        description: 'Above the standard healthy weight boundary for your height.',
      };
    }
    return {
      key: 'obesity',
      label: 'Obese',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      barColor: '#B84A4A',
      description: 'Significantly elevated weight relative to height; consultation advised.',
    };
  };

  const currentCategory = getBmiCategory(bmiValue);

  // Position on gauge needle: map BMI 15.0 - 35.0 to 0% - 100%
  const needlePercent = Math.min(100, Math.max(0, ((bmiValue - 15) / (35 - 15)) * 100));

  // Load history from API for authenticated user (FR-BMI-004)
  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingHistory(true);
    try {
      const res = await bmiApi.getRecords({ limit: 15 });
      if (res.success && res.data?.records) {
        setRecords(res.data.records);
      }
    } catch {
      // Graceful degradation
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Validate inputs according to FR-BMI-001 (metric: height cm 50-280, weight kg 20-400)
  const validateInputs = (h: number, w: number): string | null => {
    if (!h || isNaN(h) || h < 50 || h > 280) {
      return 'Height must be between 50 cm and 280 cm.';
    }
    if (!w || isNaN(w) || w < 20 || w > 400) {
      return 'Weight must be between 20 kg and 400 kg.';
    }
    return null;
  };

  const handleHeightChange = (val: number) => {
    setHeightCm(val);
    const err = validateInputs(val, weightKg);
    setValidationError(err);
  };

  const handleWeightChange = (val: number) => {
    setWeightKg(val);
    const err = validateInputs(heightCm, val);
    setValidationError(err);
  };

  // Submit and save record (FR-BMI-001, FR-BMI-002, FR-BMI-003, FR-BMI-004)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateInputs(heightCm, weightKg);
    if (err) {
      setValidationError(err);
      showToast(err, 'error');
      return;
    }
    setValidationError(null);

    if (!isAuthenticated) {
      // Local fallback for guest
      onUpdateWeight(weightKg, heightCm);
      showToast(`BMI calculated: ${bmiValue} (${currentCategory.label}). Sign in to save persistent records to your account.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bmiApi.createRecord({
        heightCm,
        weightKg,
      });

      if (res.success && res.data?.record) {
        setRecords((prev) => [res.data!.record, ...prev]);
        onUpdateWeight(weightKg, heightCm);
        showToast(`BMI of ${res.data.record.bmi} (${res.data.record.categoryLabel}) recorded successfully!`);
      } else {
        showToast(res.error?.message || 'Failed to save BMI record', 'error');
      }
    } catch {
      showToast('Network error while saving record. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="bmi-health-container">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
              Metric Screening (FR-BMI-001..004)
            </span>
            <span className="text-xs text-on-surface-variant">• WHO Classification Standards</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            Body Mass Index (BMI) & Biometrics
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Evaluate weight-to-height proportionality, track historical biometric records, and monitor healthy weight intervals.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center space-x-2 text-xs font-semibold text-primary bg-primary-fixed/30 border border-primary-fixed px-3 py-2 rounded-xl self-start md:self-center">
            <span className="material-symbols-outlined text-base">cloud_done</span>
            <span>Cloud Sync Active</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl self-start md:self-center">
            <span className="material-symbols-outlined text-base">info</span>
            <span>Guest Mode (Local Calculation)</span>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all ${
            toastMessage.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-primary text-white'
          }`}
          role="alert"
        >
          <span className="material-symbols-outlined text-lg">
            {toastMessage.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Wellness & Informational Disclaimer */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-start space-x-3 text-xs text-on-surface-variant leading-relaxed">
        <span className="material-symbols-outlined text-outline text-xl shrink-0 mt-0.5">
          medical_information
        </span>
        <p>
          <strong className="text-on-surface">Informational Wellness Disclaimer:</strong> Body Mass Index (BMI) is a standardized screening metric based on height and weight: weight (kg) / height (m)². It is an educational screening estimate, not a medical diagnosis. It does not differentiate between lean muscle mass, bone density, and adipose fat tissue.
        </p>
      </div>

      {/* Main Grid: Input Form & Visual Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Metric Inputs (FR-BMI-001) */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSaveRecord}
            className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h2 className="text-base font-extrabold text-on-surface flex items-center space-x-2">
                <span className="material-symbols-outlined text-primary text-lg">straighten</span>
                <span>Enter Measurements (Metric)</span>
              </h2>
              <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                Metric Standard
              </span>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Height (cm) Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <label htmlFor="bmi-height-input" className="text-on-surface">
                  Height (centimeters):
                </label>
                <span className="font-mono text-sm font-bold text-primary">{heightCm} cm</span>
              </div>
              <input
                id="bmi-height-slider"
                type="range"
                min="50"
                max="250"
                step="1"
                value={heightCm}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
              <div className="flex items-center space-x-2 mt-2">
                <input
                  id="bmi-height-input"
                  type="number"
                  min="50"
                  max="280"
                  value={heightCm}
                  onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                  className="w-full py-1.5 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs font-bold font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. 175"
                  required
                />
                <span className="text-xs font-bold text-on-surface-variant">cm</span>
              </div>
              {/* Quick preset buttons */}
              <div className="flex items-center space-x-1 mt-2">
                {[155, 165, 170, 175, 180, 185].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => handleHeightChange(h)}
                    className={`flex-1 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                      heightCm === h
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight (kg) Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <label htmlFor="bmi-weight-input" className="text-on-surface">
                  Weight (kilograms):
                </label>
                <span className="font-mono text-sm font-bold text-primary">{weightKg.toFixed(1)} kg</span>
              </div>
              <div className="flex items-center space-x-1.5 my-1.5">
                <button
                  type="button"
                  onClick={() => handleWeightChange(Math.max(20, parseFloat((weightKg - 1.0).toFixed(1))))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                  title="Decrease 1 kg"
                >
                  -1.0
                </button>
                <button
                  type="button"
                  onClick={() => handleWeightChange(Math.max(20, parseFloat((weightKg - 0.5).toFixed(1))))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                  title="Decrease 0.5 kg"
                >
                  -0.5
                </button>
                <input
                  id="bmi-weight-input"
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  value={weightKg}
                  onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                  className="w-24 text-center py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs font-bold font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleWeightChange(Math.min(400, parseFloat((weightKg + 0.5).toFixed(1))))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                  title="Increase 0.5 kg"
                >
                  +0.5
                </button>
                <button
                  type="button"
                  onClick={() => handleWeightChange(Math.min(400, parseFloat((weightKg + 1.0).toFixed(1))))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                  title="Increase 1.0 kg"
                >
                  +1.0
                </button>
              </div>
            </div>

            {/* Submit / Log Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="bmi-save-button"
                disabled={isSubmitting || !!validationError}
                className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-hover shadow-xs shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving to Health Records...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    <span>{isAuthenticated ? 'Record & Save to Health History' : 'Calculate & Recalibrate'}</span>
                  </>
                )}
              </button>
              {!isAuthenticated && (
                <p className="text-[11px] text-center text-on-surface-variant mt-2">
                  Sign in with an account to automatically maintain historical BMI trends.
                </p>
              )}
            </div>
          </form>

          {/* Biometric Formula Explanation */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-2 text-xs">
            <h3 className="font-extrabold text-on-surface flex items-center space-x-1.5">
              <span className="material-symbols-outlined text-primary text-base">functions</span>
              <span>Calculation Methodology</span>
            </h3>
            <div className="p-2.5 rounded-lg bg-surface-container-low font-mono text-[11px] text-on-surface">
              BMI = weight (kg) ÷ [height (m)]²
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Standard calculation verified against international WHO demographic criteria. Rounded to exactly one decimal place.
            </p>
          </div>
        </div>

        {/* Right Column: Visual Result Card & Historical Table (FR-BMI-003, FR-BMI-004) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main BMI Result Card (FR-BMI-003) */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs" id="bmi-result-card">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Current Result
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-5xl font-extrabold text-on-surface font-mono tracking-tight" id="bmi-calculated-value">
                    {bmiValue > 0 ? bmiValue.toFixed(1) : '--'}
                  </span>
                  <span className="text-sm font-semibold text-on-surface-variant">kg/m²</span>
                </div>
              </div>

              {/* Category Badge (FR-BMI-003) */}
              <div className="flex flex-col items-end">
                <span
                  id="bmi-category-badge"
                  className={`px-3.5 py-1 rounded-full text-xs font-bold border ${currentCategory.badgeBg}`}
                >
                  {currentCategory.label}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-1">WHO Category</span>
              </div>
            </div>

            {/* Segmented Gradient Bar with Animated Needle */}
            <div className="mt-6">
              <div className="relative pt-6">
                {/* Needle Indicator */}
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ease-out"
                  style={{ left: `${needlePercent}%` }}
                >
                  <span className="text-[11px] font-extrabold text-on-surface bg-surface-container-highest px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                    {bmiValue.toFixed(1)}
                  </span>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-on-surface"></div>
                </div>

                {/* Gradient Bar Segments */}
                <div className="h-3 rounded-full overflow-hidden flex shadow-inner">
                  {/* Underweight (< 18.5) */}
                  <div className="bg-[#3F6F9E] h-full" style={{ width: '17.5%' }} title="Underweight (< 18.5)"></div>
                  {/* Normal (18.5 - 24.9) */}
                  <div className="bg-[#2F7D59] h-full" style={{ width: '32.5%' }} title="Normal (18.5 - 24.9)"></div>
                  {/* Overweight (25.0 - 29.9) */}
                  <div className="bg-[#B77A18] h-full" style={{ width: '25%' }} title="Overweight (25.0 - 29.9)"></div>
                  {/* Obesity (>= 30.0) */}
                  <div className="bg-[#B84A4A] h-full" style={{ width: '25%' }} title="Obesity (>= 30.0)"></div>
                </div>
              </div>

              {/* Segment Legends */}
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] text-on-surface-variant font-semibold mt-2">
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#3F6F9E]"></span>
                  <span>&lt;18.5</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#2F7D59]"></span>
                  <span>18.5–24.9</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#B77A18]"></span>
                  <span>25.0–29.9</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#B84A4A]"></span>
                  <span>≥30.0</span>
                </div>
              </div>
            </div>

            {/* Ideal Weight Range Card */}
            <div className="mt-5 p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <strong className="text-on-surface block">Healthy Weight Interval:</strong>
                <span className="text-on-surface-variant">
                  For your height of {heightCm} cm, normal BMI corresponds to:
                </span>
              </div>
              <div className="font-mono font-extrabold text-primary text-sm sm:text-base whitespace-nowrap">
                {minIdealWeight} – {maxIdealWeight} kg
              </div>
            </div>

            {/* Explanatory summary */}
            <div className="mt-4 text-xs text-on-surface-variant leading-relaxed">
              <strong>Category Context:</strong> {currentCategory.description}
            </div>
          </div>

          {/* Historical Records Table (FR-BMI-004) */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs" id="bmi-history-section">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-on-surface flex items-center space-x-2">
                  <span className="material-symbols-outlined text-primary text-lg">history</span>
                  <span>BMI History</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Chronological record of user body measurements
                </p>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={fetchHistory}
                  disabled={isLoadingHistory}
                  className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-surface-container-low transition-colors"
                  title="Refresh history"
                >
                  <span className={`material-symbols-outlined text-sm ${isLoadingHistory ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>Refresh</span>
                </button>
              )}
            </div>

            {isLoadingHistory ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <p>Loading your BMI history...</p>
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant">
                      <th className="py-2.5 font-semibold">Date</th>
                      <th className="py-2.5 font-semibold">Height</th>
                      <th className="py-2.5 font-semibold">Weight</th>
                      <th className="py-2.5 font-semibold">BMI</th>
                      <th className="py-2.5 font-semibold">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 font-mono">
                    {records.map((rec) => {
                      const categoryInfo = getBmiCategory(rec.bmi);
                      const formattedDate = new Date(rec.recordedAt || rec.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr key={rec.id} className="hover:bg-surface-container-low/50">
                          <td className="py-2.5 font-sans font-medium text-on-surface">{formattedDate}</td>
                          <td className="py-2.5 text-on-surface">{rec.heightCm} cm</td>
                          <td className="py-2.5 font-bold text-on-surface">{rec.weightKg} kg</td>
                          <td className="py-2.5 font-extrabold text-primary">{rec.bmi}</td>
                          <td className="py-2.5 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryInfo.badgeBg}`}>
                              {rec.categoryLabel || categoryInfo.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low/30">
                <span className="material-symbols-outlined text-3xl text-outline mb-1">
                  monitoring
                </span>
                <p className="font-semibold text-on-surface">No BMI records found</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {isAuthenticated
                    ? 'Enter your current height and weight on the left and click "Record & Save" to start your log.'
                    : 'Log in to securely track and view your dated BMI records over time.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
