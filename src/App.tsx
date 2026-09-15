/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScreenId, UserProfile, MealSlot, FoodItem } from './types';
import { initialUserProfile, initialMealSlots } from './data/mockData';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { NutritionLogView } from './components/NutritionLogView';
import { DietPlanView } from './components/DietPlanView';
import { ExerciseView } from './components/ExerciseView';
import { FoodScannerView } from './components/FoodScannerView';
import { BmiHealthView } from './components/BmiHealthView';
import { WorkoutTimerModal } from './components/WorkoutTimerModal';
import { QuickAddModal } from './components/QuickAddModal';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [mealSlots, setMealSlots] = useState<MealSlot[]>(initialMealSlots);

  // Modals & Feedback
  const [isWorkoutTimerOpen, setIsWorkoutTimerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddSlot, setQuickAddSlot] = useState<string>('lunch');
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3000);
  };

  // Water Quick Log
  const handleQuickLogWater = () => {
    setUserProfile((prev) => ({
      ...prev,
      currentHydrationL: parseFloat((prev.currentHydrationL + 0.25).toFixed(2)),
    }));
    showToast('Logged +250ml water! Hydration synced.');
  };

  // Add food item to slot
  const handleAddFoodItem = (slotId: 'breakfast' | 'lunch' | 'snack' | 'dinner', item: FoodItem) => {
    setMealSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          return {
            ...slot,
            items: [...slot.items, item],
            loggedCalories: slot.loggedCalories + item.calories,
          };
        }
        return slot;
      })
    );
  };

  // Remove food item from slot
  const handleRemoveFoodItem = (slotId: string, itemId: string) => {
    setMealSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          const removed = slot.items.find((i) => i.id === itemId);
          const newItems = slot.items.filter((i) => i.id !== itemId);
          return {
            ...slot,
            items: newItems,
            loggedCalories: Math.max(0, slot.loggedCalories - (removed?.calories || 0)),
          };
        }
        return slot;
      })
    );
    showToast('Removed item from meal log.');
  };

  // Update Weight and Height from BMI View
  const handleUpdateWeight = (newWeight: number, newHeight: number) => {
    setUserProfile((prev) => ({
      ...prev,
      weightKg: newWeight,
      heightCm: newHeight,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased font-sans">
      {/* Top Navigation */}
      <Navigation
        activeScreen={activeScreen}
        onNavigate={(screen) => {
          setActiveScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        userProfile={userProfile}
        onQuickLogWater={handleQuickLogWater}
        onOpenQuickScan={() => {
          setActiveScreen('ai-food-scanner');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Global Toast Alert */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-on-surface text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center space-x-2 border border-outline-variant/30 animate-fade-in">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span>
          <span>{globalToast}</span>
        </div>
      )}

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeScreen === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            mealSlots={mealSlots}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogWater={handleQuickLogWater}
            onOpenQuickAdd={(slotId) => {
              setQuickAddSlot(slotId || 'lunch');
              setIsQuickAddOpen(true);
            }}
            onStartWorkout={() => setIsWorkoutTimerOpen(true)}
          />
        )}

        {activeScreen === 'nutrition-and-calorie-tracking' && (
          <NutritionLogView
            userProfile={userProfile}
            mealSlots={mealSlots}
            onAddFoodItem={handleAddFoodItem}
            onRemoveFoodItem={handleRemoveFoodItem}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeScreen === 'personalized-diet-plan' && (
          <DietPlanView
            userProfile={userProfile}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddFoodItem={handleAddFoodItem}
          />
        )}

        {activeScreen === 'exercise-recommendation' && (
          <ExerciseView
            userProfile={userProfile}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartWorkout={() => setIsWorkoutTimerOpen(true)}
          />
        )}

        {activeScreen === 'ai-food-scanner' && (
          <FoodScannerView
            userProfile={userProfile}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddFoodItem={handleAddFoodItem}
          />
        )}

        {activeScreen === 'bmi-and-body-health' && (
          <BmiHealthView
            userProfile={userProfile}
            onUpdateWeight={handleUpdateWeight}
          />
        )}
      </main>

      {/* Interactive Modals */}
      <WorkoutTimerModal
        isOpen={isWorkoutTimerOpen}
        onClose={() => setIsWorkoutTimerOpen(false)}
        onCompleteWorkout={() => {
          setIsWorkoutTimerOpen(false);
          showToast('Workout circuit completed! 185 kcal recorded to daily burn.');
        }}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        defaultSlotId={quickAddSlot}
        onClose={() => setIsQuickAddOpen(false)}
        onAddFood={(slotId, item) => {
          handleAddFoodItem(slotId, item);
          showToast(`Added ${item.name} (${item.calories} kcal) to ${slotId}!`);
        }}
      />

      {/* Global Application Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-8 mt-12 text-xs text-on-surface-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-xs">
              <span className="material-symbols-outlined text-[16px]">vital_signs</span>
            </div>
            <span className="font-bold text-on-surface">NutriPulse Metabolic OS</span>
            <span>• Evidence-Based Indian Culinary Health</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button onClick={() => setActiveScreen('dashboard')} className="hover:text-primary transition-colors">
              Dashboard
            </button>
            <button onClick={() => setActiveScreen('nutrition-and-calorie-tracking')} className="hover:text-primary transition-colors">
              Nutrition Log
            </button>
            <button onClick={() => setActiveScreen('personalized-diet-plan')} className="hover:text-primary transition-colors">
              Meal Planner
            </button>
            <button onClick={() => setActiveScreen('exercise-recommendation')} className="hover:text-primary transition-colors">
              Workouts
            </button>
            <button onClick={() => setActiveScreen('ai-food-scanner')} className="hover:text-primary transition-colors">
              Plate Scanner
            </button>
            <button onClick={() => setActiveScreen('bmi-and-body-health')} className="hover:text-primary transition-colors">
              BMI & Health
            </button>
          </div>

          <div className="text-[11px] text-outline">
            Standards: ICMR-NIN 2024 Dietary Guidelines
          </div>
        </div>
      </footer>
    </div>
  );
}
