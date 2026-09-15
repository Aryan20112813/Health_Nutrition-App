import React, { useState } from 'react';
import { MealSlot, FoodItem, UserProfile, ScreenId } from '../types';
import { searchDatabaseStaples } from '../data/mockData';

interface NutritionLogViewProps {
  userProfile: UserProfile;
  mealSlots: MealSlot[];
  onAddFoodItem: (slotId: 'breakfast' | 'lunch' | 'snack' | 'dinner', item: FoodItem) => void;
  onRemoveFoodItem: (slotId: string, itemId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const NutritionLogView: React.FC<NutritionLogViewProps> = ({
  userProfile,
  mealSlots,
  onAddFoodItem,
  onRemoveFoodItem,
  onNavigate,
}) => {
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMealSlot, setSelectedMealSlot] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('dinner');
  
  // Quick-Add Inspector state
  const [activeFood, setActiveFood] = useState(searchDatabaseStaples[0]);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [justAddedNotice, setJustAddedNotice] = useState<string | null>(null);

  // Calorie calculations
  const totalCalories = mealSlots.reduce(
    (sum, slot) => sum + slot.items.reduce((acc, i) => acc + i.calories, 0),
    0
  );
  const totalProtein = mealSlots.reduce(
    (sum, slot) => sum + slot.items.reduce((acc, i) => acc + i.protein, 0),
    0
  );
  const totalCarbs = mealSlots.reduce(
    (sum, slot) => sum + slot.items.reduce((acc, i) => acc + i.carbs, 0),
    0
  );
  const totalFats = mealSlots.reduce(
    (sum, slot) => sum + slot.items.reduce((acc, i) => acc + i.fats, 0),
    0
  );

  const budget = userProfile.dailyCalorieBudget;
  const remaining = Math.max(0, budget - totalCalories);
  const percentage = Math.min(100, Math.round((totalCalories / budget) * 100));

  // Filtered staples
  const filteredStaples = searchDatabaseStaples.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const handleAddCurrentFood = () => {
    const newItem: FoodItem = {
      id: 'food-' + Date.now(),
      name: activeFood.name,
      category: activeFood.category,
      portion: `${servingMultiplier > 1 ? servingMultiplier + '× ' : ''}${activeFood.defaultPortion}`,
      calories: Math.round(activeFood.calories * servingMultiplier),
      protein: Math.round(activeFood.protein * servingMultiplier * 10) / 10,
      carbs: Math.round(activeFood.carbs * servingMultiplier * 10) / 10,
      fats: Math.round(activeFood.fats * servingMultiplier * 10) / 10,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddFoodItem(selectedMealSlot, newItem);
    setJustAddedNotice(`Added ${newItem.name} to ${selectedMealSlot.toUpperCase()}!`);
    setTimeout(() => setJustAddedNotice(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Date Bar & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Nutrition & Calorie Log
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Indian Culinary Macro Accounting • ICMR-NIN Energy Targets
          </p>
        </div>

        {/* Date Tabs */}
        <div className="flex items-center space-x-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 self-start sm:self-center">
          <button
            onClick={() => setSelectedDate('yesterday')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDate === 'yesterday'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setSelectedDate('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDate === 'today'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Today (24 Oct)
          </button>
          <button
            onClick={() => setSelectedDate('tomorrow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDate === 'tomorrow'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Hero Calorie & Macro Telemetry Banner */}
      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Calorie Gauge (4 Cols) */}
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
                  {percentage}% Budget Used
                </span>
              </div>
              <div className="text-sm font-extrabold text-on-surface mt-1.5">
                {totalCalories} <span className="text-xs font-normal text-on-surface-variant">/ {budget} kcal</span>
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                Active Burn: <span className="font-semibold text-secondary">~185 kcal</span>
              </div>
            </div>
          </div>

          {/* Macro Progress Bars (5 Cols) */}
          <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-outline-variant/20 pb-4 lg:pb-0 lg:pr-4">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  Protein
                </span>
                <span className="text-on-surface-variant font-mono">
                  {Math.round(totalProtein)}g / {userProfile.targetProtein}g ({Math.round((totalProtein / userProfile.targetProtein) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalProtein / userProfile.targetProtein) * 100)}%` }}
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
                  {Math.round(totalCarbs)}g / {userProfile.targetCarbs}g ({Math.round((totalCarbs / userProfile.targetCarbs) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-secondary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCarbs / userProfile.targetCarbs) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                  Dietary Fats
                </span>
                <span className="text-on-surface-variant font-mono">
                  {Math.round(totalFats)}g / {userProfile.targetFats}g ({Math.round((totalFats / userProfile.targetFats) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-tertiary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFats / userProfile.targetFats) * 100)}%` }}
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
                  24g / {userProfile.targetFiber}g (80%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div className="bg-outline h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>

          {/* Micronutrient Quick Screen (3 Cols) */}
          <div className="lg:col-span-3 space-y-2.5">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
              Micronutrient Screen
            </span>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low">
              <span className="text-on-surface">Sodium Intake</span>
              <span className="font-semibold text-primary">1,840 mg / 2,000 mg</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low">
              <span className="text-on-surface">Water Intake</span>
              <span className="font-semibold text-tertiary">{userProfile.currentHydrationL}L / 3.0L</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low">
              <span className="text-on-surface">Added Sugar</span>
              <span className="font-semibold text-on-surface-variant">12g / 25g limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Meal Timelines (Left 7 cols) & Quick Food Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meal Logs Timeline */}
        <div className="lg:col-span-7 space-y-5">
          {mealSlots.map((slot) => {
            const slotCalories = slot.items.reduce((sum, item) => sum + item.calories, 0);
            const slotProtein = slot.items.reduce((sum, item) => sum + item.protein, 0);
            const slotCarbs = slot.items.reduce((sum, item) => sum + item.carbs, 0);
            const slotFats = slot.items.reduce((sum, item) => sum + item.fats, 0);

            return (
              <div
                key={slot.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">
                        {slot.id === 'breakfast' ? 'free_breakfast' : slot.id === 'lunch' ? 'lunch_dining' : slot.id === 'snack' ? 'coffee' : 'dinner_dining'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-on-surface">{slot.title}</h3>
                        <span className="text-xs text-on-surface-variant">{slot.time}</span>
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        Target: ~{slot.targetCalories} kcal • Logged: <strong className="text-on-surface">{slotCalories} kcal</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMealSlot(slot.id);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center space-x-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {/* Items in Slot */}
                {slot.items.length > 0 ? (
                  <div className="divide-y divide-outline-variant/20 mt-2">
                    {slot.items.map((item) => (
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

                    {/* Subtotal Macro strip */}
                    <div className="pt-3 mt-1 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                      <span>Meal Summary</span>
                      <span>
                        P: {Math.round(slotProtein)}g | C: {Math.round(slotCarbs)}g | F: {Math.round(slotFats)}g
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-on-surface-variant">
                      No items logged yet for {slot.title}.
                    </p>
                    {slot.isSuggested && (
                      <div className="p-3.5 rounded-xl bg-primary-fixed/25 border border-primary-fixed inline-block text-left max-w-md mx-auto">
                        <div className="flex items-center space-x-2 text-xs font-bold text-primary">
                          <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                          <span>Intelligent Evening Recommendation</span>
                        </div>
                        <p className="text-xs text-on-surface mt-1">
                          Moong Dal Khichdi with Soya Chunks Bhurji (~550 kcal, 30g Protein).
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => {
                              onAddFoodItem('dinner', {
                                id: 'd-suggested-' + Date.now(),
                                name: 'Moong Dal Khichdi with Soya Chunks',
                                category: 'Dinner Staple',
                                portion: '1 Bowl (250g)',
                                calories: 550,
                                protein: 30,
                                carbs: 76,
                                fats: 12,
                                time: '08:30 PM',
                              });
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-container"
                          >
                            + Log This Meal
                          </button>
                          <button
                            onClick={() => onNavigate('ai-food-scanner')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-lowest text-primary border border-primary/30"
                          >
                            Scan Plate Instead
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Quick Food Search & Add Inspector */}
        <div className="lg:col-span-5 space-y-5">
          {/* Notification Toast if just added */}
          {justAddedNotice && (
            <div className="p-3 rounded-xl bg-primary text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{justAddedNotice}</span>
            </div>
          )}

          {/* Search Box & Quick Food Selector */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <h3 className="text-base font-extrabold text-on-surface mb-3">
              Quick Food Search & Macro Calculator
            </h3>

            {/* Search Input */}
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Indian dishes (e.g., Paneer, Dal, Idli)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            {/* Filter tags */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
              {['All', 'High Protein', 'Appetizer', 'Curry', 'Salad'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-white font-bold'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Staples List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredStaples.map((food, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveFood(food);
                    setServingMultiplier(1);
                  }}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    activeFood.name === food.name
                      ? 'border-primary bg-primary-fixed/20 shadow-xs'
                      : 'border-outline-variant/20 hover:border-outline-variant/60 bg-surface-container-lowest'
                  }`}
                >
                  <div>
                    <div className="font-bold text-on-surface">{food.name}</div>
                    <div className="text-[11px] text-on-surface-variant">{food.defaultPortion}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-on-surface">{food.calories} kcal</span>
                    <div className="text-[10px] text-primary font-semibold">{food.protein}g Protein</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Food Detail Inspector */}
            <div className="mt-4 pt-4 border-t border-outline-variant/20 bg-surface-container-low p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-primary">{activeFood.category}</span>
                  <h4 className="text-sm font-extrabold text-on-surface">{activeFood.name}</h4>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-on-surface font-mono">
                    {Math.round(activeFood.calories * servingMultiplier)} <span className="text-xs font-normal">kcal</span>
                  </div>
                </div>
              </div>

              {/* Serving controls */}
              <div className="flex items-center justify-between gap-2 my-3">
                <div className="text-xs text-on-surface-variant">Serving Count:</div>
                <div className="flex items-center space-x-2 bg-surface-container-lowest px-2 py-1 rounded-lg border border-outline-variant/30">
                  <button
                    onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                    className="w-6 h-6 rounded bg-surface-container flex items-center justify-center font-bold text-on-surface hover:bg-surface-container-high"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold px-1.5">{servingMultiplier}×</span>
                  <button
                    onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                    className="w-6 h-6 rounded bg-surface-container flex items-center justify-center font-bold text-on-surface hover:bg-surface-container-high"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dynamic Macro breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-surface-container-lowest rounded-lg mb-3">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Protein</span>
                  <span className="font-bold text-primary">
                    {Math.round(activeFood.protein * servingMultiplier * 10) / 10}g
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Carbs</span>
                  <span className="font-bold text-secondary">
                    {Math.round(activeFood.carbs * servingMultiplier * 10) / 10}g
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Fats</span>
                  <span className="font-bold text-tertiary">
                    {Math.round(activeFood.fats * servingMultiplier * 10) / 10}g
                  </span>
                </div>
              </div>

              {/* Destination Slot Picker */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                  Log into Meal Slot:
                </label>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedMealSlot(slot)}
                      className={`py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                        selectedMealSlot === slot
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add CTA */}
              <button
                id="quick-add-to-log-btn"
                onClick={handleAddCurrentFood}
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25 transition-all flex items-center justify-center space-x-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Add to {selectedMealSlot.toUpperCase()} Log</span>
              </button>
            </div>
          </div>

          {/* Metabolic Pro-Tip Box */}
          <div className="p-4 rounded-2xl bg-secondary-fixed/30 border border-secondary-fixed text-xs text-on-secondary-fixed-variant space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-secondary">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>Indian Nutritional Science Pro-Tip</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Combining lentils (like Dal) with cereal grains (Roti or Rice) completes the essential amino acid spectrum (Methionine in grains + Lysine in pulses), yielding high biological value protein without meat.
            </p>
          </div>

          {/* Snap Thali Card */}
          <div
            onClick={() => onNavigate('ai-food-scanner')}
            className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary cursor-pointer transition-all flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">document_scanner</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Don't want to type? Scan Thali
              </div>
              <div className="text-[11px] text-on-surface-variant">
                Volumetric plate analysis with Indian regional curry recognition.
              </div>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">
              chevron_right
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
