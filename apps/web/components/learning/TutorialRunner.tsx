import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { Lesson, Checkpoint, StepSpec } from '../../types/lesson';
import { LessonRunner } from './LessonRunner';
import { trackLessonStarted, trackCheckpointPassed, trackLessonCompleted, trackTutorialCompleted } from '../../lib/analytics/learningEvents';

export interface TutorialRunnerProps {
  lesson: Lesson;
  onLessonComplete: (totalStars: number) => void;
  onExit?: () => void;
  className?: string;
}

interface StepProgress {
  stepId: string;
  completed: boolean;
  stars: number;
  attempts: number;
}

interface CheckpointProgress {
  checkpointId: string;
  completed: boolean;
  stepsProgress: StepProgress[];
}

export const TutorialRunner: React.FC<TutorialRunnerProps> = ({
  lesson,
  onLessonComplete,
  onExit,
  className = ''
}) => {
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checkpointsProgress, setCheckpointsProgress] = useState<CheckpointProgress[]>([]);
  const [totalStars, setTotalStars] = useState(0);

  // Initialize progress tracking
  useEffect(() => {
    const initialProgress = lesson.checkpoints.map(checkpoint => ({
      checkpointId: checkpoint.id,
      completed: false,
      stepsProgress: checkpoint.stepIds.map(stepId => ({
        stepId,
        completed: false,
        stars: 0,
        attempts: 0
      }))
    }));
    setCheckpointsProgress(initialProgress);
  }, [lesson]);

  const getCurrentCheckpoint = (): Checkpoint | null => {
    return lesson.checkpoints[currentCheckpointIndex] || null;
  };

  const getCurrentStep = (): StepSpec | null => {
    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint) return null;
    
    const stepId = checkpoint.stepIds[currentStepIndex];
    // In a real implementation, you'd fetch the step by ID
    // For now, we'll create a mock step
    return {
      id: stepId,
      title: `Step ${currentStepIndex + 1}`,
      type: 'stroke-path',
      constraints: {
        tool: 'pencil',
        size_range: [1, 5],
        color: '#000000'
      },
      guide: {
        tip: 'Follow the guide carefully to complete this step.',
        path: [] // Would be populated with actual guide data
      },
      hints: [
        { tier: 1, text: 'Take your time and follow the guide closely.' },
        { tier: 2, text: 'Try using smoother, more controlled movements.' },
        { tier: 3, text: 'Focus on staying within the guide boundaries.' }
      ],
      on_success: {
        award: { xp: 10, stars: 3 }
      }
    };
  };

  const updateStepProgress = useCallback((stepId: string, completed: boolean, stars: number) => {
    setCheckpointsProgress(prev => prev.map(checkpoint => ({
      ...checkpoint,
      stepsProgress: checkpoint.stepsProgress.map(step => 
        step.stepId === stepId 
          ? { ...step, completed, stars, attempts: step.attempts + 1 }
          : step
      )
    })));

    if (completed) {
      setTotalStars(prev => prev + stars);
    }
  }, []);

  const handleStepComplete = useCallback((success: boolean, stars: number) => {
    const currentStep = getCurrentStep();
    if (!currentStep) return;

    updateStepProgress(currentStep.id, success, stars);

    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint) return;

    // Move to next step
    if (currentStepIndex < checkpoint.stepIds.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Checkpoint completed
      setCheckpointsProgress(prev => prev.map((cp, index) => 
        index === currentCheckpointIndex 
          ? { ...cp, completed: true }
          : cp
      ));

      // Track checkpoint completion
      const checkpointStars = checkpointsProgress[currentCheckpointIndex]?.stepsProgress
        .reduce((sum, step) => sum + step.stars, 0) || 0;
      const totalAttempts = checkpointsProgress[currentCheckpointIndex]?.stepsProgress
        .reduce((sum, step) => sum + step.attempts, 0) || 0;
      
      trackCheckpointPassed({
        checkpoint_id: checkpoint.id,
        tutorial_id: lesson.id,
        completion_percentage: ((currentCheckpointIndex + 1) / lesson.checkpoints.length) * 100,
        stars_earned: checkpointStars,
        total_attempts: totalAttempts
      });

      // Move to next checkpoint or complete lesson
      if (currentCheckpointIndex < lesson.checkpoints.length - 1) {
        setCurrentCheckpointIndex(prev => prev + 1);
        setCurrentStepIndex(0);
      } else {
        // Lesson completed
        const finalTotalStars = totalStars + stars;
        const allAttempts = checkpointsProgress.reduce((sum, cp) => 
          sum + cp.stepsProgress.reduce((stepSum, step) => stepSum + step.attempts, 0), 0);
        
        // Track lesson completion
        if (lesson.type === 'lesson') {
          trackLessonCompleted({
            lesson_id: lesson.id,
            completion_percentage: 100,
            stars_earned: finalTotalStars,
            total_attempts: allAttempts
          });
        } else if (lesson.type === 'tutorial') {
          trackTutorialCompleted({
            tutorial_id: lesson.id,
            completion_percentage: 100,
            stars_earned: finalTotalStars,
            total_attempts: allAttempts
          });
        }
        
        onLessonComplete(finalTotalStars);
      }
    }
  }, [currentCheckpointIndex, currentStepIndex, getCurrentCheckpoint, getCurrentStep, updateStepProgress, lesson.checkpoints.length, lesson.id, lesson.type, onLessonComplete, totalStars, checkpointsProgress]);

  const handleSkipStep = useCallback(() => {
    const checkpoint = getCurrentCheckpoint();
    const isLastCheckpoint = currentCheckpointIndex === lesson.checkpoints.length - 1;
    const isLastStep = checkpoint && currentStepIndex === checkpoint.stepIds.length - 1;
    
    // Cannot skip final step of final checkpoint
    if (isLastCheckpoint && isLastStep) {
      return;
    }

    handleStepComplete(false, 0);
  }, [currentCheckpointIndex, currentStepIndex, lesson.checkpoints.length, getCurrentCheckpoint, handleStepComplete]);

  const getProgressPercentage = (): number => {
    const totalSteps = lesson.checkpoints.reduce((sum, cp) => sum + cp.stepIds.length, 0);
    const completedSteps = checkpointsProgress.reduce((sum, cp) => 
      sum + cp.stepsProgress.filter(step => step.completed).length, 0
    );
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  };

  const getCurrentStepNumber = (): number => {
    let stepNumber = 0;
    for (let i = 0; i < currentCheckpointIndex; i++) {
      stepNumber += lesson.checkpoints[i].stepIds.length;
    }
    return stepNumber + currentStepIndex + 1;
  };

  const getTotalSteps = (): number => {
    return lesson.checkpoints.reduce((sum, cp) => sum + cp.stepIds.length, 0);
  };

  const renderCheckpointOverview = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{lesson.title}</span>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>{totalStars}</span>
          </div>
        </CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{getCurrentStepNumber()} of {getTotalSteps()}</span>
          </div>
          <Progress value={getProgressPercentage()} className="w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lesson.checkpoints.map((checkpoint, index) => {
            const progress = checkpointsProgress[index];
            const isCurrent = index === currentCheckpointIndex;
            const isCompleted = progress?.completed || false;
            const completedSteps = progress?.stepsProgress.filter(s => s.completed).length || 0;
            
            return (
              <div
                key={checkpoint.id}
                className={`p-3 rounded-lg border ${
                  isCurrent ? 'border-blue-500 bg-blue-50' : 
                  isCompleted ? 'border-green-500 bg-green-50' : 
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isCurrent ? 'text-blue-500' : 'text-gray-400'}`} />
                  )}
                  <span className="font-medium text-sm">{checkpoint.title}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {completedSteps} of {checkpoint.stepIds.length} steps
                </div>
                {progress && (
                  <div className="mt-2">
                    <Progress 
                      value={(completedSteps / checkpoint.stepIds.length) * 100} 
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    const currentStep = getCurrentStep();
    const checkpoint = getCurrentCheckpoint();
    
    if (!currentStep || !checkpoint) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <p>No more steps available.</p>
            <Button onClick={() => onLessonComplete(totalStars)} className="mt-4">
              Complete Lesson
            </Button>
          </CardContent>
        </Card>
      );
    }

    const isLastCheckpoint = currentCheckpointIndex === lesson.checkpoints.length - 1;
    const isLastStep = currentStepIndex === checkpoint.stepIds.length - 1;
    const canSkip = !(isLastCheckpoint && isLastStep);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{checkpoint.title}</h2>
            <p className="text-sm text-gray-600">
              Step {currentStepIndex + 1} of {checkpoint.stepIds.length}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {isLastCheckpoint && isLastStep && (
              <Badge variant="destructive">Final Step</Badge>
            )}
            <Badge variant="outline">
              {lesson.skill_tag}
            </Badge>
          </div>
        </div>

        <LessonRunner
          step={currentStep}
          onStepComplete={handleStepComplete}
          onSkip={canSkip ? handleSkipStep : undefined}
          canSkip={canSkip}
        />
      </div>
    );
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onExit}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit Tutorial
        </Button>
        
        <div className="text-sm text-gray-600">
          Estimated time: {lesson.est_minutes} minutes
        </div>
      </div>

      {renderCheckpointOverview()}
      {renderCurrentStep()}
    </div>
  );
};

export default TutorialRunner;
