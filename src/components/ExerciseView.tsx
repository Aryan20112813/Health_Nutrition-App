import React, { useState } from 'react';
import { ExerciseMovement, UserProfile, ScreenId } from '../types';
import { circuitMovements as defaultMovements } from '../data/mockData';

interface ExerciseViewProps {
  userProfile: UserProfile;
  onNavigate: (screen: ScreenId) => void;
  onStartWorkout: () => void;
}

export const ExerciseView: React.FC<ExerciseViewProps> = ({
  userProfile,
  onNavigate,
  onStartWorkout,
}) => {
  const [equipmentFilter, setEquipmentFilter] = useState<'bodyweight' | 'bands' | 'gym'>('bodyweight');
  const [durationFilter, setDurationFilter] = useState<'15' | '30' | '45'>('30');
  const [movements, setMovements] = useState<ExerciseMovement[]>(defaultMovements);
  const [workoutToast, setWorkoutToast] = useState<string | null>(null);

  const toggleMovement = (id: string) => {
    setMovements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const completedCount = movements.filter((m) => m.completed).length;

  const handleMarkAllComplete = () => {
    setMovements((prev) => prev.map((m) => ({ ...m, completed: true })));
    setWorkoutToast('All 4 circuit movements marked complete! ~185 kcal burned.');
    setTimeout(() => setWorkoutToast(null), 3000);
  };

  const handleSwapRoutine = () => {
    setWorkoutToast('Swapped to: 30-Min Cardio Core & Mobility Circuit!');
    setTimeout(() => setWorkoutToast(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed">
              Effort Index: 3.8 METs
            </span>
            <span className="text-xs text-on-surface-variant">• Beginner Bodyweight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            Functional Movement & Exercise
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Calibrated for {userProfile.name.split(' ')[0]} • Joint-Friendly Biomechanics • ~185 kcal Energy Expenditure
          </p>
        </div>

        {/* Quick Workout CTA */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onStartWorkout}
            id="start-workout-header-btn"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-secondary text-white hover:bg-secondary-container shadow-xs shadow-secondary/25 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>Start Guided Workout</span>
          </button>
          <button
            onClick={handleMarkAllComplete}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
          >
            Mark Done
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {workoutToast && (
        <div className="p-3 rounded-xl bg-secondary text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">fitness_center</span>
          <span>{workoutToast}</span>
        </div>
      )}

      {/* Routine Configuration Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-on-surface-variant">Available Gear:</span>
          <div className="flex items-center space-x-1">
            {[
              { id: 'bodyweight', label: 'No Equipment (Dorm/Home)' },
              { id: 'bands', label: 'Resistance Bands' },
              { id: 'gym', label: 'Gym / Free Weights' },
            ].map((gear) => (
              <button
                key={gear.id}
                onClick={() => setEquipmentFilter(gear.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  equipmentFilter === gear.id
                    ? 'bg-primary text-white font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {gear.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-on-surface-variant">Time Budget:</span>
          <div className="flex items-center space-x-1">
            {[
              { id: '15', label: '15 min' },
              { id: '30', label: '30 min (Optimal)' },
              { id: '45', label: '45 min' },
            ].map((dur) => (
              <button
                key={dur.id}
                onClick={() => setDurationFilter(dur.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  durationFilter === dur.id
                    ? 'bg-secondary text-white font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Curated Circuit (7 Cols) & Side Panels (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Curated Routine & Movements (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Circuit Banner */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary px-2 py-0.5 rounded bg-secondary-fixed">
                  Curated Routine
                </span>
                <h2 className="text-lg font-extrabold text-on-surface mt-1.5">
                  30-Minute Dorm & Home Functional Strength
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  4 Compound Movements • 3 Full Rounds • 60s Rest between Sets
                </p>
              </div>

              <div className="text-right">
                <span className="text-lg font-extrabold text-on-surface font-mono">
                  {completedCount} / {movements.length}
                </span>
                <div className="text-[10px] text-on-surface-variant">Completed</div>
              </div>
            </div>

            <div className="w-full bg-surface-container rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-secondary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / movements.length) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={onStartWorkout}
                className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-secondary text-white hover:bg-secondary-container transition-colors flex items-center justify-center space-x-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Launch Interactive Workout Mode</span>
              </button>
              <button
                onClick={handleSwapRoutine}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center space-x-1"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                <span>Swap Routine</span>
              </button>
            </div>
          </div>

          {/* Movements Cards */}
          <div className="space-y-4">
            {movements.map((movement, idx) => (
              <div
                key={movement.id}
                className={`p-5 rounded-2xl border transition-all ${
                  movement.completed
                    ? 'bg-surface-container-lowest/80 border-primary/40'
                    : 'bg-surface-container-lowest border-outline-variant/30 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleMovement(movement.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors mt-0.5 ${
                        movement.completed
                          ? 'bg-primary text-white'
                          : 'bg-surface-container text-outline hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {movement.completed ? 'check' : 'radio_button_unchecked'}
                      </span>
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-outline">#{idx + 1}</span>
                        <h3 className={`text-base font-extrabold ${movement.completed ? 'line-through text-outline' : 'text-on-surface'}`}>
                          {movement.name}
                        </h3>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {movement.target}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface shrink-0">
                    {movement.setsReps}
                  </span>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-4">
                  <img
                    src={movement.imageUrl}
                    alt={movement.name}
                    className="w-full sm:w-28 h-24 rounded-xl object-cover shrink-0 border border-outline-variant/20"
                  />
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface leading-relaxed">
                      <strong className="text-primary block mb-0.5">Form Cue:</strong>
                      {movement.formCue}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                      <span>Rest Interval: <strong className="text-on-surface">{movement.rest}</strong></span>
                      <span>Est. Burn: <strong className="text-secondary">{movement.calories} kcal</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Safety, Nutrition & Consistency (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Clinical Safety Box */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center space-x-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">health_and_safety</span>
              <h3 className="text-base font-extrabold text-on-surface">
                Clinical Safety & Warmup
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
              Never start high-intensity sets cold. Perform this 3-minute synovial fluid lubrication routine first:
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between text-on-surface">
                <span>1. Arm Circles & Shoulder Dislocates</span>
                <span className="font-mono text-outline">45s</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between text-on-surface">
                <span>2. Standing Torso Rotations</span>
                <span className="font-mono text-outline">45s</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between text-on-surface">
                <span>3. Bodyweight Hip Openers & Leg Swings</span>
                <span className="font-mono text-outline">60s</span>
              </div>
            </div>
          </div>

          {/* Metabolic Recovery Nutrition */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center space-x-2 mb-2">
              <span className="material-symbols-outlined text-tertiary text-[22px]">restaurant</span>
              <h3 className="text-base font-extrabold text-on-surface">
                Post-Workout Anabolic Refuel
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
              Within 45 minutes of completing this workout, supply 15-20g of fast-absorbing protein with water:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
                <div>
                  <div className="font-bold text-on-surface">2 Boiled Egg Whites + Tender Coconut Water</div>
                  <div className="text-[11px] text-on-surface-variant">~80 kcal • 8g Protein • Natural Electrolytes</div>
                </div>
                <span className="text-xs font-bold text-primary">Option A</span>
              </div>
              <div className="p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
                <div>
                  <div className="font-bold text-on-surface">Chana Sattu Cooler with Mint & Jeera</div>
                  <div className="text-[11px] text-on-surface-variant">~140 kcal • 11g Protein • Slow GI Fuel</div>
                </div>
                <span className="text-xs font-bold text-primary">Option B</span>
              </div>
            </div>
          </div>

          {/* Weekly Consistency Engine */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-on-surface">
                Weekly Program Engine
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                85% Goal Pace
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {[
                { day: 'M', status: 'done', label: 'Push' },
                { day: 'T', status: 'active', label: 'Circuit' },
                { day: 'W', status: 'rest', label: 'Walk' },
                { day: 'T', status: 'planned', label: 'Legs' },
                { day: 'F', status: 'planned', label: 'HIIT' },
                { day: 'S', status: 'planned', label: 'Yoga' },
                { day: 'S', status: 'rest', label: 'Rest' },
              ].map((s, idx) => (
                <div key={idx} className="p-1.5 rounded-lg bg-surface-container-low flex flex-col items-center">
                  <span className="font-bold text-on-surface-variant text-[11px]">{s.day}</span>
                  <div className="w-5 h-5 rounded-full my-1 flex items-center justify-center text-[10px]">
                    {s.status === 'done' ? (
                      <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                    ) : s.status === 'active' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
                    ) : s.status === 'rest' ? (
                      <span className="text-outline text-[10px]">Zz</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-surface-container-high"></span>
                    )}
                  </div>
                  <span className="text-[9px] text-outline truncate">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cognitive Study Tip */}
          <div className="p-4 rounded-2xl bg-surface-container-low text-on-surface-variant text-[11px] leading-relaxed border border-outline-variant/20 flex items-start space-x-2.5">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
              school
            </span>
            <div>
              <strong className="text-on-surface">Cognitive Recall Benefit:</strong> Moderate bodyweight circuits stimulate peripheral BDNF synthesis, clearing mental fatigue and improving retention for exams.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
