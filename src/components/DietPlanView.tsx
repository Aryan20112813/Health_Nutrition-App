import React, { useState } from 'react';
import { DietPlanMeal, UserProfile, ScreenId, FoodItem } from '../types';
import { initialDietPlanMeals } from '../data/mockData';

interface DietPlanViewProps {
  userProfile: UserProfile;
  onNavigate: (screen: ScreenId) => void;
  onAddFoodItem: (slotId: 'breakfast' | 'lunch' | 'snack' | 'dinner', item: FoodItem) => void;
}

export const DietPlanView: React.FC<DietPlanViewProps> = ({
  userProfile,
  onNavigate,
  onAddFoodItem,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'preferences'>('today');
  const [selectedRegime, setSelectedRegime] = useState<string>('Eggetarian');
  const [isLactoseFree, setIsLactoseFree] = useState(false);
  const [meals, setMeals] = useState<DietPlanMeal[]>(initialDietPlanMeals);
  const [swappedMealId, setSwappedMealId] = useState<string | null>(null);

  // Grocery checklist state
  const [groceryItems, setGroceryItems] = useState([
    { id: 'g1', name: 'Farm Fresh Eggs (12 pack)', checked: true, qty: '1 tray' },
    { id: 'g2', name: 'Organic Thick Poha (500g)', checked: true, qty: '1 pack' },
    { id: 'g3', name: 'Low-Fat Fresh Paneer (200g)', checked: false, qty: '200g' },
    { id: 'g4', name: 'Yellow Moong Dal (1 kg)', checked: true, qty: '1 kg' },
    { id: 'g5', name: 'Rolled Oats (500g)', checked: false, qty: '500g' },
    { id: 'g6', name: 'Kala Chana (Black Chickpeas)', checked: false, qty: '500g' },
    { id: 'g7', name: 'Nutrela Soya Chunks (200g)', checked: true, qty: '1 pack' },
  ]);

  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const toggleGroceryItem = (id: string) => {
    setGroceryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSwapMeal = (mealId: string) => {
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id === mealId) {
          const oldTitle = m.dishTitle;
          const newTitle = m.alternative;
          return {
            ...m,
            dishTitle: newTitle,
            alternative: oldTitle,
          };
        }
        return m;
      })
    );
    setSwappedMealId(mealId);
    setTimeout(() => setSwappedMealId(null), 2500);
  };

  const handleLogMealToDiary = (meal: DietPlanMeal) => {
    const slotMapping: Record<string, 'breakfast' | 'lunch' | 'snack' | 'dinner'> = {
      'dp-1': 'breakfast',
      'dp-2': 'lunch',
      'dp-3': 'snack',
      'dp-4': 'dinner',
    };

    const slot = slotMapping[meal.id] || 'dinner';
    const newItem: FoodItem = {
      id: 'plan-log-' + Date.now(),
      name: meal.dishTitle,
      category: 'Diet Plan',
      portion: '1 Recommended Serving',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      time: meal.time,
    };

    onAddFoodItem(slot, newItem);
    setCopiedNotification(`Logged "${meal.dishTitle.slice(0, 24)}..." into ${slot.toUpperCase()}!`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleSendGroceryList = () => {
    const listText = groceryItems
      .map((item) => `${item.checked ? '✓' : '○'} ${item.name} (${item.qty})`)
      .join('\n');
    navigator.clipboard?.writeText?.(listText);
    setCopiedNotification('Grocery list copied! Ready to paste into Zepto or WhatsApp.');
    setTimeout(() => setCopiedNotification(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
              Metabolic Sync v3.4
            </span>
            <span className="text-xs text-on-surface-variant">• Week 4 Cycle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            Aryan's Nutrition Blueprint
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Calibrated for Eggetarian Active • 2,200 kcal Maintenance • ICMR-NIN Micronutrient Harmony
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setCopiedNotification('AI optimizing meal timing for your workout schedule...');
              setTimeout(() => setCopiedNotification(null), 2500);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>Regenerate Plan (AI)</span>
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {copiedNotification && (
        <div className="p-3 rounded-xl bg-primary text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'today'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          Today's Plan (24 Oct)
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'weekly'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          Weekly Meal Rotation
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'preferences'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          Dietary Rules & Allergies
        </button>
      </div>

      {activeTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Left: Chrono-Nutrition Sequence (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs hover:border-outline-variant/60 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
                        {meal.mealName}
                      </span>
                      <span className="text-xs text-on-surface-variant">• {meal.time}</span>
                      {meal.completed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed text-on-primary-fixed flex items-center space-x-0.5">
                          <span className="material-symbols-outlined text-[13px]">check</span>
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-on-surface mt-1">
                      {meal.dishTitle}
                    </h3>
                  </div>

                  <span className="text-xs font-mono font-bold text-on-surface bg-surface-container-low px-2.5 py-1 rounded-lg">
                    Prep: {meal.prepTime}
                  </span>
                </div>

                {/* Content Image & Description */}
                <div className="mt-3 flex flex-col sm:flex-row gap-4">
                  <img
                    src={meal.image}
                    alt={meal.dishTitle}
                    className="w-full sm:w-28 h-28 rounded-xl object-cover shrink-0 border border-outline-variant/20"
                  />
                  <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                    <p>{meal.description}</p>
                    {meal.cookingTip && (
                      <div className="p-2 rounded-lg bg-surface-container-low text-[11px] text-on-surface flex items-start space-x-1.5">
                        <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                          local_dining
                        </span>
                        <span>
                          <strong className="text-secondary">Chef's Tip:</strong> {meal.cookingTip}
                        </span>
                      </div>
                    )}
                    {meal.sleepTip && (
                      <div className="p-2 rounded-lg bg-tertiary-fixed/30 text-[11px] text-on-tertiary-fixed-variant flex items-start space-x-1.5">
                        <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">
                          bedtime
                        </span>
                        <span>
                          <strong className="text-tertiary">Sleep Hygiene:</strong> {meal.sleepTip}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Macro Badges */}
                <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-outline-variant/20 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-on-surface-variant block">Energy</span>
                    <strong className="font-extrabold text-on-surface">{meal.calories} kcal</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-on-surface-variant block">Protein</span>
                    <strong className="font-extrabold text-primary">{meal.protein}g</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-on-surface-variant block">Carbs</span>
                    <strong className="font-extrabold text-secondary">{meal.carbs}g</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-on-surface-variant block">Fats</span>
                    <strong className="font-extrabold text-tertiary">{meal.fats}g</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-on-surface-variant block">Fiber</span>
                    <strong className="font-extrabold text-outline">{meal.fiber}g</strong>
                  </div>
                </div>

                {/* Bottom Actions: Alternative Swap & Log Meal */}
                <div className="mt-3 pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-on-surface-variant truncate max-w-xs">
                    <span className="text-[11px] font-semibold text-outline">Alternative:</span>
                    <span className="italic truncate">{meal.alternative}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSwapMeal(meal.id)}
                      className="px-3 py-1.5 rounded-lg font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center space-x-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      <span>Swap</span>
                    </button>
                    <button
                      onClick={() => handleLogMealToDiary(meal)}
                      className="px-3.5 py-1.5 rounded-lg font-bold bg-primary text-white hover:bg-primary-container shadow-xs transition-colors flex items-center space-x-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Log to Diary</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar: Dietary Regimes & Smart Pantry (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Dietary Regimes Box */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
              <h3 className="text-base font-extrabold text-on-surface mb-1">
                Dietary Archetype
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">
                Selected preferences dynamically recalibrate recipe generation.
              </p>

              <div className="space-y-2">
                {[
                  { id: 'Eggetarian', label: 'Eggetarian (Current)', desc: 'Vegetarian meals supplemented with whole eggs & egg whites for bioavailable protein.' },
                  { id: 'Vegetarian', label: 'Strict Lacto-Vegetarian', desc: 'No eggs. Emphasizes paneer, lentils, curd, and sprouted pulses.' },
                  { id: 'Jain', label: 'Jain Friendly', desc: 'Lacto-vegetarian strictly excluding roots, tubers, onion, and garlic.' },
                  { id: 'Non-Vegetarian', label: 'Omnivore / Non-Vegetarian', desc: 'Includes chicken breast, fish, and eggs for lean protein density.' },
                ].map((regime) => (
                  <label
                    key={regime.id}
                    onClick={() => setSelectedRegime(regime.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer block transition-all ${
                      selectedRegime === regime.id
                        ? 'border-primary bg-primary-fixed/20 shadow-xs'
                        : 'border-outline-variant/30 hover:border-outline-variant/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">{regime.label}</span>
                      <input
                        type="radio"
                        checked={selectedRegime === regime.id}
                        onChange={() => setSelectedRegime(regime.id)}
                        className="text-primary focus:ring-primary"
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1">{regime.desc}</p>
                  </label>
                ))}
              </div>

              {/* Lactose tolerance toggle */}
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-on-surface">Lactose Sensitivity</div>
                  <div className="text-[11px] text-on-surface-variant">Replace milk/curd with plant alternatives</div>
                </div>
                <button
                  onClick={() => setIsLactoseFree(!isLactoseFree)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    isLactoseFree ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      isLactoseFree ? 'left-6' : 'left-1'
                    }`}
                  ></span>
                </button>
              </div>
            </div>

            {/* Smart Weekly Pantry Checklist */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    Smart Grocery Pantry
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Ingredients for this week's plan • ~₹850 Est.
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary text-[22px]">shopping_cart</span>
              </div>

              <div className="space-y-1.5 my-3 max-h-56 overflow-y-auto pr-1">
                {groceryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleGroceryItem(item.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      item.checked ? 'bg-surface-container-low border-outline-variant/20 line-through text-outline' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`material-symbols-outlined text-[18px] ${item.checked ? 'text-primary' : 'text-outline'}`}>
                        {item.checked ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono text-[11px] text-on-surface-variant">{item.qty}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSendGroceryList}
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-colors flex items-center justify-center space-x-2"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                <span>Copy List for Zepto / Blinkit</span>
              </button>
            </div>

            {/* Clinical Evidence Box */}
            <div className="p-4 rounded-2xl bg-surface-container-low text-on-surface-variant text-[11px] leading-relaxed border border-outline-variant/20 flex items-start space-x-2.5">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                verified
              </span>
              <div>
                <strong className="text-on-surface">Indian Phenotype Optimization:</strong> Traditional Indian diets are often carb-dominant (70%+). This blueprint intentionally raises bioavailable protein to 22% and incorporates soluble viscous fiber (sprouts, oats, fenugreek) to blunt postprandial glucose surges.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-on-surface">7-Day Indian Meal Rotation Cycle</h2>
          <p className="text-xs text-on-surface-variant">Designed to eliminate culinary fatigue while hitting consistent 2,200 kcal daily macros.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[
              { day: 'Monday', focus: 'Iron & Fiber Focus', breakfast: 'Vegetable Poha + Boiled Eggs', lunch: 'Roti + Dal Palak + Paneer Bhurji', dinner: 'Moong Khichdi + Beetroot Raita' },
              { day: 'Tuesday', focus: 'Sustained Energy', breakfast: 'Besan Chilla + Mint Chutney', lunch: 'Brown Rice + Rajma Masala + Salad', dinner: 'Tofu/Paneer Stir Fry + Roti' },
              { day: 'Wednesday', focus: 'High Biological Value', breakfast: 'Masala Scrambled Eggs + Multigrain Toast', lunch: 'Jowar Roti + Chana Dal + Baingan Bharta', dinner: 'Soya Chunks Curry + Rice' },
              { day: 'Thursday', focus: 'Gut Microbiome Reset', breakfast: 'Sprouted Moong Salad + Buttermilk', lunch: 'Roti + Yellow Moong Dal + Bhindi', dinner: 'Dalia Vegetable Khichdi + Curd' },
              { day: 'Friday', focus: 'Pre-Weekend Endurance', breakfast: 'Oats Vegetable Upma + Boiled Eggs', lunch: 'Chole Masala + Brown Rice + Cucumber Salad', dinner: 'Paneer Tikka Salad + Warm Bhakri' },
              { day: 'Saturday', focus: 'Active Recovery', breakfast: 'Idli + Sambar + Podi Powder', lunch: 'Roti + Dal Makhani (Low Fat) + Curd', dinner: 'Vegetable Soya Pulao + Boondi Raita' },
              { day: 'Sunday', focus: 'Culinary Rebalance', breakfast: 'Paneer Paratha (Dry Cooked) + Dahi', lunch: 'Sunday Special Homestyle Curry + Roti', dinner: 'Light Bottle Gourd (Lauki) Soup + Toast' },
            ].map((d, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-on-surface">
                  <span className="text-primary">{d.day}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-lowest font-normal">{d.focus}</span>
                </div>
                <div className="pt-2 text-on-surface-variant space-y-1">
                  <div><strong>B:</strong> {d.breakfast}</div>
                  <div><strong>L:</strong> {d.lunch}</div>
                  <div><strong>D:</strong> {d.dinner}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs max-w-2xl space-y-4 text-xs">
          <h2 className="text-lg font-extrabold text-on-surface">Dietary Constraints & Allergen Exclusions</h2>
          <p className="text-on-surface-variant">Customize ingredients and culinary techniques prohibited in your AI plan generator.</p>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
              <div>
                <strong className="text-on-surface block">Tree Nuts Allergy</strong>
                <span className="text-on-surface-variant">Excludes almonds, cashews, and walnuts</span>
              </div>
              <span className="px-2 py-1 rounded bg-surface-container text-outline font-semibold">None Reported</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
              <div>
                <strong className="text-on-surface block">Refined Seed Oils</strong>
                <span className="text-on-surface-variant">Prioritize cold-pressed mustard oil, groundnut oil, or minimal A2 ghee</span>
              </div>
              <span className="px-2 py-1 rounded bg-primary-fixed text-on-primary-fixed font-semibold">Active Filter</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
              <div>
                <strong className="text-on-surface block">Spice Tolerance</strong>
                <span className="text-on-surface-variant">Medium Indian home-cooked spice level</span>
              </div>
              <span className="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold">Medium</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
