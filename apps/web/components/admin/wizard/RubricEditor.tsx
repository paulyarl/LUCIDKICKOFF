import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';
import { StepType } from '../../../types/lesson';

interface RubricEditorProps {
  stepType: StepType;
  rubric: {
    threshold: number;
    coverageThreshold?: number;
    tolerancePx?: number;
  };
  onRubricChange: (rubric: any) => void;
}

export const RubricEditor: React.FC<RubricEditorProps> = ({
  stepType,
  rubric,
  onRubricChange
}) => {
  const updateRubric = (key: string, value: any) => {
    onRubricChange({
      ...rubric,
      [key]: value
    });
  };

  const renderStepTypeSpecificRubric = () => {
    switch (stepType) {
      case 'stroke-path':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Path Accuracy Threshold</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Accuracy Score: {Math.round(rubric.threshold * 100)}%</Label>
                <Slider
                  value={[rubric.threshold]}
                  onValueChange={(vals: number[]) => {
                    const [value] = vals
                    updateRubric('threshold', value)
                  }}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10% (Very Lenient)</span>
                  <span>100% (Perfect Match)</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Uses discrete Fréchet distance to measure how closely the user's stroke follows the guide path.
              </p>
            </CardContent>
          </Card>
        );

      case 'area-fill':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Coverage Threshold</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minimum Coverage: {Math.round((rubric.coverageThreshold || 0.85) * 100)}%</Label>
                  <Slider
                    value={[rubric.coverageThreshold || 0.85]}
                    onValueChange={(vals: number[]) => {
                      const [value] = vals
                      updateRubric('coverageThreshold', value)
                    }}
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>50% (Lenient)</span>
                    <span>100% (Complete Fill)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Percentage of the target area that must be filled to pass.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Color Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hue-tolerance">Hue Tolerance</Label>
                    <Input
                      id="hue-tolerance"
                      type="number"
                      min="0"
                      max="180"
                      defaultValue="10"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">degrees (0-360)</p>
                  </div>
                  <div>
                    <Label htmlFor="saturation-tolerance">Saturation Tolerance</Label>
                    <Input
                      id="saturation-tolerance"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="8"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">percent (0-100)</p>
                  </div>
                  <div>
                    <Label htmlFor="lightness-tolerance">Lightness Tolerance</Label>
                    <Input
                      id="lightness-tolerance"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="8"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">percent (0-100)</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  HSL color space tolerances for matching the target color.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'dot-to-dot':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tap Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tolerance Radius: {rubric.tolerancePx || 12}px</Label>
                <Slider
                  value={[rubric.tolerancePx || 12]}
                  onValueChange={(vals: number[]) => {
                    const [value] = vals
                    updateRubric('tolerancePx', value)
                  }}
                  min={5}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5px (Precise)</span>
                  <span>50px (Forgiving)</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Maximum distance from target dots that still counts as a successful tap.
              </p>
            </CardContent>
          </Card>
        );

      case 'layer-order':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Layer order steps require exact sequence matching. No threshold configuration needed.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Pass Criteria:</strong> All layers must be in the exact order specified.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Evaluation Rubric</h3>
        <p className="text-sm text-gray-600">
          Configure the thresholds and criteria for evaluating {stepType} performance
        </p>
      </div>

      {renderStepTypeSpecificRubric()}

      {/* Star Rating Thresholds */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-base text-yellow-900">Star Rating Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800">⭐⭐⭐ (3 Stars)</span>
              <span className="text-yellow-700">
                {stepType === 'stroke-path' ? '≥85% accuracy' : 
                 stepType === 'area-fill' ? '≥95% coverage + correct color' :
                 stepType === 'dot-to-dot' ? 'Perfect sequence' :
                 'Exact order match'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-800">⭐⭐ (2 Stars)</span>
              <span className="text-yellow-700">
                {stepType === 'stroke-path' ? '≥75% accuracy' : 
                 stepType === 'area-fill' ? '≥90% coverage + correct color' :
                 stepType === 'dot-to-dot' ? 'Perfect sequence' :
                 'Exact order match'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-800">⭐ (1 Star)</span>
              <span className="text-yellow-700">
                Meets minimum threshold ({Math.round(rubric.threshold * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">No Stars</span>
              <span className="text-gray-500">Below minimum threshold</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
