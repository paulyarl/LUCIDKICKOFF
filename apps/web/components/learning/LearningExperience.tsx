'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { DrawingCanvas } from '../canvas/DrawingCanvas';
import { PackQuiz } from './PackQuiz';
import { HintBubblesManager } from '../canvas/HintBubble';

interface LearningExperienceProps {
  packId: string;
  initialLines?: any[];
  width: number;
  height: number;
  backgroundImage?: string;
  objectives: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  questions: Array<{
    id: string;
    text: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    explanation?: string;
  }>;
  hints?: Array<{
    id: string;
    x: number;
    y: number;
    content: string;
    title?: string;
    type?: 'fact' | 'hint' | 'tip';
  }>;
  onArtworkSave?: (lines: any[], imageData: string) => void;
  onQuizComplete?: (score: number, packId: string) => void;
  className?: string;
}

export function LearningExperience({
  packId,
  initialLines = [],
  width,
  height,
  backgroundImage,
  objectives: initialObjectives,
  questions: initialQuestions,
  hints: initialHints = [],
  onArtworkSave,
  onQuizComplete,
  className,
}: LearningExperienceProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'quiz'>('draw');
  const [showHints, setShowHints] = useState(true);
  const [hints, setHints] = useState(initialHints);
  const [lines, setLines] = useState(initialLines);
  const [objectives, setObjectives] = useState(initialObjectives);
  const [quizStarted, setQuizStarted] = useState(false);

  // Handle saving artwork
  const handleArtworkSave = (savedLines: any[], imageData: string) => {
    setLines(savedLines);
    if (onArtworkSave) {
      onArtworkSave(savedLines, imageData);
    }
    
    // Mark relevant objectives as completed
    const updatedObjectives = [...objectives];
    const drawingObjectiveIndex = updatedObjectives.findIndex(
      obj => obj.text.toLowerCase().includes('draw') || 
             obj.text.toLowerCase().includes('color')
    );
    
    if (drawingObjectiveIndex !== -1) {
      updatedObjectives[drawingObjectiveIndex] = {
        ...updatedObjectives[drawingObjectiveIndex],
        completed: true,
      };
      setObjectives(updatedObjectives);
    }
  };

  // Handle quiz completion
  const handleQuizComplete = (score: number, quizPackId: string) => {
    if (onQuizComplete) {
      onQuizComplete(score, quizPackId);
    }
    
    // Mark quiz objectives as completed
    const updatedObjectives = objectives.map(obj => ({
      ...obj,
      completed: true,
    }));
    setObjectives(updatedObjectives);
  };

  // Update hint position when dragged
  const handleHintPositionChange = (id: string, position: { x: number; y: number }) => {
    setHints(prevHints =>
      prevHints.map(hint =>
        hint.id === id ? { ...hint, ...position } : hint
      )
    );
  };

  // Remove a hint
  const handleHintRemove = (id: string) => {
    setHints(prevHints => prevHints.filter(hint => hint.id !== id));
  };

  // Toggle hints visibility
  const toggleHints = () => {
    setShowHints(prev => !prev);
  };

  // Check if all drawing-related objectives are completed
  const allDrawingObjectivesCompleted = objectives.every(
    obj => 
      !obj.text.toLowerCase().includes('draw') && 
      !obj.text.toLowerCase().includes('color') || 
      obj.completed
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'draw' | 'quiz')}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-center justify-between border-b px-4">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="draw" 
              className="relative px-4 py-3 rounded-none data-[state=active]:shadow-none"
            >
              <Icons.palette className="mr-2 h-4 w-4" />
              Draw & Color
            </TabsTrigger>
            <TabsTrigger 
              value="quiz" 
              className="relative px-4 py-3 rounded-none data-[state=active]:shadow-none"
              disabled={!allDrawingObjectivesCompleted && !quizStarted}
              onClick={() => setQuizStarted(true)}
            >
              <Icons.helpCircle className="mr-2 h-4 w-4" />
              Quick Check
              {!allDrawingObjectivesCompleted && !quizStarted && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Complete drawing first)
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'draw' && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleHints}
                className="flex items-center gap-2"
              >
                {showHints ? (
                  <>
                    <Icons.eyeOff className="h-4 w-4" />
                    <span>Hide Hints</span>
                  </>
                ) : (
                  <>
                    <Icons.eye className="h-4 w-4" />
                    <span>Show Hints</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value="draw" className="flex-1 mt-0 relative">
          <DrawingCanvas
            width={width}
            height={height}
            initialLines={lines}
            backgroundImage={backgroundImage}
            onSave={handleArtworkSave}
            className="h-full"
          />
          
          {/* Hint bubbles */}
          {showHints && (
            <HintBubblesManager
              hints={hints}
              visible={showHints}
              onHintPositionChange={handleHintPositionChange}
              onHintRemove={handleHintRemove}
              className="absolute inset-0 pointer-events-none"
            />
          )}
        </TabsContent>
        
        <TabsContent value="quiz" className="flex-1 mt-0 p-4">
          <div className="max-w-4xl mx-auto h-full">
            <PackQuiz
              packId={packId}
              objectives={objectives}
              questions={initialQuestions}
              onComplete={handleQuizComplete}
              className="h-full"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to ensure className is properly typed
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
