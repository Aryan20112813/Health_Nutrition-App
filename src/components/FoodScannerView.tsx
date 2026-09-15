import React, { useState } from 'react';
import { FoodItem, ScreenId, UserProfile } from '../types';
import { detectedPlateSegments } from '../data/mockData';

interface FoodScannerViewProps {
  userProfile: UserProfile;
  onNavigate: (screen: ScreenId) => void;
  onAddFoodItem: (slotId: 'breakfast' | 'lunch' | 'snack' | 'dinner', item: FoodItem) => void;
}

export const FoodScannerView: React.FC<FoodScannerViewProps> = ({
  userProfile,
  onNavigate,
  onAddFoodItem,
}) => {
  const [segments, setSegments] = useState(detectedPlateSegments);
  const [selectedSlot, setSelectedSlot] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('lunch');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState<'normal' | 'ambiguous' | 'lowlight'>('normal');

  // Custom uploaded image or preset
  const [activeImage, setActiveImage] = useState<string>(
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'
  );

  // Portion multipliers for each segment
  const [portions, setPortions] = useState<{ [key: string]: number }>({
    'seg-1': 1,
    'seg-2': 1,
    'seg-3': 1,
  });

  const handlePortionChange = (segId: string, value: number) => {
    setPortions((prev) => ({ ...prev, [segId]: value }));
  };

  const calculateTotal = () => {
    return segments.reduce(
      (acc, seg) => {
        const mult = portions[seg.id] || 1;
        return {
          calories: acc.calories + Math.round(seg.calories * mult),
          protein: acc.protein + Math.round(seg.protein * mult * 10) / 10,
          carbs: acc.carbs + Math.round(seg.carbs * mult * 10) / 10,
          fats: acc.fats + Math.round(seg.fats * mult * 10) / 10,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const totals = calculateTotal();

  const handleConfirmAndLog = () => {
    // Add all segments to meal slot
    segments.forEach((seg) => {
      const mult = portions[seg.id] || 1;
      const newItem: FoodItem = {
        id: 'ai-scanned-' + seg.id + '-' + Date.now(),
        name: seg.label,
        category: 'AI Scanned Plate',
        portion: `${mult > 1 ? mult + '× ' : ''}${seg.portion}`,
        calories: Math.round(seg.calories * mult),
        protein: Math.round(seg.protein * mult * 10) / 10,
        carbs: Math.round(seg.carbs * mult * 10) / 10,
        fats: Math.round(seg.fats * mult * 10) / 10,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onAddFoodItem(selectedSlot, newItem);
    });

    setToastMessage(`Successfully logged ${totals.calories} kcal into ${selectedSlot.toUpperCase()}!`);
    setTimeout(() => {
      setToastMessage(null);
      onNavigate('nutrition-and-calorie-tracking');
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setActiveImage(event.target.result as string);
          setToastMessage('Neural model analyzing uploaded thali image...');
          setTimeout(() => setToastMessage(null), 2500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwitchPreset = (preset: 'north' | 'south' | 'snack') => {
    if (preset === 'north') {
      setActiveImage('https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80');
      setSegments(detectedPlateSegments);
    } else if (preset === 'south') {
      setActiveImage('https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80');
      setSegments([
        {
          id: 'seg-s1',
          label: 'Masala Dosa with Potato Filling',
          confidence: 96,
          calories: 340,
          protein: 7,
          carbs: 52,
          fats: 12,
          portion: '1 Standard Dosa',
          portionOptions: ['1/2 Dosa', '1 Standard Dosa', '2 Dosas'],
          rect: { x: 20, y: 25, width: 60, height: 40 },
          color: '#0d7a5f',
        },
        {
          id: 'seg-s2',
          label: 'Vegetable Sambar (Toor Dal)',
          confidence: 91,
          calories: 120,
          protein: 6,
          carbs: 20,
          fats: 2,
          portion: '1 Deep Katori (180ml)',
          portionOptions: ['1 Katori', '2 Katoris'],
          rect: { x: 15, y: 68, width: 30, height: 26 },
          color: '#954a00',
        },
        {
          id: 'seg-s3',
          label: 'Fresh Coconut Chutney',
          confidence: 88,
          calories: 90,
          protein: 1.5,
          carbs: 4,
          fats: 8,
          portion: '2 Tablespoons (40g)',
          portionOptions: ['1 Tablespoon', '2 Tablespoons'],
          rect: { x: 55, y: 70, width: 28, height: 24 },
          color: '#0050ad',
        },
      ]);
    } else {
      setActiveImage('https://images.unsplash.com/photo-1505253758473-96b3015f240a?auto=format&fit=crop&w=800&q=80');
      setSegments([
        {
          id: 'seg-sn1',
          label: 'Sprouted Kala Chana Chaat',
          confidence: 95,
          calories: 180,
          protein: 11,
          carbs: 28,
          fats: 2.5,
          portion: '1 Bowl (150g)',
          portionOptions: ['1 Small Bowl (100g)', '1 Bowl (150g)', '1 Large Bowl (220g)'],
          rect: { x: 25, y: 20, width: 50, height: 55 },
          color: '#0d7a5f',
        },
      ]);
    }
    setToastMessage(`Switched to ${preset.toUpperCase()} Indian culinary preset!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
              Neural Vision IFV-v2.4
            </span>
            <span className="text-xs text-on-surface-variant">• Latency: 0.82s</span>
            <span className="text-xs text-primary font-bold hidden sm:inline">• Avg Conf: 93.6%</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            AI Food & Plate Scanner
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Volumetric segmentation calibrated for Indian thalis, regional gravies, breads, and grains.
          </p>
        </div>

        {/* Demo Preset Selector */}
        <div className="flex items-center space-x-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => handleSwitchPreset('north')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors text-on-surface"
          >
            Thali Preset
          </button>
          <button
            onClick={() => handleSwitchPreset('south')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors text-on-surface"
          >
            Dosa / Sambar
          </button>
          <button
            onClick={() => handleSwitchPreset('snack')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors text-on-surface"
          >
            Chana Chaat
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-primary text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Estimation Guidance Notice */}
      <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start space-x-2 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
        <p className="leading-relaxed">
          <strong className="text-on-surface">AI Estimation Notice:</strong> Food items and volumetric ratios are inferred from visual contour cues and calibrated depth heuristics. Review the serving portion selections on the right to match your actual meal size.
        </p>
      </div>

      {/* Main Grid: Visual Plate (7 Cols) & Breakdown Panel (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image with Bounding Segments (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            {/* Visual Canvas Container */}
            <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant/30 group">
              <img
                src={activeImage}
                alt="Analyzed food plate"
                className="w-full h-full object-cover"
              />

              {/* Bounding box segments overlay */}
              {segments.map((seg) => (
                <div
                  key={seg.id}
                  className="absolute border-2 rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer flex flex-col justify-start"
                  style={{
                    borderColor: seg.color,
                    backgroundColor: `${seg.color}22`,
                    left: `${seg.rect.x}%`,
                    top: `${seg.rect.y}%`,
                    width: `${seg.rect.width}%`,
                    height: `${seg.rect.height}%`,
                  }}
                >
                  <div
                    className="self-start text-[10px] font-extrabold text-white px-1.5 py-0.5 rounded-br-md shadow-xs flex items-center space-x-1"
                    style={{ backgroundColor: seg.color }}
                  >
                    <span>{seg.label}</span>
                    <span className="opacity-90 font-mono">({seg.confidence}%)</span>
                  </div>
                </div>
              ))}

              {/* Calibration Grid Watermark */}
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] text-white/90 font-mono flex items-center space-x-1.5 backdrop-blur-xs">
                <span className="material-symbols-outlined text-[13px] text-primary-fixed">straighten</span>
                <span>Thali Scale: 26cm dia ref</span>
              </div>
            </div>

            {/* Photo & File Upload Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-outline-variant/20">
              <label className="cursor-pointer flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>Take / Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center space-x-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-outline text-[16px]">tune</span>
                <span>Diagnostic mode:</span>
                <select
                  value={diagnosticMode}
                  onChange={(e) => setDiagnosticMode(e.target.value as any)}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2 py-1 text-xs text-on-surface"
                >
                  <option value="normal">Normal (94% Conf)</option>
                  <option value="ambiguous">Low Light Warning</option>
                  <option value="lowlight">Manual Override</option>
                </select>
              </div>
            </div>
          </div>

          {/* Portion Heuristic Quick Reference */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider mb-2">
              Indian Serving Scale Calibration
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <div className="font-bold text-on-surface">Standard Katori</div>
                <div className="text-[11px] text-on-surface-variant">150–180 ml (Curry / Dal)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <div className="font-bold text-on-surface">Medium Chapati</div>
                <div className="text-[11px] text-on-surface-variant">35–40g whole wheat</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <div className="font-bold text-on-surface">Steamed Rice</div>
                <div className="text-[11px] text-on-surface-variant">100g cooked grain</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detected Items Breakdown & Add Action (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
              <div>
                <h3 className="text-base font-extrabold text-on-surface">
                  Detected Food Components ({segments.length})
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Adjust portions to refine macro accuracy
                </p>
              </div>
              <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary-fixed">
                Verified
              </span>
            </div>

            {/* List of Detected segments */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {segments.map((seg) => {
                const mult = portions[seg.id] || 1;
                return (
                  <div
                    key={seg.id}
                    className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: seg.color }}
                          ></span>
                          <span className="font-bold text-xs sm:text-sm text-on-surface">
                            {seg.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-primary">
                          Confidence: {seg.confidence}%
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs sm:text-sm font-extrabold text-on-surface">
                          {Math.round(seg.calories * mult)} kcal
                        </div>
                      </div>
                    </div>

                    {/* Portion multiplier dropdown */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-1">
                      <span className="text-on-surface-variant text-[11px]">Portion size:</span>
                      <select
                        value={mult}
                        onChange={(e) => handlePortionChange(seg.id, parseFloat(e.target.value))}
                        className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2 py-1 text-xs text-on-surface font-medium"
                      >
                        <option value={0.5}>0.5× Small ({seg.portionOptions[0] || 'Small'})</option>
                        <option value={1}>1.0× Standard ({seg.portionOptions[1] || 'Medium'})</option>
                        <option value={1.5}>1.5× Generous ({seg.portionOptions[2] || 'Large'})</option>
                        <option value={2}>2.0× Double Serving</option>
                      </select>
                    </div>

                    {/* Macro pill summary */}
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/10">
                      <span>P: {Math.round(seg.protein * mult * 10) / 10}g</span>
                      <span>C: {Math.round(seg.carbs * mult * 10) / 10}g</span>
                      <span>F: {Math.round(seg.fats * mult * 10) / 10}g</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Meal Macro Summary */}
            <div className="mt-4 pt-4 border-t border-outline-variant/20 bg-surface-container-low p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Total Scanned Meal
                </span>
                <span className="text-lg font-extrabold text-on-surface font-mono">
                  {totals.calories} <span className="text-xs font-normal">kcal</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-surface-container-lowest rounded-lg mb-3">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Total Protein</span>
                  <span className="font-bold text-primary">{Math.round(totals.protein)}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Total Carbs</span>
                  <span className="font-bold text-secondary">{Math.round(totals.carbs)}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Total Fats</span>
                  <span className="font-bold text-tertiary">{Math.round(totals.fats)}g</span>
                </div>
              </div>

              {/* Destination Slot */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                  Save To Meal Diary:
                </label>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                        selectedSlot === slot
                          ? 'bg-primary text-white font-bold'
                          : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm CTA */}
              <button
                id="confirm-ai-scan-btn"
                onClick={handleConfirmAndLog}
                className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25 transition-all flex items-center justify-center space-x-2"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Confirm & Add to {selectedSlot.toUpperCase()} Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
