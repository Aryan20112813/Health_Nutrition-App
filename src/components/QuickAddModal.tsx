import React, { useState } from 'react';
import { FoodItem } from '../types';
import { searchDatabaseStaples } from '../data/mockData';

interface QuickAddModalProps {
  isOpen: boolean;
  defaultSlotId?: string;
  onClose: () => void;
  onAddFood: (slotId: 'breakfast' | 'lunch' | 'snack' | 'dinner', item: FoodItem) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  defaultSlotId = 'lunch',
  onClose,
  onAddFood,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>(
    (defaultSlotId as any) || 'lunch'
  );
  const [selectedFood, setSelectedFood] = useState(searchDatabaseStaples[0]);
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');

  if (!isOpen) return null;

  const handleAddPreset = () => {
    const item: FoodItem = {
      id: 'quick-' + Date.now(),
      name: selectedFood.name,
      category: selectedFood.category,
      portion: `${quantity > 1 ? quantity + '× ' : ''}${selectedFood.defaultPortion}`,
      calories: Math.round(selectedFood.calories * quantity),
      protein: Math.round(selectedFood.protein * quantity * 10) / 10,
      carbs: Math.round(selectedFood.carbs * quantity * 10) / 10,
      fats: Math.round(selectedFood.fats * quantity * 10) / 10,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onAddFood(selectedSlot, item);
    onClose();
  };

  const handleAddCustom = () => {
    if (!customName || !customCalories) return;
    const cals = parseInt(customCalories) || 100;
    const item: FoodItem = {
      id: 'quick-custom-' + Date.now(),
      name: customName,
      category: 'Custom Entry',
      portion: '1 Serving',
      calories: cals,
      protein: Math.round(cals * 0.05),
      carbs: Math.round(cals * 0.12),
      fats: Math.round(cals * 0.03),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onAddFood(selectedSlot, item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 border border-outline-variant/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <h3 className="text-lg font-extrabold text-on-surface">Quick Food Entry</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline text-lg"
          >
            ✕
          </button>
        </div>

        {/* Slot selector */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">
            Target Meal Slot:
          </label>
          <div className="grid grid-cols-4 gap-1 text-xs">
            {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                  selectedSlot === slot ? 'bg-primary text-white font-bold' : 'bg-surface-container-low text-on-surface'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">
            Choose Indian Staple:
          </label>
          <select
            value={selectedFood.name}
            onChange={(e) => {
              const found = searchDatabaseStaples.find((f) => f.name === e.target.value);
              if (found) setSelectedFood(found);
            }}
            className="w-full py-2 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium text-on-surface"
          >
            {searchDatabaseStaples.map((f, i) => (
              <option key={i} value={f.name}>
                {f.name} ({f.calories} kcal • {f.defaultPortion})
              </option>
            ))}
          </select>
        </div>

        {/* Multiplier */}
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-on-surface-variant">Servings count:</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
              className="w-7 h-7 rounded bg-surface-container flex items-center justify-center font-bold"
            >
              -
            </button>
            <span className="font-mono font-bold">{quantity}×</span>
            <button
              onClick={() => setQuantity(quantity + 0.5)}
              className="w-7 h-7 rounded bg-surface-container flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddPreset}
          className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary-container shadow-xs shadow-primary/25"
        >
          Add {selectedFood.name} ({Math.round(selectedFood.calories * quantity)} kcal)
        </button>

        {/* Divider for custom item */}
        <div className="pt-3 border-t border-outline-variant/20">
          <div className="text-xs font-bold text-on-surface-variant mb-2">Or Quick Custom Calories:</div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Item name (e.g. Masala Chai)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs"
            />
            <input
              type="number"
              placeholder="Calories"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              className="w-24 py-1.5 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs"
            />
          </div>
          <button
            onClick={handleAddCustom}
            disabled={!customName || !customCalories}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40"
          >
            Add Custom Entry
          </button>
        </div>
      </div>
    </div>
  );
};
