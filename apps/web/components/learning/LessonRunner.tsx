import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Play, RotateCcw, ArrowRight, Lightbulb, Star } from 'lucide-react';
import { StepSpec } from '../../types/lesson';
import { CanvasEngine, Point, Path, Constraints, playGhost } from '../../features/learn/canvas/CanvasEngine';
import { 
  evaluateStrokePath, 
  evaluateAreaFill, 
  evaluateDotToDot, 
  evaluateLayerOrder,
  StrokeEvaluation,
  AreaFillEvaluation 
} from '../../features/learn/canvas/evaluation';
import { ToolPalette, Tool } from './ToolPalette';
import { trackStepAttempted, calculateStrokeAggregates } from '../../lib/analytics/learningEvents';

type LearningPhase = 'teach' | 'try' | 'check' | 'reflect';

export interface LessonRunnerProps {
  step: StepSpec;
  onStepComplete: (success: boolean, stars: number) => void;
  onSkip?: () => void;
  canSkip?: boolean;
  className?: string;
}

interface HintState {
  currentTier: 0 | 1 | 2 | 3;
  failCount: number;
}

interface EvaluationResult {
  pass: boolean;
  score: number;
  feedback: string;
  stars: number;
}

export const LessonRunner: React.FC<LessonRunnerProps> = ({
  step,
  onStepComplete,
  onSkip,
  canSkip = true,
  className = ''
}) => {
  const [phase, setPhase] = useState<LearningPhase>('teach');
  const [selectedTool, setSelectedTool] = useState<Tool>({
    id: 'pencil',
    name: 'Pencil',
    icon: <></>,
    color: '#000000',
    size: 2
  });
  const [userStrokes, setUserStrokes] = useState<Point[][]>([]);
  const [userTaps, setUserTaps] = useState<Point[]>([]);
  const [layerOrder, setLayerOrder] = useState<string[]>([]);
  const [hintState, setHintState] = useState<HintState>({ currentTier: 0, failCount: 0 });
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isPlayingGhost, setIsPlayingGhost] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const constraints = new Constraints(step);

  // Reset state when step changes
  useEffect(() => {
    setPhase('teach');
    setUserStrokes([]);
    setUserTaps([]);
    setLayerOrder([]);
    setHintState({ currentTier: 0, failCount: 0 });
    setEvaluation(null);
  }, [step.id]);

  const handleStrokeComplete = useCallback((stroke: Point[]) => {
    setUserStrokes(prev => [...prev, stroke]);
  }, []);

  const handleTap = useCallback((point: Point) => {
    if (step.type === 'dot-to-dot') {
      setUserTaps(prev => [...prev, point]);
    }
  }, [step.type]);

  const playGhostDemo = useCallback(async () => {
    if (!canvasRef.current || !step.guide?.path) return;
    
    setIsPlayingGhost(true);
    try {
      await playGhost(canvasRef.current, step.guide.path, {
        speed: 0.8,
        color: '#666',
        width: 3
      });
    } finally {
      setIsPlayingGhost(false);
    }
  }, [step.guide]);

  const evaluateStep = useCallback((): EvaluationResult => {
    let result: EvaluationResult = {
      pass: false,
      score: 0,
      feedback: 'No evaluation performed',
      stars: 0
    };

    switch (step.type) {
      case 'stroke-path':
        if (userStrokes.length > 0 && step.guide?.path) {
          const strokeEval = evaluateStrokePath(
            userStrokes[userStrokes.length - 1], 
            { points: step.guide.path },
            0.65
          );
          result = {
            pass: strokeEval.pass,
            score: strokeEval.score,
            feedback: strokeEval.pass 
              ? 'Great stroke! Well done.' 
              : `Try to follow the guide more closely. Score: ${Math.round(strokeEval.score * 100)}%`,
            stars: strokeEval.pass ? (strokeEval.score > 0.85 ? 3 : strokeEval.score > 0.75 ? 2 : 1) : 0
          };
        }
        break;

      case 'area-fill':
        if (canvasRef.current && step.guide?.mask && step.guide?.targetColor) {
          const fillEval = evaluateAreaFill(
            canvasRef.current,
            step.guide.mask,
            step.guide.targetColor,
            { h: 10, s: 8, l: 8 },
            0.85
          );
          result = {
            pass: fillEval.pass,
            score: fillEval.coverage,
            feedback: fillEval.pass 
              ? 'Perfect fill! Nice work.' 
              : `${fillEval.colorOk ? 'Good color choice' : 'Wrong color'}, coverage: ${Math.round(fillEval.coverage * 100)}%`,
            stars: fillEval.pass ? (fillEval.coverage > 0.95 ? 3 : fillEval.coverage > 0.9 ? 2 : 1) : 0
          };
        }
        break;

      case 'dot-to-dot':
        if (step.guide?.targets) {
          const dotEval = evaluateDotToDot(userTaps, step.guide.targets, 12);
          result = {
            pass: dotEval,
            score: dotEval ? 1 : userTaps.length / step.guide.targets.length,
            feedback: dotEval 
              ? 'Perfect sequence! All dots connected correctly.' 
              : `Connect the dots in order. Progress: ${userTaps.length}/${step.guide.targets.length}`,
            stars: dotEval ? 3 : 0
          };
        }
        break;

      case 'layer-order':
        if (step.guide?.targetOrder) {
          const orderEval = evaluateLayerOrder(layerOrder, step.guide.targetOrder);
          result = {
            pass: orderEval,
            score: orderEval ? 1 : 0,
            feedback: orderEval 
              ? 'Correct layer order! Well organized.' 
              : 'Layer order is incorrect. Try again.',
            stars: orderEval ? 3 : 0
          };
        }
        break;
    }

    return result;
  }, [step, userStrokes, userTaps, layerOrder]);

  const handleCheck = useCallback(() => {
    const startTime = Date.now();
    const result = evaluateStep();
    const attemptDuration = Date.now() - startTime;
    
    setEvaluation(result);
    setPhase('reflect');

    // Track step attempt event
    const strokeAggregates = calculateStrokeAggregates(userStrokes.map(stroke => ({ points: stroke })));
    
    trackStepAttempted({
      step_id: step.id,
      step_type: step.type,
      result: result.pass ? 'pass' : 'fail',
      score: result.score,
      stars_earned: result.stars,
      attempt_duration_ms: attemptDuration,
      hint_tier_reached: hintState.currentTier > 0 ? hintState.currentTier : undefined,
      total_attempts: hintState.failCount + 1,
      ...strokeAggregates
    });

    if (!result.pass) {
      setHintState(prev => ({
        currentTier: Math.min(3, prev.currentTier + 1) as 0 | 1 | 2 | 3,
        failCount: prev.failCount + 1
      }));
    }
  }, [evaluateStep, step.id, step.type, userStrokes, hintState]);

  const handleRetry = useCallback(() => {
    setUserStrokes([]);
    setUserTaps([]);
    setLayerOrder([]);
    setEvaluation(null);
    setPhase('try');
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (evaluation) {
      onStepComplete(evaluation.pass, evaluation.stars);
    }
  }, [evaluation, onStepComplete]);

  const handleAutoAdvance = useCallback(() => {
    onStepComplete(false, 0);
  }, [onStepComplete]);

  const getCurrentHint = () => {
    if (!step.hints || hintState.currentTier === 0) return null;
    return step.hints.find(hint => hint.tier === hintState.currentTier);
  };

  const renderTeachPhase = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          {step.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {step.guide?.tip || 'Follow the guide to complete this step.'}
        </p>
        
        {step.guide?.path && (
          <Button
            variant="outline"
            size="sm"
            onClick={playGhostDemo}
            disabled={isPlayingGhost}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isPlayingGhost ? 'Playing...' : 'Show Demo'}
          </Button>
        )}
        
        <Button onClick={() => setPhase('try')} className="w-full">
          <ArrowRight className="w-4 h-4 mr-2" />
          Start Practice
        </Button>
      </CardContent>
    </Card>
  );

  const renderTryPhase = () => (
    <div className="flex gap-4 h-full">
      <div className="flex-1">
        <div className="relative border rounded-lg overflow-hidden bg-white">
          <CanvasEngine
            ref={canvasRef}
            width={800}
            height={600}
            onStrokeComplete={handleStrokeComplete}
            onTap={handleTap}
            constraints={step.constraints}
            className="w-full h-full"
          />
          
          {/* Guide Overlays */}
          {step.guide?.overlay && (
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <img 
                src={step.guide.overlay} 
                alt="Guide overlay"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Button variant="outline" onClick={() => setPhase('teach')}>
            Back to Guide
          </Button>
          
          <Button onClick={handleCheck} disabled={
            (step.type === 'stroke-path' && userStrokes.length === 0) ||
            (step.type === 'dot-to-dot' && userTaps.length === 0) ||
            (step.type === 'area-fill' && userStrokes.length === 0)
          }>
            Check My Work
          </Button>
        </div>
      </div>
      
      <ToolPalette
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        constraints={constraints}
        className="w-64"
      />
    </div>
  );

  const renderCheckPhase = () => (
    <div className="text-center space-y-4">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <div className="w-8 h-8 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Checking your work...</p>
      </div>
    </div>
  );

  const renderReflectPhase = () => {
    if (!evaluation) return null;
    
    const currentHint = getCurrentHint();
    const shouldAutoAdvance = hintState.failCount >= 3 && !evaluation.pass;
    
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${
            evaluation.pass ? 'text-green-600' : 'text-orange-600'
          }`}>
            {evaluation.pass ? (
              <>
                <div className="flex">
                  {Array.from({ length: evaluation.stars }, (_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                Success!
              </>
            ) : (
              'Try Again'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{evaluation.feedback}</p>
          
          {currentHint && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <Badge variant="secondary">Hint {currentHint.tier}</Badge>
              </div>
              <p className="text-sm text-blue-700">{currentHint.text}</p>
              {currentHint.action === 'play_demo' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playGhostDemo}
                  className="mt-2"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Demo
                </Button>
              )}
            </div>
          )}
          
          {shouldAutoAdvance && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-700 mb-2">
                You've tried 3 times. You can continue to the next step.
              </p>
              <Button
                variant="outline"
                onClick={handleAutoAdvance}
                className="w-full"
              >
                Continue (0 ⭐)
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            {!evaluation.pass && !shouldAutoAdvance && (
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            
            {evaluation.pass && (
              <Button onClick={handleContinue} className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue
              </Button>
            )}
            
            {canSkip && onSkip && (
              <Button variant="ghost" onClick={onSkip} className="flex-1">
                Skip
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`h-full ${className}`}>
      {phase === 'teach' && renderTeachPhase()}
      {phase === 'try' && renderTryPhase()}
      {phase === 'check' && renderCheckPhase()}
      {phase === 'reflect' && renderReflectPhase()}
    </div>
  );
};

export default LessonRunner;
