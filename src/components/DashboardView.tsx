import React from 'react';
import { ScreenId, UserProfile, MealSlot } from '../types';

interface DashboardViewProps {
  userProfile: UserProfile;
  mealSlots: MealSlot[];
  onNavigate: (screen: ScreenId) => void;
  onLogWater: () => void;
  onOpenQuickAdd: (slotId?: string) => void;
  onStartWorkout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  mealSlots,
  onNavigate,
  onLogWater,
  onOpenQuickAdd,
  onStartWorkout,
}) => {
  // Caloric calculations
  const totalCaloriesLogged = mealSlots.reduce((sum, slot) => {
    return sum + slot.items.reduce((itemSum, i) => itemSum + i.calories, 0);
  }, 0);

  const totalProteinLogged = mealSlots.reduce((sum, slot) => {
    return sum + slot.items.reduce((itemSum, i) => itemSum + i.protein, 0);
  }, 0);

  const totalCarbsLogged = mealSlots.reduce((sum, slot) => {
    return sum + slot.items.reduce((itemSum, i) => itemSum + i.carbs, 0);
  }, 0);

  const totalFatsLogged = mealSlots.reduce((sum, slot) => {
    return sum + slot.items.reduce((itemSum, i) => itemSum + i.fats, 0);
  }, 0);

  const calorieBudget = userProfile.dailyCalorieBudget;
  const caloriesRemaining = Math.max(0, calorieBudget - totalCaloriesLogged);
  const caloriePercentage = Math.min(100, Math.round((totalCaloriesLogged / calorieBudget) * 100));

  // Circular gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriePercentage / 100) * circumference;

  // Weekly bar data
  const weeklyData = [
    { day: 'Wed', calories: 2080, target: 2200 },
    { day: 'Thu', calories: 2190, target: 2200 },
    { day: 'Fri', calories: 2250, target: 2200 },
    { day: 'Sat', calories: 1980, target: 2200 },
    { day: 'Sun', calories: 2140, target: 2200 },
    { day: 'Mon', calories: 2210, target: 2200 },
    { day: 'Today', calories: totalCaloriesLogged, target: 2200, isCurrent: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Good morning, {userProfile.name.split(' ')[0]} 👋
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">
              Eggetarian Active
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Goal: <span className="font-semibold text-on-surface">{userProfile.goal}</span> ({userProfile.targetWeightKg} kg target) • Calibrated to ICMR-NIN Indian Standards
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="dash-quick-scan-btn"
            onClick={() => onNavigate('ai-food-scanner')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">document_scanner</span>
            <span>Quick Food Scan</span>
          </button>
          <button
            id="dash-quick-water-btn"
            onClick={onLogWater}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">water_drop</span>
            <span>Log Water (+250ml)</span>
          </button>
          <button
            id="dash-quick-snack-btn"
            onClick={() => onOpenQuickAdd('snack')}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">add_circle</span>
            <span>Log Quick Snack</span>
          </button>
        </div>
      </div>

      {/* Top 4 Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Energy Balance */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Energy Balance
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">local_fire_department</span>
          </div>

          <div className="flex items-center justify-between my-3">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                {totalCaloriesLogged.toLocaleString()}
                <span className="text-xs font-normal text-on-surface-variant ml-1">/ {calorieBudget.toLocaleString()} kcal</span>
              </div>
              <div className="text-xs font-semibold text-primary mt-0.5">
                {caloriesRemaining} kcal remaining
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-surface-container"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-primary transition-all duration-700 ease-out"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-extrabold text-on-surface">
                {caloriePercentage}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Maintenance paced</span>
            <span className="font-semibold text-primary">In Target Zone</span>
          </div>
        </div>

        {/* Card 2: Macro Targets */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Macro Distribution
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">pie_chart</span>
          </div>

          <div className="space-y-2.5 my-2">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Protein
                </span>
                <span className="text-on-surface-variant">
                  {Math.round(totalProteinLogged)}g / {userProfile.targetProtein}g
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalProteinLogged / userProfile.targetProtein) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Carbs
                </span>
                <span className="text-on-surface-variant">
                  {Math.round(totalCarbsLogged)}g / {userProfile.targetCarbs}g
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-secondary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCarbsLogged / userProfile.targetCarbs) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary inline-block"></span> Fats
                </span>
                <span className="text-on-surface-variant">
                  {Math.round(totalFatsLogged)}g / {userProfile.targetFats}g
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-tertiary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFatsLogged / userProfile.targetFats) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Clean Indian staples</span>
            <span className="font-semibold text-on-surface">Balanced</span>
          </div>
        </div>

        {/* Card 3: Body Metrics & BMI */}
        <div
          onClick={() => onNavigate('bmi-and-body-health')}
          className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between shadow-xs hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Body Health & BMI
            </span>
            <span className="material-symbols-outlined text-primary text-[20px] group-hover:translate-x-0.5 transition-transform">
              monitor_weight
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-on-surface">21.5</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                Healthy Range
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Height: {userProfile.heightCm} cm • Current: {userProfile.weightKg} kg
            </p>
            <div className="mt-2 text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg">
              Optimal weight: <span className="font-bold text-on-surface">56.7 – 76.3 kg</span>
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-semibold">
            <span>Screening & History</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </div>
        </div>

        {/* Card 4: Daily Habits & Telemetry */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Telemetry & Sync
            </span>
            <div className="flex items-center space-x-1 text-[11px] font-semibold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>Live</span>
            </div>
          </div>

          <div className="space-y-3 my-2">
            {/* Hydration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">water_drop</span>
                <div>
                  <div className="text-xs font-bold text-on-surface">
                    {userProfile.currentHydrationL.toFixed(1)}L / {userProfile.hydrationGoalL.toFixed(1)}L
                  </div>
                  <div className="text-[10px] text-on-surface-variant">Hydration Pace</div>
                </div>
              </div>
              <button
                onClick={onLogWater}
                className="w-7 h-7 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center text-xs font-bold hover:bg-tertiary-fixed-dim"
                title="Add 250ml"
              >
                +
              </button>
            </div>

            {/* Daily Steps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">directions_walk</span>
                <div>
                  <div className="text-xs font-bold text-on-surface">
                    {userProfile.stepsToday.toLocaleString()} / {userProfile.stepsGoal.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-on-surface-variant">Steps Walked</div>
                </div>
              </div>
              <span className="text-xs font-bold text-secondary">
                {Math.round((userProfile.stepsToday / userProfile.stepsGoal) * 100)}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Activity Target</span>
            <span className="font-semibold text-primary">On Schedule</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Meals + Insights / Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Meals Timeline (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-on-surface">Today's Meals</h2>
                <p className="text-xs text-on-surface-variant">
                  Chronological Indian Meal Diary • Calibrated Macros
                </p>
              </div>
              <button
                onClick={() => onNavigate('nutrition-and-calorie-tracking')}
                className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
              >
                <span>Full Nutrition Log</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            {/* Timeline of Meals */}
            <div className="space-y-3.5">
              {mealSlots.map((slot) => {
                const slotTotalCal = slot.items.reduce((sum, item) => sum + item.calories, 0);
                const slotProtein = slot.items.reduce((sum, item) => sum + item.protein, 0);
                const hasItems = slot.items.length > 0;

                return (
                  <div
                    key={slot.id}
                    className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 hover:border-outline-variant/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          hasItems ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-outline'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {slot.id === 'breakfast' ? 'free_breakfast' : slot.id === 'lunch' ? 'lunch_dining' : slot.id === 'snack' ? 'coffee' : 'dinner_dining'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-on-surface">{slot.title}</span>
                            <span className="text-[11px] text-on-surface-variant">{slot.time}</span>
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            {hasItems ? (
                              <span className="text-on-surface font-medium">
                                {slotTotalCal} kcal • {Math.round(slotProtein)}g Protein
                              </span>
                            ) : (
                              <span className="text-outline italic">Upcoming Plan (~{slot.targetCalories} kcal suggested)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        {hasItems ? (
                          <button
                            onClick={() => onOpenQuickAdd(slot.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                          >
                            + Add Item
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => onOpenQuickAdd('dinner')}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary-container transition-colors"
                            >
                              Log Dinner
                            </button>
                            <button
                              onClick={() => onNavigate('ai-food-scanner')}
                              className="text-xs font-semibold p-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary"
                              title="Scan Plate"
                            >
                              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meal Items Preview */}
                    {hasItems && (
                      <div className="mt-2.5 pt-2.5 border-t border-outline-variant/20 space-y-1">
                        {slot.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-on-surface text-ellipsis overflow-hidden whitespace-nowrap max-w-[240px] sm:max-w-[340px]">
                              {item.name} <span className="text-on-surface-variant text-[11px]">({item.portion})</span>
                            </span>
                            <span className="font-semibold text-on-surface-variant whitespace-nowrap ml-2">
                              {item.calories} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Caloric Consistency Bar Chart */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-on-surface">Weekly Caloric Consistency</h3>
                <p className="text-xs text-on-surface-variant">Daily adherence relative to 2,200 kcal budget</p>
              </div>
              <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-full bg-primary-fixed">
                94% Compliance
              </span>
            </div>

            {/* Simple SVG / CSS Bar Chart */}
            <div className="pt-2">
              <div className="flex items-end justify-between h-32 gap-2 sm:gap-4 px-2">
                {weeklyData.map((d, idx) => {
                  const heightPercent = Math.min(100, Math.max(15, (d.calories / 2500) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.calories}
                      </span>
                      <div className="w-full bg-surface-container rounded-t-md h-full flex items-end">
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            d.isCurrent ? 'bg-primary' : 'bg-primary/50 group-hover:bg-primary/80'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      </div>
                      <span className={`text-[11px] font-semibold ${d.isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-dashed border-outline-variant/30 flex justify-between text-[11px] text-on-surface-variant">
                <span>Target Baseline: 2,200 kcal/day</span>
                <span className="text-primary font-semibold">Weekly Avg: 2,120 kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Plate Scanner Banner + Today's Workout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Instant AI Food Scanner Promo */}
          <div className="bg-gradient-to-br from-primary/10 via-surface-container-low to-primary-fixed/20 p-5 rounded-2xl border border-primary/20 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary-fixed">
                  Neural Vision Engine
                </span>
                <h3 className="text-base font-extrabold text-on-surface mt-2">
                  Snap Your Indian Thali
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Our Indian culinary neural network identifies curries, rotis, rice, and volumetric portions in 0.8s.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">document_scanner</span>
              </div>
            </div>

            {/* Scanned preview vignette */}
            <div className="mt-4 p-3 rounded-xl bg-surface-container-lowest/90 border border-outline-variant/30 flex items-center space-x-3">
              <img
                src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80"
                alt="Sample scanned plate"
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-on-surface truncate">Dal Makhani & 2 Rotis</span>
                  <span className="text-[10px] font-bold text-primary">94% Conf</span>
                </div>
                <p className="text-xs text-on-surface-variant">Estimated ~485 kcal • 17g Protein</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('ai-food-scanner')}
              className="mt-4 w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25 flex items-center justify-center space-x-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">camera</span>
              <span>Launch AI Food Scanner</span>
            </button>
          </div>

          {/* Card: Today's Functional Workout */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">fitness_center</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">Today's Workout Circuit</h3>
                  <p className="text-[11px] text-on-surface-variant">30-Min Beginner Bodyweight</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                ~185 kcal
              </span>
            </div>

            {/* Exercise Checkpoints */}
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span className="text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                  Bodyweight Air Squats
                </span>
                <span className="text-on-surface-variant font-mono">3 × 12</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span className="text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                  Standard / Incline Push-Ups
                </span>
                <span className="text-on-surface-variant font-mono">3 × 10</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span className="text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">radio_button_unchecked</span>
                  Reverse Alternating Lunges
                </span>
                <span className="text-on-surface-variant font-mono">3 × 10/leg</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span className="text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">radio_button_unchecked</span>
                  Forearm Plank Hold
                </span>
                <span className="text-on-surface-variant font-mono">3 × 30s</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={onStartWorkout}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-colors flex items-center justify-center space-x-1"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>Start Guided Workout</span>
              </button>
              <button
                onClick={() => onNavigate('exercise-recommendation')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
              >
                Details
              </button>
            </div>
          </div>

          {/* Clinical Assurance Disclaimer */}
          <div className="p-4 rounded-xl bg-surface-container-low text-on-surface-variant text-[11px] leading-relaxed border border-outline-variant/20 flex items-start space-x-2.5">
            <span className="material-symbols-outlined text-outline text-[18px] shrink-0 mt-0.5">verified_user</span>
            <p>
              <strong className="text-on-surface">Health & Safety Assurance:</strong> Calorie goals and RDA macronutrient splits follow the Indian Council of Medical Research (ICMR) and National Institute of Nutrition (NIN) dietary guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
