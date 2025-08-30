import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Pencil, Paintbrush, Target, Layers } from 'lucide-react';
import { StepType } from '../../../types/lesson';

interface StepTypeSelectorProps {
  selectedType: StepType | null;
  title: string;
  onTypeSelect: (type: StepType) => void;
  onTitleChange: (title: string) => void;
}

const STEP_TYPES = [
  {
    id: 'stroke-path' as StepType,
    title: 'Stroke Path',
    description: 'Draw along a specific path or line',
    icon: <Pencil className="w-8 h-8" />,
    color: 'bg-blue-500',
    examples: ['Trace a circle', 'Draw a straight line', 'Follow a curved path']
  },
  {
    id: 'area-fill' as StepType,
    title: 'Area Fill',
    description: 'Fill a specific area with color',
    icon: <Paintbrush className="w-8 h-8" />,
    color: 'bg-green-500',
    examples: ['Fill a shape', 'Color within boundaries', 'Paint a region']
  },
  {
    id: 'dot-to-dot' as StepType,
    title: 'Dot to Dot',
    description: 'Connect dots in the correct sequence',
    icon: <Target className="w-8 h-8" />,
    color: 'bg-purple-500',
    examples: ['Connect numbered dots', 'Follow a sequence', 'Create shapes by connecting points']
  },
  {
    id: 'layer-order' as StepType,
    title: 'Layer Order',
    description: 'Arrange elements in the correct order',
    icon: <Layers className="w-8 h-8" />,
    color: 'bg-orange-500',
    examples: ['Stack shapes correctly', 'Arrange depth order', 'Organize visual hierarchy']
  }
];

export const StepTypeSelector: React.FC<StepTypeSelectorProps> = ({
  selectedType,
  title,
  onTypeSelect,
  onTitleChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="step-title" className="text-base font-medium">
          Step Title
        </Label>
        <Input
          id="step-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter a descriptive title for this step"
          className="mt-2"
        />
        <p className="text-sm text-gray-500 mt-1">
          This will be shown to learners during the lesson
        </p>
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">
          Choose Step Type
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEP_TYPES.map((stepType) => (
            <Card
              key={stepType.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === stepType.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => onTypeSelect(stepType.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${stepType.color} flex items-center justify-center text-white`}>
                    {stepType.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{stepType.title}</CardTitle>
                    {selectedType === stepType.id && (
                      <Badge variant="secondary" className="mt-1">Selected</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">{stepType.description}</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Examples:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {stepType.examples.map((example, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedType && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                {STEP_TYPES.find(t => t.id === selectedType)?.icon}
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  {STEP_TYPES.find(t => t.id === selectedType)?.title} Selected
                </h3>
                <p className="text-sm text-blue-700">
                  Next, you'll configure the guide assets and constraints for this step type.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
