import React, { useState, useEffect } from 'react';
import { circuitMovements } from '../data/mockData';

interface WorkoutTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteWorkout: () => void;
}

export const WorkoutTimerModal: React.FC<WorkoutTimerModalProps> = ({
  isOpen,
  onClose,
  onCompleteWorkout,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isActive, setIsActive] = useState(false);

  const currentMovement = circuitMovements[currentIdx] || circuitMovements[0];

  useEffect(() => {
    let timer: any = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Transition between set or movement
      if (!isResting) {
        // Switch to rest
        setIsResting(true);
        setTimeLeft(45); // 45s rest
      } else {
        // Finished rest, next set or next movement
        setIsResting(false);
        if (currentSet < 3) {
          setCurrentSet((s) => s + 1);
          setTimeLeft(45);
        } else {
          // Finished sets for this movement
          if (currentIdx < circuitMovements.length - 1) {
            setCurrentIdx((idx) => idx + 1);
            setCurrentSet(1);
            setTimeLeft(45);
          } else {
            // All finished!
            setIsActive(false);
            onCompleteWorkout();
          }
        }
      }
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, isResting, currentSet, currentIdx, onCompleteWorkout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-outline-variant/30 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed">
              Guided Circuit Mode
            </span>
            <h3 className="text-lg font-extrabold text-on-surface mt-1">
              {isResting ? 'Recovery Interval' : currentMovement.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline text-lg"
          >
            ✕
          </button>
        </div>

        {/* Movement preview / Timer display */}
        <div className="text-center space-y-3 py-2">
          {!isResting ? (
            <div>
              <div className="w-full h-44 rounded-2xl overflow-hidden mb-3 border border-outline-variant/30">
                <img
                  src={currentMovement.imageUrl}
                  alt={currentMovement.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-on-surface-variant">
                <span>Movement {currentIdx + 1} of {circuitMovements.length}</span>
                <span>•</span>
                <span>Set {currentSet} of 3</span>
                <span>•</span>
                <span className="font-mono text-primary font-bold">{currentMovement.setsReps}</span>
              </div>
              <p className="text-xs text-on-surface mt-2 bg-surface-container-low p-2.5 rounded-xl text-left">
                <strong className="text-primary">Cue:</strong> {currentMovement.formCue}
              </p>
            </div>
          ) : (
            <div className="py-8 space-y-2 bg-surface-container-low rounded-2xl">
              <span className="material-symbols-outlined text-secondary text-4xl">snooze</span>
              <div className="text-sm font-extrabold text-on-surface">Rest & Deep Diaphragmatic Breath</div>
              <div className="text-xs text-on-surface-variant">
                Next up: {currentSet < 3 ? `Set ${currentSet + 1} of ${currentMovement.name}` : `Next Exercise`}
              </div>
            </div>
          )}

          {/* Large Countdown timer */}
          <div className="text-5xl sm:text-6xl font-extrabold font-mono text-on-surface py-2">
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-xs transition-colors flex items-center justify-center space-x-2 ${
              isActive ? 'bg-secondary hover:bg-secondary-container' : 'bg-primary hover:bg-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isActive ? 'pause' : 'play_arrow'}
            </span>
            <span>{isActive ? 'Pause Timer' : 'Start Interval'}</span>
          </button>

          <button
            onClick={() => {
              if (currentIdx < circuitMovements.length - 1) {
                setCurrentIdx(currentIdx + 1);
                setCurrentSet(1);
                setIsResting(false);
                setTimeLeft(45);
              } else {
                onCompleteWorkout();
              }
            }}
            className="px-4 py-3 rounded-xl text-sm font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface"
          >
            Skip Next
          </button>
        </div>
      </div>
    </div>
  );
};
