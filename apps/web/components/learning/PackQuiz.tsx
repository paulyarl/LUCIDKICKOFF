'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type Objective = {
  id: string;
  text: string;
  completed: boolean;
};

type Question = {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  userAnswer?: string;
};

interface PackQuizProps {
  packId: string;
  objectives: Objective[];
  questions: Question[];
  onComplete?: (score: number, packId: string) => void;
  className?: string;
}

export function PackQuiz({
  packId,
  objectives: initialObjectives,
  questions: initialQuestions,
  onComplete,
  className,
}: PackQuizProps) {
  const [activeTab, setActiveTab] = useState<'objectives' | 'quiz'>('objectives');
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Calculate progress
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.userAnswer).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  // Toggle objective completion
  const toggleObjective = (id: string) => {
    setObjectives(prev =>
      prev.map(obj =>
        obj.id === id ? { ...obj, completed: !obj.completed } : obj
      )
    );
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, userAnswer: optionId } : q
      )
    );

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        calculateScore();
        setQuizCompleted(true);
      }
    }, 800);
  };

  // Calculate final score
  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach(question => {
      const selectedOption = question.options.find(opt => opt.id === question.userAnswer);
      if (selectedOption?.isCorrect) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    setScore(finalScore);
    
    // Emit completion event
    if (onComplete) {
      onComplete(finalScore, packId);
    }
    
    // Track in analytics
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('quiz_completed', {
        pack_id: packId,
        score: finalScore,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
      });
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuestions(initialQuestions);
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    setShowResults(false);
    setScore(0);
  };

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allObjectivesCompleted = objectives.every(obj => obj.completed);

  return (
    <Card className={cn('w-full max-w-3xl mx-auto', className)}>
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle>
            {activeTab === 'objectives' ? 'Learning Objectives' : 'Quick Check'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={activeTab === 'objectives' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('objectives')}
            >
              Objectives
            </Button>
            <Button
              variant={activeTab === 'quiz' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('quiz')}
              disabled={!allObjectivesCompleted}
              title={!allObjectivesCompleted ? 'Complete all objectives first' : ''}
            >
              Quick Check
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {activeTab === 'objectives' ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Review these learning objectives before starting the quiz. Check each box as you complete them.
            </p>
            
            <div className="space-y-3">
              {objectives.map((objective) => (
                <div 
                  key={objective.id} 
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`objective-${objective.id}`}
                    checked={objective.completed}
                    onCheckedChange={() => toggleObjective(objective.id)}
                    className="mt-1"
                  />
                  <label 
                    htmlFor={`objective-${objective.id}`}
                    className={cn(
                      'text-sm leading-relaxed',
                      objective.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {objective.text}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button 
                onClick={() => setActiveTab('quiz')}
                disabled={!allObjectivesCompleted}
              >
                Start Quick Check
                <Icons.arrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!quizCompleted ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <h3 className="text-lg font-medium">{currentQuestion.text}</h3>
                
                <div className="space-y-3 mt-6">
                  {currentQuestion.options.map((option) => {
                    const isSelected = currentQuestion.userAnswer === option.id;
                    const isCorrect = option.isCorrect;
                    const showFeedback = isSelected && showResults;
                    
                    return (
                      <Button
                        key={option.id}
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left h-auto py-3 px-4',
                          'transition-all duration-200',
                          isSelected 
                            ? 'border-primary bg-primary/5 font-medium' 
                            : 'hover:bg-accent/50',
                          showFeedback && (
                            isCorrect 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          )
                        )}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                        disabled={!!currentQuestion.userAnswer}
                      >
                        <div className="flex items-center w-full">
                          <div className={cn(
                            'flex items-center justify-center w-6 h-6 rounded-full mr-3 shrink-0',
                            'border-2',
                            isSelected 
                              ? 'border-primary bg-primary text-primary-foreground' 
                              : 'border-border',
                            showFeedback && (
                              isCorrect 
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-red-500 bg-red-500 text-white'
                            )
                          )}>
                            {showFeedback ? (
                              isCorrect ? (
                                <Icons.check className="h-4 w-4" />
                              ) : (
                                <Icons.x className="h-4 w-4" />
                              )
                            ) : (
                              <span className="text-xs">
                                {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                              </span>
                            )}
                          </div>
                          <span>{option.text}</span>
                          
                          {showFeedback && isSelected && (
                            <span className="ml-auto text-sm font-medium">
                              {isCorrect ? 'Correct!' : 'Incorrect'}
                            </span>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
                
                {currentQuestion.userAnswer && currentQuestion.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start">
                      <Icons.lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(prev => prev - 1);
                      } else {
                        setActiveTab('objectives');
                      }
                    }}
                  >
                    <Icons.chevronLeft className="mr-2 h-4 w-4" />
                    {currentQuestionIndex === 0 ? 'Back to Objectives' : 'Previous'}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (isLastQuestion) {
                        calculateScore();
                        setQuizCompleted(true);
                      } else {
                        setCurrentQuestionIndex(prev => prev + 1);
                      }
                    }}
                    disabled={!currentQuestion.userAnswer}
                  >
                    {isLastQuestion ? 'Finish Quiz' : 'Next'}
                    <Icons.chevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {score}%
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-2">
                  {score >= 70 ? 'Great Job!' : 'Good Effort!'}
                </h3>
                
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {score >= 70
                    ? `You've successfully completed the quiz with a score of ${score}%. Keep up the great work!`
                    : `You scored ${score}% on this quiz. Review the material and try again to improve your score.`}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Math.round((score / 100) * totalQuestions)}/{totalQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Math.round(((100 - score) / 100) * totalQuestions)}/{totalQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground">Incorrect</div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {score >= 70 ? 'Passed' : 'Needs Work'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {score >= 70 ? '🎉 Well done!' : 'Keep practicing!'}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button onClick={resetQuiz} variant="outline">
                    <Icons.refreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  
                  <Button>
                    <Icons.award className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example usage:
/*
<PackQuiz
  packId="ocean-life"
  objectives={[
    { id: '1', text: 'Identify different ocean zones and their characteristics', completed: false },
    { id: '2', text: 'Understand the importance of coral reefs to marine ecosystems', completed: false },
    { id: '3', text: 'Learn about common marine species and their habitats', completed: false },
  ]}
  questions={[
    {
      id: 'q1',
      text: 'Which ocean zone receives the most sunlight?',
      explanation: 'The sunlit zone (or euphotic zone) receives the most sunlight and is where most marine life is found.',
      options: [
        { id: 'a', text: 'Sunlit Zone', isCorrect: true },
        { id: 'b', text: 'Twilight Zone', isCorrect: false },
        { id: 'c', text: 'Midnight Zone', isCorrect: false },
        { id: 'd', text: 'Abyssal Zone', isCorrect: false },
      ],
    },
    // Add more questions...
  ]}
  onComplete={(score, packId) => {
    console.log(`Quiz completed for pack ${packId} with score ${score}%`);
  }}
/>
*/
