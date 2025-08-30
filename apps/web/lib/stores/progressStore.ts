import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Core types
export type ParentType = 'lesson' | 'tutorial';

export interface Progress {
  parentType: ParentType;
  parentId: string;
  stars: number;
  lastStepId?: string;
  updatedAt: number;
}

export interface Attempt {
  stepId: string;
  result: 'pass' | 'fail' | 'skipped';
  score?: number;
  ts: number;
}

// Store state interface
interface ProgressState {
  progress: Record<string, Progress>; // key: `${parentType}:${parentId}`
  attempts: Record<string, Attempt[]>; // key: stepId
}

// Store actions interface
interface ProgressActions {
  // Progress management
  updateProgress: (progress: Progress) => void;
  getProgress: (parentType: ParentType, parentId: string) => Progress | null;
  getAllProgress: () => Progress[];
  
  // Attempt management
  addAttempt: (attempt: Attempt) => void;
  getAttempts: (stepId: string) => Attempt[];
  getLatestAttempt: (stepId: string) => Attempt | null;
  
  // Statistics
  getTotalStars: () => number;
  getCompletedLessons: () => number;
  getCompletedTutorials: () => number;
  
  // Utility
  clearProgress: () => void;
  exportData: () => { progress: Progress[]; attempts: Record<string, Attempt[]> };
  importData: (data: { progress: Progress[]; attempts: Record<string, Attempt[]> }) => void;
}

type ProgressStore = ProgressState & ProgressActions;

// Helper functions
const createProgressKey = (parentType: ParentType, parentId: string): string => 
  `${parentType}:${parentId}`;

const parseProgressKey = (key: string): { parentType: ParentType; parentId: string } => {
  const [parentType, parentId] = key.split(':');
  return { parentType: parentType as ParentType, parentId };
};

// Zustand store with localStorage persistence
export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      // Initial state
      progress: {},
      attempts: {},

      // Progress management
      updateProgress: (newProgress: Progress) => {
        const key = createProgressKey(newProgress.parentType, newProgress.parentId);
        set((state) => ({
          progress: {
            ...state.progress,
            [key]: {
              ...newProgress,
              updatedAt: Date.now()
            }
          }
        }));
      },

      getProgress: (parentType: ParentType, parentId: string): Progress | null => {
        const key = createProgressKey(parentType, parentId);
        return get().progress[key] || null;
      },

      getAllProgress: (): Progress[] => {
        return Object.values(get().progress);
      },

      // Attempt management
      addAttempt: (attempt: Attempt) => {
        set((state) => ({
          attempts: {
            ...state.attempts,
            [attempt.stepId]: [
              ...(state.attempts[attempt.stepId] || []),
              {
                ...attempt,
                ts: Date.now()
              }
            ]
          }
        }));
      },

      getAttempts: (stepId: string): Attempt[] => {
        return get().attempts[stepId] || [];
      },

      getLatestAttempt: (stepId: string): Attempt | null => {
        const attempts = get().attempts[stepId] || [];
        return attempts.length > 0 ? attempts[attempts.length - 1] : null;
      },

      // Statistics
      getTotalStars: (): number => {
        return Object.values(get().progress).reduce((total, progress) => total + progress.stars, 0);
      },

      getCompletedLessons: (): number => {
        return Object.values(get().progress).filter(p => p.parentType === 'lesson').length;
      },

      getCompletedTutorials: (): number => {
        return Object.values(get().progress).filter(p => p.parentType === 'tutorial').length;
      },

      // Utility
      clearProgress: () => {
        set({ progress: {}, attempts: {} });
      },

      exportData: () => {
        const state = get();
        return {
          progress: Object.values(state.progress),
          attempts: state.attempts
        };
      },

      importData: (data: { progress: Progress[]; attempts: Record<string, Attempt[]> }) => {
        const progressRecord: Record<string, Progress> = {};
        data.progress.forEach(progress => {
          const key = createProgressKey(progress.parentType, progress.parentId);
          progressRecord[key] = progress;
        });
        
        set({
          progress: progressRecord,
          attempts: data.attempts
        });
      }
    }),
    {
      name: 'lc_progress_v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle future migrations here
        return persistedState;
      }
    }
  )
);

// Convenience hooks for common operations
export const useProgressActions = () => {
  const {
    updateProgress,
    addAttempt,
    clearProgress,
    exportData,
    importData
  } = useProgressStore();
  
  return {
    updateProgress,
    addAttempt,
    clearProgress,
    exportData,
    importData
  };
};

export const useProgressQueries = () => {
  const {
    getProgress,
    getAllProgress,
    getAttempts,
    getLatestAttempt,
    getTotalStars,
    getCompletedLessons,
    getCompletedTutorials
  } = useProgressStore();
  
  return {
    getProgress,
    getAllProgress,
    getAttempts,
    getLatestAttempt,
    getTotalStars,
    getCompletedLessons,
    getCompletedTutorials
  };
};

// Helper functions for common patterns
export const progressHelpers = {
  // Check if a lesson/tutorial is completed
  isCompleted: (parentType: ParentType, parentId: string): boolean => {
    const progress = useProgressStore.getState().getProgress(parentType, parentId);
    return progress !== null && progress.stars > 0;
  },

  // Get completion percentage for a parent
  getCompletionRate: (parentType: ParentType, parentId: string, totalSteps: number): number => {
    const attempts = useProgressStore.getState().attempts;
    const completedSteps = Object.keys(attempts).filter(stepId => {
      const stepAttempts = attempts[stepId];
      return stepAttempts.some(attempt => attempt.result === 'pass');
    }).length;
    
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  },

  // Get average score for a step
  getAverageScore: (stepId: string): number => {
    const attempts = useProgressStore.getState().getAttempts(stepId);
    const scoresAttempts = attempts.filter(a => a.score !== undefined);
    
    if (scoresAttempts.length === 0) return 0;
    
    const totalScore = scoresAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    return totalScore / scoresAttempts.length;
  },

  // Get success rate for a step
  getSuccessRate: (stepId: string): number => {
    const attempts = useProgressStore.getState().getAttempts(stepId);
    if (attempts.length === 0) return 0;
    
    const successfulAttempts = attempts.filter(a => a.result === 'pass').length;
    return (successfulAttempts / attempts.length) * 100;
  }
};
