import React from 'react';
import { ScreenId, UserProfile } from '../types';

interface NavigationProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  userProfile: UserProfile;
  onQuickLogWater: () => void;
  onOpenQuickScan: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeScreen,
  onNavigate,
  userProfile,
  onQuickLogWater,
  onOpenQuickScan,
}) => {
  const navItems: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'nutrition-and-calorie-tracking', label: 'Nutrition Log', icon: 'restaurant' },
    { id: 'personalized-diet-plan', label: 'Diet Plan', icon: 'event_note' },
    { id: 'exercise-recommendation', label: 'Exercises', icon: 'fitness_center' },
    { id: 'ai-food-scanner', label: 'AI Scanner', icon: 'document_scanner' },
    { id: 'bmi-and-body-health', label: 'BMI & Body Health', icon: 'monitor_weight' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <span className="material-symbols-outlined text-2xl">vital_signs</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-on-surface">NutriPulse</span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-sans">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant hidden sm:block">
                Metabolic Nutrition & Wellness OS
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[19px] ${
                      isActive ? 'text-primary' : 'text-outline'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Quick Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Hydration */}
            <button
              onClick={onQuickLogWater}
              title="Log 250ml Water"
              className="hidden lg:flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">water_drop</span>
              <span>+250ml</span>
            </button>

            {/* Quick Food Scanner CTA */}
            <button
              onClick={onOpenQuickScan}
              id="header-quick-scan-btn"
              className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span className="hidden sm:inline">Plate Scanner</span>
              <span className="sm:hidden">Scan</span>
            </button>

            {/* Profile Avatar Pill */}
            <button
              onClick={() => onNavigate('bmi-and-body-health')}
              title="View Profile & BMI"
              className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-xs">
                {userProfile.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-on-surface hidden lg:inline max-w-[90px] truncate">
                {userProfile.name.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-outline-variant/20 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center min-w-[58px] py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  isActive ? 'text-primary font-bold bg-primary-fixed/40' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="truncate max-w-[65px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
