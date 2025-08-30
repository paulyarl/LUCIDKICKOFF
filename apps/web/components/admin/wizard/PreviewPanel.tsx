import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Smartphone, Tablet, Download, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { StepSpec } from '../../../types/lesson';
import { LessonRunner } from '../../learning/LessonRunner';

interface PreviewPanelProps {
  stepSpec: StepSpec;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ stepSpec }) => {
  const [activePreview, setActivePreview] = useState<'mobile' | 'tablet'>('mobile');
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const validateStepSpec = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!stepSpec.id) errors.push('Step ID is required');
    if (!stepSpec.title) errors.push('Step title is required');
    if (!stepSpec.type) errors.push('Step type is required');

    // Type-specific validation
    switch (stepSpec.type) {
      case 'stroke-path':
        if (!stepSpec.guide?.path) errors.push('Stroke path requires a guide path');
        break;
      case 'area-fill':
        if (!stepSpec.guide?.mask) errors.push('Area fill requires a mask');
        if (!stepSpec.guide?.targetColor) errors.push('Area fill requires a target color');
        break;
      case 'dot-to-dot':
        if (!stepSpec.guide?.targets) errors.push('Dot-to-dot requires target points');
        break;
      case 'layer-order':
        if (!stepSpec.guide?.targetOrder) errors.push('Layer order requires target order array');
        break;
    }

    // Hints validation
    if (!stepSpec.hints || stepSpec.hints.length === 0) {
      warnings.push('No hints provided - learners won\'t get help when struggling');
    } else {
      const tiers = stepSpec.hints.map(h => h.tier);
      if (!tiers.includes(1)) warnings.push('Missing Tier 1 hint');
      if (!tiers.includes(2)) warnings.push('Missing Tier 2 hint');
      if (!tiers.includes(3)) warnings.push('Missing Tier 3 hint');
    }

    // Constraints validation
    if (stepSpec.constraints?.size_range) {
      const [min, max] = stepSpec.constraints.size_range;
      if (min >= max) errors.push('Size range minimum must be less than maximum');
    }

    // Rubric validation
    if (stepSpec.rubric) {
      if (stepSpec.rubric.threshold < 0 || stepSpec.rubric.threshold > 1) {
        errors.push('Rubric threshold must be between 0 and 1');
      }
    }

    const results = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    setValidationResults(results);
    return results;
  };

  const getPreviewDimensions = (device: 'mobile' | 'tablet') => {
    switch (device) {
      case 'mobile':
        // 19.5:9 aspect ratio (common for modern phones)
        return { width: 390, height: 844, aspectRatio: '19.5:9' };
      case 'tablet':
        // 16:10 aspect ratio (common for tablets)
        return { width: 768, height: 480, aspectRatio: '16:10' };
    }
  };

  const handleExport = async () => {
    const validation = validateStepSpec();
    if (!validation.isValid) {
      alert('Please fix validation errors before exporting');
      return;
    }

    try {
      // Create downloadable JSON
      const jsonData = JSON.stringify(stepSpec, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson_${stepSpec.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const dimensions = getPreviewDimensions(activePreview);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Preview & Export</h3>
        <p className="text-sm text-gray-600">
          Test your lesson on different screen sizes and export when ready
        </p>
      </div>

      {/* Validation Status */}
      <Card className={`border-2 ${
        validationResults?.isValid === false ? 'border-red-200 bg-red-50' :
        validationResults?.isValid === true ? 'border-green-200 bg-green-50' :
        'border-gray-200'
      }`}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {validationResults?.isValid === false ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : validationResults?.isValid === true ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Eye className="w-5 h-5 text-gray-600" />
            )}
            Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={validateStepSpec} size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Validate Lesson
            </Button>
            <Button 
              onClick={handleExport} 
              size="sm" 
              variant="outline"
              disabled={validationResults?.isValid === false}
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>

          {validationResults && (
            <div className="space-y-3">
              {validationResults.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700">Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResults.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-700">Warnings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResults.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.isValid && (
                <p className="text-sm text-green-700 font-medium">
                  ✅ Lesson is valid and ready to export!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Device Preview</CardTitle>
          <Tabs value={activePreview} onValueChange={(value: string) => setActivePreview(value as 'mobile' | 'tablet')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile (19.5:9)
              </TabsTrigger>
              <TabsTrigger value="tablet" className="flex items-center gap-2">
                <Tablet className="w-4 h-4" />
                Tablet (16:10)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div 
              className="border-8 border-gray-800 rounded-2xl overflow-hidden shadow-2xl bg-white"
              style={{
                width: dimensions.width,
                height: dimensions.height,
                maxWidth: '100%',
                maxHeight: '70vh'
              }}
            >
              <div className="w-full h-full overflow-auto">
                <div className="p-4 min-h-full">
                  <div className="mb-4 text-center">
                    <Badge variant="outline">
                      {dimensions.aspectRatio} • {dimensions.width}×{dimensions.height}
                    </Badge>
                  </div>
                  
                  {/* Lesson Preview */}
                  <div className="scale-75 origin-top">
                    <LessonRunner
                      step={stepSpec}
                      onStepComplete={() => {}}
                      canSkip={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            Preview shows how the lesson will appear on {activePreview} devices
          </div>
        </CardContent>
      </Card>

      {/* Lesson Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Type:</span> {stepSpec.type}
              </div>
              <div>
                <span className="font-medium">Title:</span> {stepSpec.title}
              </div>
              <div>
                <span className="font-medium">Constraints:</span>{' '}
                {stepSpec.constraints ? (
                  <span>
                    {stepSpec.constraints.tool && `Tool: ${stepSpec.constraints.tool}`}
                    {stepSpec.constraints.color && `, Color: ${stepSpec.constraints.color}`}
                    {stepSpec.constraints.size_range && `, Size: ${stepSpec.constraints.size_range[0]}-${stepSpec.constraints.size_range[1]}px`}
                    {stepSpec.constraints.locked && `, Locked`}
                  </span>
                ) : (
                  'None'
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Hints:</span> {stepSpec.hints?.length || 0} configured
              </div>
              <div>
                <span className="font-medium">Rubric:</span>{' '}
                {stepSpec.rubric?.threshold ? `${Math.round(stepSpec.rubric.threshold * 100)}% threshold` : 'Default'}
              </div>
              <div>
                <span className="font-medium">Success Reward:</span>{' '}
                {stepSpec.on_success?.award?.xp || 0} XP, {stepSpec.on_success?.award?.stars || 0} ⭐
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
