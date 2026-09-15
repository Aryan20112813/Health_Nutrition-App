import React, { useState } from 'react';
import { UserProfile, BmiHistoryRecord } from '../types';
import { initialBmiHistory } from '../data/mockData';

interface BmiHealthViewProps {
  userProfile: UserProfile;
  onUpdateWeight: (weight: number, height: number) => void;
}

export const BmiHealthView: React.FC<BmiHealthViewProps> = ({
  userProfile,
  onUpdateWeight,
}) => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState(userProfile.heightCm);
  const [weightKg, setWeightKg] = useState(userProfile.weightKg);
  const [age, setAge] = useState(userProfile.age);
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [history, setHistory] = useState<BmiHistoryRecord[]>(initialBmiHistory);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // BMI Calculation
  const heightM = heightCm / 100;
  const bmiValue = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  // Ideal weight range (BMI 18.5 to 24.9)
  const minIdealWeight = parseFloat((18.5 * heightM * heightM).toFixed(1));
  const maxIdealWeight = parseFloat((24.9 * heightM * heightM).toFixed(1));

  // Indian Specific Phenotype cutoffs (WHO South Asian classification: Overweight >= 23, Obese >= 25)
  const getBmiClassification = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#0050ad', badgeBg: 'bg-tertiary-fixed', badgeText: 'text-on-tertiary-fixed' };
    if (bmi < 23.0) return { category: 'Normal / Healthy Range', color: '#005f49', badgeBg: 'bg-primary-fixed', badgeText: 'text-on-primary-fixed' };
    if (bmi < 25.0) return { category: 'Overweight (South Asian Cutoff)', color: '#fd8f35', badgeBg: 'bg-secondary-fixed', badgeText: 'text-on-secondary-fixed' };
    return { category: 'Obese Range', color: '#ba1a1a', badgeBg: 'bg-error-container', badgeText: 'text-on-error-container' };
  };

  const currentClassification = getBmiClassification(bmiValue);

  // Needle position calculation (BMI range 15 to 35 -> 0% to 100%)
  const needlePercent = Math.min(100, Math.max(0, ((bmiValue - 15) / 20) * 100));

  const handleLogToday = () => {
    const todayRecord: BmiHistoryRecord = {
      date: 'Today',
      weight: weightKg,
      bmi: bmiValue,
      status: currentClassification.category.split(' ')[0],
    };
    setHistory((prev) => [todayRecord, ...prev.slice(0, 4)]);
    onUpdateWeight(weightKg, heightCm);
    setToastMessage(`Logged ${weightKg} kg (BMI ${bmiValue}) to your health record!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportReport = () => {
    setToastMessage('Exporting Clinical Metabolic PDF Report...');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
              Telemetry Synced: 24 Oct
            </span>
            <span className="text-xs text-on-surface-variant">• Indian Phenotype Calibrated</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            BMI & Body Health Analysis
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Body composition screening, visceral fat risk assessment, and personalized caloric expenditure calibration.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-colors self-start lg:self-center"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>Export Health PDF</span>
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-primary text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Important Health Notice */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-start space-x-3 text-xs text-on-surface-variant leading-relaxed">
        <span className="material-symbols-outlined text-outline text-[20px] shrink-0 mt-0.5">
          medical_information
        </span>
        <p>
          <strong className="text-on-surface">Important Health Notice:</strong> Body Mass Index (BMI) is a standardized demographic screening tool and does not differentiate between skeletal muscle mass and subcutaneous adipose tissue. For athletes and strength trainees, waist circumference and DEXA scans provide clinical granularity.
        </p>
      </div>

      {/* Main Grid: Left Controls (5 cols) & Right Telemetry (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h2 className="text-base font-extrabold text-on-surface">Body Metric Parameters</h2>
              {/* Unit Toggle */}
              <div className="flex items-center space-x-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 text-xs">
                <button
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    unitSystem === 'metric' ? 'bg-primary text-white' : 'text-on-surface-variant'
                  }`}
                >
                  Metric (kg/cm)
                </button>
                <button
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    unitSystem === 'imperial' ? 'bg-primary text-white' : 'text-on-surface-variant'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            {/* Height Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface">Standing Height:</span>
                <span className="font-mono text-sm font-bold text-on-surface">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min="120"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
              <div className="flex items-center space-x-1.5 mt-2 text-xs">
                {[165, 170, 175, 180, 185].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHeightCm(h)}
                    className={`flex-1 py-1 rounded-lg border text-center transition-colors ${
                      heightCm === h
                        ? 'border-primary bg-primary-fixed/30 font-bold text-primary'
                        : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {h} cm
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface">Current Body Weight:</span>
                <span className="font-mono text-sm font-bold text-on-surface">{weightKg.toFixed(1)} kg</span>
              </div>
              <div className="flex items-center space-x-2 my-2">
                <button
                  onClick={() => setWeightKg(Math.max(35, parseFloat((weightKg - 1.0).toFixed(1))))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                >
                  -1.0
                </button>
                <button
                  onClick={() => setWeightKg(Math.max(35, parseFloat((weightKg - 0.5).toFixed(1))))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                >
                  -0.5
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 60)}
                  className="w-20 text-center py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs font-bold font-mono text-on-surface"
                />
                <button
                  onClick={() => setWeightKg(parseFloat((weightKg + 0.5).toFixed(1)))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                >
                  +0.5
                </button>
                <button
                  onClick={() => setWeightKg(parseFloat((weightKg + 1.0).toFixed(1)))}
                  className="flex-1 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                >
                  +1.0
                </button>
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">Age:</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 21)}
                  className="w-full py-1.5 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs font-bold text-on-surface"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">Biological Sex:</label>
                <div className="flex items-center space-x-1">
                  {(['Male', 'Female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                        gender === g ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 space-y-2">
              <button
                onClick={handleLogToday}
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25 transition-all flex items-center justify-center space-x-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Log Today's Body Weight</span>
              </button>
            </div>
          </div>

          {/* Active Calorie Target Breakdown */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-on-surface">
              Daily Energy Expenditure (TDEE)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span className="text-on-surface">Basal Metabolic Rate (BMR)</span>
                <span className="font-mono font-bold text-on-surface">~1,650 kcal</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span className="text-on-surface">Activity Factor (1.35x Moderate)</span>
                <span className="font-mono font-bold text-secondary">+550 kcal</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary-fixed/30 border border-primary-fixed">
                <span className="font-bold text-on-surface">Prescribed Daily Budget</span>
                <span className="font-mono font-extrabold text-primary text-sm">2,200 kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Metabolic Gauge & Clinical Risk (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main BMI Screening Score Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Screening Metric
                </span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-on-surface font-mono">
                    {bmiValue}
                  </span>
                  <span className="text-sm text-on-surface-variant font-semibold">kg/m²</span>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentClassification.badgeBg} ${currentClassification.badgeText}`}>
                {currentClassification.category}
              </span>
            </div>

            {/* Segmented Metabolic Gradient Bar with Needle */}
            <div className="mt-6">
              <div className="relative pt-6">
                {/* Needle Indicator */}
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-out"
                  style={{ left: `${needlePercent}%` }}
                >
                  <span className="text-[10px] font-extrabold text-on-surface bg-surface-container-highest px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                    {bmiValue}
                  </span>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-on-surface"></div>
                </div>

                {/* Gradient Bar Segments */}
                <div className="h-3 rounded-full overflow-hidden flex">
                  {/* Underweight: 15 to 18.5 (17.5%) */}
                  <div className="bg-[#0050ad] h-full" style={{ width: '17.5%' }} title="Underweight (< 18.5)"></div>
                  {/* Normal South Asian: 18.5 to 23.0 (22.5%) */}
                  <div className="bg-[#005f49] h-full" style={{ width: '22.5%' }} title="Normal Range (18.5 - 22.9)"></div>
                  {/* Overweight South Asian: 23.0 to 25.0 (10%) */}
                  <div className="bg-[#fd8f35] h-full" style={{ width: '10%' }} title="Overweight (23.0 - 24.9)"></div>
                  {/* Obese: 25.0 to 35.0 (50%) */}
                  <div className="bg-[#ba1a1a] h-full" style={{ width: '50%' }} title="Obese (>= 25.0)"></div>
                </div>
              </div>

              {/* Segment Labels */}
              <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold mt-2 px-1">
                <span>15.0</span>
                <span>18.5 (Min)</span>
                <span>23.0 (Asian Cutoff)</span>
                <span>25.0 (Threshold)</span>
                <span>35.0</span>
              </div>
            </div>

            {/* Ideal Weight Range Card */}
            <div className="mt-6 p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <strong className="text-on-surface block">Optimal Weight Window:</strong>
                <span className="text-on-surface-variant">
                  For your height of {heightCm} cm, healthy weight lies between:
                </span>
              </div>
              <div className="font-mono font-extrabold text-primary text-sm sm:text-base whitespace-nowrap">
                {minIdealWeight} – {maxIdealWeight} kg
              </div>
            </div>

            {/* Takeaway */}
            <div className="mt-4 text-xs text-on-surface-variant leading-relaxed">
              <strong>Clinical Assessment:</strong> At <strong className="text-on-surface">{weightKg} kg</strong>, your BMI of <strong className="text-on-surface">{bmiValue}</strong> places you in the optimal 50th percentile of healthy weight. Your active caloric plan of 2,200 kcal is calibrated for weight maintenance and lean vitality.
            </div>
          </div>

          {/* Historical Trend Table */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-on-surface">
                Weight & BMI History Trend
              </h3>
              <span className="text-xs font-semibold text-primary">Stable Weight</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant">
                    <th className="py-2 font-semibold">Date</th>
                    <th className="py-2 font-semibold">Weight</th>
                    <th className="py-2 font-semibold">BMI</th>
                    <th className="py-2 font-semibold">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-mono">
                  {history.map((rec, i) => (
                    <tr key={i} className="hover:bg-surface-container-low/50">
                      <td className="py-2 font-sans font-medium text-on-surface">{rec.date}</td>
                      <td className="py-2 font-bold text-on-surface">{rec.weight} kg</td>
                      <td className="py-2 text-on-surface">{rec.bmi}</td>
                      <td className="py-2 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
