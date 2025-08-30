'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { ArrowLeft, ArrowRight, Save, Eye, Download } from 'lucide-react';
import { StepSpec, StepType } from '../../types/lesson';
import { StepTypeSelector } from './wizard/StepTypeSelector';
import { GuideAssetEditor } from './wizard/GuideAssetEditor';
import { ConstraintsEditor } from './wizard/ConstraintsEditor';
import { RubricEditor } from './wizard/RubricEditor';
import { HintsEditor } from './wizard/HintsEditor';
import { PreviewPanel } from './wizard/PreviewPanel';

type WizardStep = 'step-type' | 'guide-asset' | 'constraints' | 'rubric' | 'hints' | 'preview';

interface WizardState {
  stepType: StepType | null;
  title: string;
  guideAsset: {
    type: 'upload' | 'parametric' | null;
    data: any;
    overlay?: string;
    path?: Array<{x: number, y: number}>;
    mask?: ImageData;
    targets?: Array<{x: number, y: number}>;
    targetOrder?: string[];
  };
  constraints: {
    tool?: 'pencil' | 'pen' | 'fill' | 'move';
    size_range?: [number, number];
    color?: string;
    locked?: boolean;
  };
  rubric: {
    threshold: number;
    coverageThreshold?: number;
    tolerancePx?: number;
  };
  hints: Array<{
    tier: 1 | 2 | 3;
    text: string;
    action?: 'play_demo';
  }>;
}

const WIZARD_STEPS: Array<{
  id: WizardStep;
  title: string;
  description: string;
}> = [
  {
    id: 'step-type',
    title: 'Step Type',
    description: 'Choose the type of drawing step'
  },
  {
    id: 'guide-asset',
    title: 'Guide Asset',
    description: 'Upload or create guide assets'
  },
  {
    id: 'constraints',
    title: 'Constraints',
    description: 'Set tool and drawing constraints'
  },
  {
    id: 'rubric',
    title: 'Rubric',
    description: 'Configure evaluation thresholds'
  },
  {
    id: 'hints',
    title: 'Hints',
    description: 'Create progressive hints (3 tiers)'
  },
  {
    id: 'preview',
    title: 'Preview & Export',
    description: 'Test and export your lesson'
  }
];

