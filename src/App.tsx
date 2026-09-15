/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenId, UserProfile, MealSlot, FoodItem } from './types';
import { initialUserProfile, initialMealSlots } from './data/mockData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { NutritionLogView } from './components/NutritionLogView';
import { DietPlanView } from './components/DietPlanView';
import { ExerciseView } from './components/ExerciseView';
import { FoodScannerView } from './components/FoodScannerView';
import { BmiHealthView } from './components/BmiHealthView';
import { WorkoutTimerModal } from './components/WorkoutTimerModal';
import { QuickAddModal } from './components/QuickAddModal';
import { RegisterView } from './components/auth/RegisterView';
import { LoginView } from './components/auth/LoginView';
import { OnboardingView } from './components/auth/OnboardingView';
import { ProfileSettingsModal } from './components/auth/ProfileSettingsModal';

function AppContent() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [mealSlots, setMealSlots] = useState<MealSlot[]>(initialMealSlots);

  // Modals & Feedback
  const [isWorkoutTimerOpen, setIsWorkoutTimerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [quickAddSlot, setQuickAddSlot] = useState<string>('lunch');
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  // Synchronize authenticated user profile from MongoDB Atlas
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        name: user.profile?.displayName || user.email.split('@')[0],
        heightCm: user.profile?.heightCm || prev.heightCm,
        weightKg: user.profile?.weightKg || prev.weightKg,
        gender: user.profile?.sex === 'male' ? 'Male' : user.profile?.sex === 'female' ? 'Female' : 'Other',
        activityLevel: user.profile?.activityLevel || prev.activityLevel,
        goal: user.profile?.goal || prev.goal,
        dietPreference:
          user.preferences?.dietaryPreference === 'vegan'
            ? 'Vegetarian'
            : user.preferences?.dietaryPreference === 'omnivore'
            ? 'Non-Vegetarian'
            : 'Vegetarian',
      }));
    }
  }, [user]);

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3500);
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
    showToast('Item removed from meal log.');
  };

  // Update Weight and Height (synchronized with backend if authenticated)
  const handleUpdateWeight = async (newWeightKg: number, newHeightCm?: number) => {
    setUserProfile((prev) => ({
      ...prev,
      weightKg: newWeightKg,
      heightCm: newHeightCm || prev.heightCm,
    }));

    if (isAuthenticated) {
      await updateProfile({
        weightKg: newWeightKg,
        ...(newHeightCm ? { heightCm: newHeightCm } : {}),
      });
    }
    showToast(`Weight updated to ${newWeightKg} kg! Metrics recalibrated.`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface antialiased selection:bg-primary/20">
      {/* Global Notification Toast */}
      {globalToast && (
        <div className="fixed top-20 right-4 z-50 animate-bounce bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-outline/20">
          <span className="material-symbols-outlined text-sm text-primary-fixed">check_circle</span>
          <span>{globalToast}</span>
        </div>
      )}

      {/* Global Navigation Header */}
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
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Auth Screens */}
        {activeScreen === 'auth-register' && (
          <RegisterView
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeScreen === 'auth-login' && (
          <LoginView
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeScreen === 'onboarding' && (
          <OnboardingView
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Feature Screens */}
        {activeScreen === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            mealSlots={mealSlots}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onQuickAddMeal={(slotId) => {
              setQuickAddSlot(slotId);
              setIsQuickAddOpen(true);
            }}
            onQuickLogWater={handleQuickLogWater}
          />
        )}

        {activeScreen === 'nutrition-and-calorie-tracking' && (
          <NutritionLogView
            mealSlots={mealSlots}
            userProfile={userProfile}
            onAddFoodItem={handleAddFoodItem}
            onRemoveFoodItem={handleRemoveFoodItem}
            onOpenQuickAdd={(slotId) => {
              setQuickAddSlot(slotId);
              setIsQuickAddOpen(true);
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
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        onLoggedOut={() => {
          showToast('Signed out successfully.');
          setActiveScreen('dashboard');
        }}
      />

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
          handleAddFoodItem(slotId as any, item);
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
            {!isAuthenticated && (
              <button onClick={() => setActiveScreen('auth-login')} className="font-semibold text-primary hover:underline">
                Sign In / Register
              </button>
            )}
          </div>

          <div className="text-[11px] text-outline">
            Standards: ICMR-NIN 2024 Dietary Guidelines
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
