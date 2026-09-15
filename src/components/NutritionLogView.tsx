import React, { useState, useEffect, useId, useCallback } from 'react';
import { MealSlot, FoodItem, UserProfile, ScreenId, ICatalogFood, ICalorieLogItem, IDayLogSummary } from '../types';
import { calorieApi } from '../services/calorieApi';
import { useAuth } from '../context/AuthContext';
import { searchDatabaseStaples } from '../data/mockData';

interface NutritionLogViewProps {
  userProfile: UserProfile;
  mealSlots: MealSlot[];
  onAddFoodItem: (slotId: 'breakfast' | 'lunch' | 'snack' | 'dinner', item: FoodItem) => void;
  onRemoveFoodItem: (slotId: string, itemId: string) => void;
  onNavigate?: (screen: ScreenId) => void;
  onOpenQuickAdd?: (slotId: string) => void;
}

export const NutritionLogView: React.FC<NutritionLogViewProps> = ({
  userProfile,
  mealSlots: fallbackMealSlots,
  onAddFoodItem,
  onRemoveFoodItem,
  onNavigate,
}) => {
  const { isAuthenticated } = useAuth();

  // Helper for formatted ISO date string
  const getTodayIso = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  
  // Quick date tab presets
  const todayIso = getTodayIso();
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Backend state
  const [logs, setLogs] = useState<ICalorieLogItem[]>([]);
  const [summary, setSummary] = useState<IDayLogSummary | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  // Catalog search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDietaryTag, setSelectedDietaryTag] = useState<string>('all');
  const [catalogFoods, setCatalogFoods] = useState<ICatalogFood[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

  // Log Mode: 'catalog' vs 'manual'
  const [activeLogMode, setActiveLogMode] = useState<'catalog' | 'manual'>('catalog');

  // Selected Catalog Item & Portions
  const [selectedCatalogFood, setSelectedCatalogFood] = useState<ICatalogFood | null>(null);
  const [catalogQuantity, setCatalogQuantity] = useState<number>(1);
  const [catalogUnit, setCatalogUnit] = useState<'g' | 'ml' | 'piece' | 'serving'>('serving');

  // Manual Custom Entry Form
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState<number | ''>('');
  const [manualProtein, setManualProtein] = useState<number | ''>('');
  const [manualCarbs, setManualCarbs] = useState<number | ''>('');
  const [manualFat, setManualFat] = useState<number | ''>('');
  const [manualFiber, setManualFiber] = useState<number | ''>('');
  const [manualQuantity, setManualQuantity] = useState<number>(1);
  const [manualUnit, setManualUnit] = useState<'g' | 'ml' | 'piece' | 'serving'>('serving');

  // Meal slot target
  const [selectedMealSlot, setSelectedMealSlot] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('lunch');

  // Notification and edit modal state
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editingLogItem, setEditingLogItem] = useState<ICalorieLogItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<'g' | 'ml' | 'piece' | 'serving'>('serving');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchInputId = useId();

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Fetch daily logs from backend API
  const fetchDailyLogs = useCallback(async (date: string) => {
    if (!isAuthenticated) return;
    setIsLoadingLogs(true);
    setLogError(null);
    try {
      const res = await calorieApi.getCalorieLogs(date);
      if (res.success && res.data) {
        setLogs(res.data.logs);
        setSummary(res.data.summary);
      } else if (res.error) {
        setLogError(res.error.message);
      }
    } catch {
      setLogError('Could not fetch daily calorie records');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDailyLogs(selectedDate);
  }, [selectedDate, fetchDailyLogs]);

  // Search Catalog with debounce
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingCatalog(true);
      try {
        const res = await calorieApi.searchFoods({
          query: searchQuery.trim(),
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          dietaryTag: selectedDietaryTag !== 'all' ? selectedDietaryTag : undefined,
          limit: 30,
        });

        if (!isCancelled && res.success && res.data) {
          setCatalogFoods(res.data.foods);
          if (res.data.foods.length > 0 && !selectedCatalogFood) {
            setSelectedCatalogFood(res.data.foods[0]);
            setCatalogQuantity(res.data.foods[0].serving.amount);
            setCatalogUnit(res.data.foods[0].serving.unit);
          }
        }
      } catch {
        // Handled silently
      } finally {
        if (!isCancelled) setIsSearchingCatalog(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, selectedDietaryTag]);

  // When a catalog food is clicked, initialize portion controls
  const handleSelectCatalogFood = (food: ICatalogFood) => {
    setSelectedCatalogFood(food);
    setCatalogQuantity(food.serving.amount);
    setCatalogUnit(food.serving.unit);
  };

  // Compute live preview of calories and macros for current selection
  const computeLivePreview = () => {
    if (!selectedCatalogFood) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }

    const { serving, nutritionPerServing, alternativeUnits } = selectedCatalogFood;
    let factor = 1;

    if (catalogUnit === serving.unit) {
      factor = catalogQuantity / serving.amount;
    } else {
      const alt = alternativeUnits?.find((u) => u.unit === catalogUnit);
      if (alt && serving.unit === 'g') {
        const grams = catalogQuantity * alt.gramsEquivalent;
        factor = grams / serving.amount;
      } else {
        factor = catalogQuantity / (serving.amount || 1);
      }
    }

    return {
      calories: Math.max(0, Math.round(nutritionPerServing.calories * factor)),
      protein: Math.max(0, Math.round(nutritionPerServing.proteinG * factor * 10) / 10),
      carbs: Math.max(0, Math.round(nutritionPerServing.carbsG * factor * 10) / 10),
      fat: Math.max(0, Math.round(nutritionPerServing.fatG * factor * 10) / 10),
      fiber:
        nutritionPerServing.fiberG !== null
          ? Math.max(0, Math.round(nutritionPerServing.fiberG * factor * 10) / 10)
          : 0,
    };
  };

  const preview = computeLivePreview();

  // Log food item to backend
  const handleLogFood = async () => {
    if (activeLogMode === 'catalog') {
      if (!selectedCatalogFood) return;
      if (catalogQuantity <= 0) {
        showNotification('Quantity must be greater than 0', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        if (isAuthenticated) {
          const res = await calorieApi.createLog({
            date: selectedDate,
            mealType: selectedMealSlot,
            foodId: selectedCatalogFood.id,
            quantity: catalogQuantity,
            unit: catalogUnit,
          });

          if (res.success) {
            showNotification(`Logged ${selectedCatalogFood.name} to ${selectedMealSlot.toUpperCase()}`);
            await fetchDailyLogs(selectedDate);
          } else {
            showNotification(res.error?.message || 'Failed to save food log', 'error');
          }
        } else {
          // Local fallback for guest
          const localItem: FoodItem = {
            id: 'local-' + Date.now(),
            name: selectedCatalogFood.name,
            category: selectedCatalogFood.category,
            portion: `${catalogQuantity} ${catalogUnit}`,
            calories: preview.calories,
            protein: preview.protein,
            carbs: preview.carbs,
            fats: preview.fat,
            fiber: preview.fiber,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          onAddFoodItem(selectedMealSlot, localItem);
          showNotification(`Logged ${localItem.name} to ${selectedMealSlot.toUpperCase()}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Manual custom food log
      if (!manualName.trim()) {
        showNotification('Please enter a food name', 'error');
        return;
      }
      if (manualCalories === '' || Number(manualCalories) < 0) {
        showNotification('Please enter valid calories (>= 0)', 'error');
        return;
      }

      const cal = Number(manualCalories);
      const prot = Number(manualProtein) || 0;
      const carb = Number(manualCarbs) || 0;
      const fat = Number(manualFat) || 0;
      const fib = manualFiber !== '' ? Number(manualFiber) : null;

      setIsSubmitting(true);
      try {
        if (isAuthenticated) {
          const res = await calorieApi.createLog({
            date: selectedDate,
            mealType: selectedMealSlot,
            quantity: manualQuantity,
            unit: manualUnit,
            manualFood: {
              name: manualName.trim(),
              calories: cal,
              proteinG: prot,
              carbsG: carb,
              fatG: fat,
              fiberG: fib,
            },
          });

          if (res.success) {
            showNotification(`Logged custom food "${manualName}" successfully`);
            setManualName('');
            setManualCalories('');
            setManualProtein('');
            setManualCarbs('');
            setManualFat('');
            setManualFiber('');
            await fetchDailyLogs(selectedDate);
          } else {
            showNotification(res.error?.message || 'Failed to log custom food', 'error');
          }
        } else {
          const localItem: FoodItem = {
            id: 'manual-local-' + Date.now(),
            name: manualName.trim(),
            category: 'Custom Entry',
            portion: `${manualQuantity} ${manualUnit}`,
            calories: Math.round(cal * manualQuantity),
            protein: Math.round(prot * manualQuantity * 10) / 10,
            carbs: Math.round(carb * manualQuantity * 10) / 10,
            fats: Math.round(fat * manualQuantity * 10) / 10,
            fiber: fib !== null ? Math.round(fib * manualQuantity * 10) / 10 : 0,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          onAddFoodItem(selectedMealSlot, localItem);
          showNotification(`Logged ${localItem.name} to ${selectedMealSlot.toUpperCase()}`);
          setManualName('');
          setManualCalories('');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Delete food log entry
  const handleDeleteLogItem = async (logId: string, slotId: string) => {
    if (isAuthenticated) {
      const res = await calorieApi.deleteLog(logId);
      if (res.success) {
        showNotification('Meal entry removed');
        await fetchDailyLogs(selectedDate);
      } else {
        showNotification(res.error?.message || 'Failed to delete entry', 'error');
      }
    } else {
      onRemoveFoodItem(slotId, logId);
      showNotification('Meal entry removed');
    }
  };

  // Edit item action
  const handleOpenEdit = (log: ICalorieLogItem) => {
    setEditingLogItem(log);
    setEditQuantity(log.quantity);
    setEditUnit(log.unit);
  };

  const handleSaveEdit = async () => {
    if (!editingLogItem) return;
    if (editQuantity <= 0) {
      showNotification('Quantity must be greater than 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await calorieApi.updateLog(editingLogItem.id, {
        quantity: editQuantity,
        unit: editUnit,
      });

      if (res.success) {
        showNotification('Meal entry updated and nutrition recalculated');
        setEditingLogItem(null);
        await fetchDailyLogs(selectedDate);
      } else {
        showNotification(res.error?.message || 'Failed to update entry', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals from backend summary if authenticated, or calculate from fallbackMealSlots
  const totalConsumed = summary
    ? summary.consumedCalories
    : fallbackMealSlots.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.calories, 0), 0);

  const budget = summary ? summary.targetCalories : userProfile.dailyCalorieBudget;
  const remaining = summary ? summary.remainingCalories : Math.max(0, budget - totalConsumed);
  const percentage = Math.min(100, Math.round((totalConsumed / budget) * 100));

  const totalProtein = summary
    ? summary.macroTotals.proteinG
    : fallbackMealSlots.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.protein, 0), 0);

  const totalCarbs = summary
    ? summary.macroTotals.carbsG
    : fallbackMealSlots.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.carbs, 0), 0);

  const totalFat = summary
    ? summary.macroTotals.fatG
    : fallbackMealSlots.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.fats, 0), 0);

  const totalFiber = summary
    ? summary.macroTotals.fiberG
    : fallbackMealSlots.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + (i.fiber || 0), 0), 0);

  // Group authenticated logs by meal slot
  const mealSlotsData = [
    { id: 'breakfast' as const, title: 'Breakfast', icon: 'free_breakfast', target: Math.round(budget * 0.25) },
    { id: 'lunch' as const, title: 'Lunch', icon: 'lunch_dining', target: Math.round(budget * 0.35) },
    { id: 'snack' as const, title: 'Evening Snack', icon: 'coffee', target: Math.round(budget * 0.15) },
    { id: 'dinner' as const, title: 'Dinner', icon: 'dinner_dining', target: Math.round(budget * 0.25) },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          id="calorie-toast"
          className={`fixed top-20 right-5 z-50 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-lg border flex items-center space-x-2 transition-all ${
            notificationMsg.type === 'error'
              ? 'bg-error-container text-on-error-container border-error/30'
              : 'bg-inverse-surface text-inverse-on-surface border-outline/20'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {notificationMsg.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Page Header & Interactive Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Nutrition & Calorie Log
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Curated Indian Food Catalog • Scaled Macro Portions • Deterministic Daily Budgets
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
            <button
              id="date-tab-yesterday"
              onClick={() => setSelectedDate(yesterdayIso)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === yesterdayIso
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Yesterday
            </button>
            <button
              id="date-tab-today"
              onClick={() => setSelectedDate(todayIso)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === todayIso
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Today
            </button>
            <button
              id="date-tab-tomorrow"
              onClick={() => setSelectedDate(tomorrowIso)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDate === tomorrowIso
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tomorrow
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
            <input
              id="date-picker-input"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="text-xs font-medium bg-transparent text-on-surface focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Hero Calorie & Macro Telemetry Banner */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Calorie Gauge Ring */}
          <div className="lg:col-span-4 flex items-center space-x-5 border-b lg:border-b-0 lg:border-r border-outline-variant/20 pb-4 lg:pb-0 lg:pr-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-surface-container"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-primary transition-all duration-700 ease-out"
                  strokeWidth="9"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - percentage / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-xl sm:text-2xl font-extrabold text-on-surface leading-tight">
                  {remaining}
                </div>
                <div className="text-[10px] text-on-surface-variant font-semibold">kcal Left</div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                  {percentage}% Budget Consumed
                </span>
              </div>
              <div className="text-sm font-extrabold text-on-surface mt-1.5">
                {totalConsumed} <span className="text-xs font-normal text-on-surface-variant">/ {budget} kcal</span>
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                Target Energy: <span className="font-semibold text-primary">{budget} kcal / day</span>
              </div>
            </div>
          </div>

          {/* Macro Progress Bars */}
          <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-outline-variant/20 pb-4 lg:pb-0 lg:pr-4">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  Protein
                </span>
                <span className="text-on-surface-variant font-mono">
                  {Math.round(totalProtein)}g / {userProfile.targetProtein}g (
                  {Math.round((totalProtein / (userProfile.targetProtein || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalProtein / (userProfile.targetProtein || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Carbohydrates */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  Carbohydrates
                </span>
                <span className="text-on-surface-variant font-mono">
                  {Math.round(totalCarbs)}g / {userProfile.targetCarbs}g (
                  {Math.round((totalCarbs / (userProfile.targetCarbs || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-secondary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCarbs / (userProfile.targetCarbs || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                  Fats
                </span>
                <span className="text-on-surface-variant font-mono">
                  {Math.round(totalFat)}g / {userProfile.targetFats}g (
                  {Math.round((totalFat / (userProfile.targetFats || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-tertiary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFat / (userProfile.targetFats || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Dietary Fiber */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
                  Dietary Fiber
                </span>
                <span className="text-on-surface-variant font-mono">
                  {Math.round(totalFiber)}g / {userProfile.targetFiber || 30}g (
                  {Math.round((totalFiber / (userProfile.targetFiber || 30)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-outline h-2 rounded-full"
                  style={{ width: `${Math.min(100, (totalFiber / (userProfile.targetFiber || 30)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Dietary Stats */}
          <div className="lg:col-span-3 space-y-2.5">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
              Nutritional Balance
            </span>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low">
              <span className="text-on-surface">Target Protein Density</span>
              <span className="font-semibold text-primary">
                {userProfile.targetProtein ? Math.round((userProfile.targetProtein * 4 / budget) * 100) : 20}% of Energy
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low">
              <span className="text-on-surface">Target Carbs</span>
              <span className="font-semibold text-secondary">
                {userProfile.targetCarbs ? Math.round((userProfile.targetCarbs * 4 / budget) * 100) : 55}% of Energy
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low">
              <span className="text-on-surface">Target Fats</span>
              <span className="font-semibold text-tertiary">
                {userProfile.targetFats ? Math.round((userProfile.targetFats * 9 / budget) * 100) : 25}% of Energy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Meal Timelines (Left 7 cols) & Food Logger / Search (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meal Logs Timeline */}
        <div className="lg:col-span-7 space-y-5">
          {isLoadingLogs && (
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface-variant flex items-center space-x-2">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              <span>Loading meal records for {selectedDate}...</span>
            </div>
          )}

          {logError && (
            <div className="p-4 rounded-xl bg-error-container text-on-error-container text-xs font-medium">
              {logError}
            </div>
          )}

          {mealSlotsData.map((slot) => {
            // If user is authenticated and has backend logs, display them
            const slotBackendLogs = isAuthenticated
              ? logs.filter((l) => l.mealType === slot.id)
              : null;

            // Fallback for guest mode
            const fallbackSlot = fallbackMealSlots.find((s) => s.id === slot.id);
            const slotItemsCount = slotBackendLogs
              ? slotBackendLogs.length
              : fallbackSlot?.items.length || 0;

            const slotCalories = slotBackendLogs
              ? slotBackendLogs.reduce((sum, item) => sum + item.nutrition.calories, 0)
              : fallbackSlot?.items.reduce((sum, item) => sum + item.calories, 0) || 0;

            const slotProtein = slotBackendLogs
              ? slotBackendLogs.reduce((sum, item) => sum + item.nutrition.proteinG, 0)
              : fallbackSlot?.items.reduce((sum, item) => sum + item.protein, 0) || 0;

            const slotCarbs = slotBackendLogs
              ? slotBackendLogs.reduce((sum, item) => sum + item.nutrition.carbsG, 0)
              : fallbackSlot?.items.reduce((sum, item) => sum + item.carbs, 0) || 0;

            const slotFat = slotBackendLogs
              ? slotBackendLogs.reduce((sum, item) => sum + item.nutrition.fatG, 0)
              : fallbackSlot?.items.reduce((sum, item) => sum + item.fats, 0) || 0;

            return (
              <div
                key={slot.id}
                id={`meal-slot-${slot.id}`}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs transition-all"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">{slot.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-on-surface">{slot.title}</h3>
                        <span className="text-xs text-on-surface-variant font-mono">
                          ~{slot.target} kcal target
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        Logged: <strong className="text-on-surface">{slotCalories} kcal</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    id={`add-to-${slot.id}-btn`}
                    onClick={() => {
                      setSelectedMealSlot(slot.id);
                      document.getElementById('food-search-box')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items in Slot */}
                {slotItemsCount > 0 ? (
                  <div className="divide-y divide-outline-variant/20 mt-2">
                    {isAuthenticated && slotBackendLogs
                      ? slotBackendLogs.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex-1 pr-2">
                              <div className="font-bold text-on-surface flex items-center gap-1.5">
                                <span>{item.foodNameSnapshot}</span>
                                {item.source === 'manual' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-on-surface-variant mt-0.5">
                                {item.quantity} {item.unit} • P: {item.nutrition.proteinG}g • C: {item.nutrition.carbsG}g • F: {item.nutrition.fatG}g
                                {item.nutrition.fiberG !== null ? ` • Fiber: ${item.nutrition.fiberG}g` : ''}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-on-surface text-sm font-mono">
                                {item.nutrition.calories}{' '}
                                <span className="text-[10px] font-normal text-on-surface-variant">kcal</span>
                              </span>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                title="Edit quantity"
                                className="w-7 h-7 rounded-lg text-outline hover:text-primary hover:bg-primary-fixed/20 flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteLogItem(item.id, slot.id)}
                                title="Remove food item"
                                className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-error-container/30 flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined text-[17px]">delete</span>
                              </button>
                            </div>
                          </div>
                        ))
                      : fallbackSlot?.items.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex-1 pr-2">
                              <div className="font-bold text-on-surface">{item.name}</div>
                              <div className="text-[11px] text-on-surface-variant mt-0.5">
                                {item.portion} • P: {item.protein}g • C: {item.carbs}g • F: {item.fats}g
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="font-extrabold text-on-surface text-sm font-mono">
                                {item.calories} <span className="text-[10px] font-normal text-on-surface-variant">kcal</span>
                              </span>
                              <button
                                onClick={() => onRemoveFoodItem(slot.id, item.id)}
                                title="Remove food item"
                                className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-error-container/30 flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}

                    {/* Meal Macro Subtotal */}
                    <div className="pt-3 mt-1 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                      <span>Meal Subtotal</span>
                      <span className="font-mono">
                        P: {Math.round(slotProtein)}g | C: {Math.round(slotCarbs)}g | F: {Math.round(slotFat)}g
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-1">
                    <p className="text-xs text-on-surface-variant">
                      No items logged yet for {slot.title}.
                    </p>
                    <p className="text-[11px] text-outline">
                      Select food from the right to log this meal.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Search & Add Inspector */}
        <div className="lg:col-span-5 space-y-5">
          <div
            id="food-search-box"
            className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-on-surface">
                Log Food & Macro Accounting
              </h3>
              {/* Tab: Catalog vs Manual */}
              <div className="flex bg-surface-container-low p-0.5 rounded-lg text-xs font-semibold">
                <button
                  id="tab-catalog-food"
                  onClick={() => setActiveLogMode('catalog')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeLogMode === 'catalog'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Catalog
                </button>
                <button
                  id="tab-manual-food"
                  onClick={() => setActiveLogMode('manual')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeLogMode === 'manual'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Target Meal Slot Selector */}
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                Target Meal:
              </label>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((slot) => (
                  <button
                    key={slot}
                    id={`select-slot-${slot}`}
                    onClick={() => setSelectedMealSlot(slot)}
                    className={`py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                      selectedMealSlot === slot
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {activeLogMode === 'catalog' ? (
              <>
                {/* Search Input */}
                <div className="relative mb-3">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    id={searchInputId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search staple foods (Roti, Dal, Paneer, Rice, Egg)..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                {/* Dietary Tag filters */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'gluten-free', label: 'Gluten-Free' },
                    { id: 'eggetarian', label: 'Eggetarian' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedDietaryTag(filter.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedDietaryTag === filter.id
                          ? 'bg-primary text-white font-bold'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Catalog Food List */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {isSearchingCatalog ? (
                    <div className="py-6 text-center text-xs text-on-surface-variant">
                      Searching curated food catalog...
                    </div>
                  ) : catalogFoods.length > 0 ? (
                    catalogFoods.map((food) => {
                      const isSelected = selectedCatalogFood?.id === food.id;
                      return (
                        <div
                          key={food.id}
                          onClick={() => handleSelectCatalogFood(food)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-primary bg-primary-fixed/20 shadow-xs'
                              : 'border-outline-variant/20 hover:border-outline-variant/60 bg-surface-container-lowest'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-on-surface">{food.name}</div>
                            <div className="text-[11px] text-on-surface-variant">
                              {food.serving.amount} {food.serving.unit} • {food.category}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-on-surface font-mono">
                              {food.nutritionPerServing.calories} kcal
                            </span>
                            <div className="text-[10px] text-primary font-semibold">
                              {food.nutritionPerServing.proteinG}g Protein
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Fallback to offline staples if catalog empty or initial load
                    searchDatabaseStaples.map((staple, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedCatalogFood({
                            id: 'staple-' + i,
                            name: staple.name,
                            category: staple.category,
                            serving: { amount: 1, unit: 'serving' },
                            nutritionPerServing: {
                              calories: staple.calories,
                              proteinG: staple.protein,
                              carbsG: staple.carbs,
                              fatG: staple.fats,
                              fiberG: 3,
                            },
                            alternativeUnits: [],
                            tags: [],
                            dietaryTags: ['vegetarian'],
                          });
                          setCatalogQuantity(1);
                          setCatalogUnit('serving');
                        }}
                        className="p-2.5 rounded-xl border border-outline-variant/20 text-xs cursor-pointer bg-surface-container-lowest hover:border-primary flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-on-surface">{staple.name}</div>
                          <div className="text-[11px] text-on-surface-variant">{staple.defaultPortion}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-on-surface font-mono">{staple.calories} kcal</span>
                          <div className="text-[10px] text-primary font-semibold">{staple.protein}g P</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Selected Food Portion Inspector */}
                {selectedCatalogFood && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/20 bg-surface-container-low p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-primary">
                          {selectedCatalogFood.category}
                        </span>
                        <h4 className="text-sm font-extrabold text-on-surface">
                          {selectedCatalogFood.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-on-surface font-mono">
                          {preview.calories} <span className="text-xs font-normal">kcal</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity and Unit Selectors */}
                    <div className="grid grid-cols-2 gap-2 my-3">
                      <div>
                        <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                          Portion Amount:
                        </label>
                        <input
                          id="portion-quantity-input"
                          type="number"
                          step="0.5"
                          min="0.1"
                          max="5000"
                          value={catalogQuantity}
                          onChange={(e) => setCatalogQuantity(parseFloat(e.target.value) || 0)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono font-bold text-on-surface"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                          Unit:
                        </label>
                        <select
                          id="portion-unit-select"
                          value={catalogUnit}
                          onChange={(e) => setCatalogUnit(e.target.value as any)}
                          className="w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface"
                        >
                          <option value={selectedCatalogFood.serving.unit}>
                            {selectedCatalogFood.serving.unit} (standard)
                          </option>
                          {selectedCatalogFood.alternativeUnits?.map((alt, idx) => (
                            <option key={idx} value={alt.unit}>
                              {alt.unit} (~{alt.gramsEquivalent}g)
                            </option>
                          ))}
                          {selectedCatalogFood.serving.unit !== 'g' && <option value="g">grams (g)</option>}
                          {selectedCatalogFood.serving.unit !== 'piece' && <option value="piece">piece</option>}
                          {selectedCatalogFood.serving.unit !== 'serving' && <option value="serving">serving</option>}
                        </select>
                      </div>
                    </div>

                    {/* Scaled Macro Preview */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs py-2 bg-surface-container-lowest rounded-lg mb-3">
                      <div>
                        <span className="text-[9px] text-on-surface-variant block">Protein</span>
                        <span className="font-bold text-primary">{preview.protein}g</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-on-surface-variant block">Carbs</span>
                        <span className="font-bold text-secondary">{preview.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-on-surface-variant block">Fat</span>
                        <span className="font-bold text-tertiary">{preview.fat}g</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-on-surface-variant block">Fiber</span>
                        <span className="font-bold text-outline">{preview.fiber}g</span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      id="log-catalog-food-btn"
                      onClick={handleLogFood}
                      disabled={isSubmitting || catalogQuantity <= 0}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-container shadow-xs disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>
                        {isSubmitting
                          ? 'Logging...'
                          : `Add to ${selectedMealSlot.toUpperCase()} (${preview.calories} kcal)`}
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Manual Custom Food Entry Form (FR-CAL-007) */
              <div className="space-y-3 bg-surface-container-low p-4 rounded-xl">
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                    Food Name:
                  </label>
                  <input
                    id="manual-food-name-input"
                    type="text"
                    placeholder="e.g. Homemade Palak Paneer, Sattu Paratha"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full py-1.5 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                      Calories (kcal):
                    </label>
                    <input
                      id="manual-food-calories-input"
                      type="number"
                      min="0"
                      max="5000"
                      placeholder="e.g. 280"
                      value={manualCalories}
                      onChange={(e) =>
                        setManualCalories(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full py-1.5 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono font-bold text-on-surface"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                      Protein (g):
                    </label>
                    <input
                      id="manual-food-protein-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 14.5"
                      value={manualProtein}
                      onChange={(e) =>
                        setManualProtein(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full py-1.5 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                      Carbs (g):
                    </label>
                    <input
                      id="manual-food-carbs-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 22"
                      value={manualCarbs}
                      onChange={(e) =>
                        setManualCarbs(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                      Fat (g):
                    </label>
                    <input
                      id="manual-food-fat-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 10"
                      value={manualFat}
                      onChange={(e) =>
                        setManualFat(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                      Fiber (g):
                    </label>
                    <input
                      id="manual-food-fiber-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 4.5"
                      value={manualFiber}
                      onChange={(e) =>
                        setManualFiber(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                      Portion Amount:
                    </label>
                    <input
                      id="manual-food-quantity-input"
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(Number(e.target.value) || 1)}
                      className="w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono font-bold text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                      Unit:
                    </label>
                    <select
                      id="manual-food-unit-select"
                      value={manualUnit}
                      onChange={(e) => setManualUnit(e.target.value as any)}
                      className="w-full py-1.5 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface"
                    >
                      <option value="serving">serving</option>
                      <option value="piece">piece</option>
                      <option value="g">grams (g)</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>

                <button
                  id="log-manual-food-btn"
                  onClick={handleLogFood}
                  disabled={isSubmitting || !manualName.trim() || manualCalories === ''}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-container shadow-xs disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5 mt-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>
                    {isSubmitting ? 'Saving...' : `Log Custom Food to ${selectedMealSlot.toUpperCase()}`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* AI Food Scanner Gateway Card */}
          {onNavigate && (
            <div
              id="scanner-shortcut-card"
              onClick={() => onNavigate('ai-food-scanner')}
              className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary cursor-pointer transition-all flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">document_scanner</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                  AI Indian Thali Scanner
                </div>
                <div className="text-[11px] text-on-surface-variant">
                  Capture a photo of your plate to auto-detect portions and calories.
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Log Item Modal (FR-CAL-005) */}
      {editingLogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-5 border border-outline-variant/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="text-sm font-extrabold text-on-surface">Edit Meal Entry</h3>
              <button
                onClick={() => setEditingLogItem(null)}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
                Food Item
              </span>
              <div className="font-bold text-sm text-on-surface mt-0.5">
                {editingLogItem.foodNameSnapshot}
              </div>
              <div className="text-xs text-on-surface-variant capitalize mt-0.5">
                Slot: {editingLogItem.mealType}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                  Quantity:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full py-1.5 px-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-on-surface-variant block mb-1">
                  Unit:
                </label>
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value as any)}
                  className="w-full py-1.5 px-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-semibold"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="piece">piece</option>
                  <option value="serving">serving</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setEditingLogItem(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface-container text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting || editQuantity <= 0}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-container disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Recalculate & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