export const LessonAuthoringWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('step-type');
  const [wizardState, setWizardState] = useState<WizardState>({
    stepType: null,
    title: '',
    guideAsset: { type: null, data: null },
    constraints: {},
    rubric: { threshold: 0.65 },
    hints: []
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  const updateWizardState = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
    setValidationErrors([]);
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 'step-type':
        if (!wizardState.stepType) errors.push('Please select a step type');
        if (!wizardState.title.trim()) errors.push('Please enter a step title');
        break;
      
      case 'guide-asset':
        if (!wizardState.guideAsset.type) {
          errors.push('Please select a guide asset type');
        } else if (wizardState.stepType === 'stroke-path' && !wizardState.guideAsset.path) {
          errors.push('Please provide a path for stroke-path steps');
        } else if (wizardState.stepType === 'area-fill' && !wizardState.guideAsset.mask) {
          errors.push('Please provide a mask for area-fill steps');
        } else if (wizardState.stepType === 'dot-to-dot' && !wizardState.guideAsset.targets) {
          errors.push('Please provide targets for dot-to-dot steps');
        } else if (wizardState.stepType === 'layer-order' && !wizardState.guideAsset.targetOrder) {
          errors.push('Please provide target order for layer-order steps');
        }
        break;
      
      case 'constraints':
        // Constraints are optional, but validate ranges if provided
        if (wizardState.constraints.size_range) {
          const [min, max] = wizardState.constraints.size_range;
          if (min >= max) errors.push('Size range minimum must be less than maximum');
          if (min < 1 || max > 50) errors.push('Size range must be between 1 and 50');
        }
        break;
      
      case 'rubric':
        if (wizardState.rubric.threshold < 0 || wizardState.rubric.threshold > 1) {
          errors.push('Threshold must be between 0 and 1');
        }
        if (wizardState.stepType === 'area-fill' && wizardState.rubric.coverageThreshold) {
          if (wizardState.rubric.coverageThreshold < 0 || wizardState.rubric.coverageThreshold > 1) {
            errors.push('Coverage threshold must be between 0 and 1');
          }
        }
        break;
      
      case 'hints':
        if (wizardState.hints.length === 0) {
          errors.push('Please provide at least one hint');
        }
        const tiers = wizardState.hints.map(h => h.tier);
        if (!tiers.includes(1)) errors.push('Please provide a tier 1 hint');
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [currentStep, wizardState]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS[nextIndex].id);
    }
  }, [currentStepIndex, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex].id);
    }
  }, [currentStepIndex]);

  const handleExport = useCallback(async () => {
    if (!validateCurrentStep()) return;

    const stepSpec: StepSpec = {
      id: `step_${Date.now()}`,
      title: wizardState.title,
      type: wizardState.stepType!,
      constraints: Object.keys(wizardState.constraints).length > 0 ? wizardState.constraints : undefined,
      guide: wizardState.guideAsset.data ? {
        tip: `Complete this ${wizardState.stepType} step`,
        ...wizardState.guideAsset.data
      } : undefined,
      rubric: wizardState.rubric,
      hints: wizardState.hints.length > 0 ? wizardState.hints : undefined,
      on_success: {
        award: { xp: 10, stars: 3 }
      }
    };

    try {
      const response = await fetch('/api/admin/export-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepSpec)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson_${stepSpec.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [validateCurrentStep, wizardState]);

  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 'step-type':
        return (
          <StepTypeSelector
            selectedType={wizardState.stepType}
            title={wizardState.title}
            onTypeSelect={(stepType) => updateWizardState({ stepType })}
            onTitleChange={(title) => updateWizardState({ title })}
          />
        );
      
      case 'guide-asset':
        return (
          <GuideAssetEditor
            stepType={wizardState.stepType!}
            guideAsset={wizardState.guideAsset}
            onAssetChange={(guideAsset) => updateWizardState({ guideAsset })}
          />
        );
      
      case 'constraints':
        return (
          <ConstraintsEditor
            constraints={wizardState.constraints}
            onConstraintsChange={(constraints) => updateWizardState({ constraints })}
          />
        );
      
      case 'rubric':
        return (
          <RubricEditor
            stepType={wizardState.stepType!}
            rubric={wizardState.rubric}
            onRubricChange={(rubric) => updateWizardState({ rubric })}
          />
        );
      
      case 'hints':
        return (
          <HintsEditor
            hints={wizardState.hints}
            onHintsChange={(hints) => updateWizardState({ hints })}
          />
        );
      
      case 'preview':
        return (
          <PreviewPanel
            stepSpec={{
              id: 'preview',
              title: wizardState.title,
              type: wizardState.stepType!,
              constraints: wizardState.constraints,
              guide: wizardState.guideAsset.data,
              rubric: wizardState.rubric,
              hints: wizardState.hints,
              on_success: { award: { xp: 10, stars: 3 } }
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lesson Authoring Wizard</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStepIndex + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStepIndex].description}
              </p>
            </div>
            <Badge variant="outline">
              {wizardState.stepType || 'No Type Selected'}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2">
          {WIZARD_STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStep === step.id
                    ? 'bg-blue-100 text-blue-700'
                    : index < currentStepIndex
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
                disabled={index > currentStepIndex}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : index < currentStepIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-400 text-white'
                }`}>
                  {index + 1}
                </span>
                {step.title}
              </button>
              {index < WIZARD_STEPS.length - 1 && (
                <div className="w-8 h-px bg-gray-300" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="text-red-800">
              <p className="font-medium mb-2">Please fix the following issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {renderCurrentStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep === 'preview' && (
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Export Lesson
            </Button>
          )}
          
          {currentStepIndex < WIZARD_STEPS.length - 1 && (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
