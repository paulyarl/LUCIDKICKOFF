import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Slider } from '../../ui/slider';

interface ConstraintsEditorProps {
  constraints: {
    tool?: 'pencil' | 'pen' | 'fill' | 'move';
    size_range?: [number, number];
    color?: string;
    locked?: boolean;
  };
  onConstraintsChange: (constraints: any) => void;
}

export const ConstraintsEditor: React.FC<ConstraintsEditorProps> = ({
  constraints,
  onConstraintsChange
}) => {
  const updateConstraint = (key: string, value: any) => {
    onConstraintsChange({
      ...constraints,
      [key]: value
    });
  };

  const updateSizeRange = (values: number[]) => {
    updateConstraint('size_range', [values[0], values[1]] as [number, number]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Drawing Constraints</h3>
        <p className="text-sm text-gray-600">
          Set limitations on tools, colors, and sizes that learners can use
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool Constraint */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tool Restriction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Allowed Tool</Label>
              <Select
                value={constraints.tool || 'none'}
                onValueChange={(value: string) => updateConstraint('tool', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No restriction</SelectItem>
                  <SelectItem value="pencil">Pencil only</SelectItem>
                  <SelectItem value="pen">Pen only</SelectItem>
                  <SelectItem value="fill">Fill tool only</SelectItem>
                  <SelectItem value="move">Move tool only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="locked-tools"
                checked={constraints.locked || false}
                onCheckedChange={(checked: boolean) => updateConstraint('locked', checked)}
              />
              <Label htmlFor="locked-tools" className="text-sm">
                Lock tool palette (prevent switching)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Color Constraint */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Color Restriction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Required Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={constraints.color || '#000000'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConstraint('color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={constraints.color || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConstraint('color', e.target.value)}
                  placeholder="No color restriction"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Leave empty for no color restriction
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Size Constraint */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Size Range Restriction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="size-restriction"
                  checked={!!constraints.size_range}
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      updateConstraint('size_range', [2, 10]);
                    } else {
                      updateConstraint('size_range', undefined);
                    }
                  }}
                />
                <Label htmlFor="size-restriction" className="text-sm">
                  Restrict brush size range
                </Label>
              </div>

              {constraints.size_range && (
                <div className="space-y-4">
                  <div className="px-4">
                    <Label className="text-sm font-medium">
                      Size Range: {constraints.size_range[0]}px - {constraints.size_range[1]}px
                    </Label>
                    <div className="mt-2">
                      <Slider
                        value={constraints.size_range}
                        onValueChange={updateSizeRange}
                        min={1}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1px</span>
                      <span>50px</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-size" className="text-sm">Minimum Size</Label>
                      <Input
                        id="min-size"
                        type="number"
                        min="1"
                        max="49"
                        value={constraints.size_range[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const min = parseInt(e.target.value);
                          const max = constraints.size_range![1];
                          if (min < max) {
                            updateConstraint('size_range', [min, max]);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-size" className="text-sm">Maximum Size</Label>
                      <Input
                        id="max-size"
                        type="number"
                        min="2"
                        max="50"
                        value={constraints.size_range[1]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const max = parseInt(e.target.value);
                          const min = constraints.size_range![0];
                          if (max > min) {
                            updateConstraint('size_range', [min, max]);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">Constraint Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {constraints.tool ? (
              <p className="text-blue-800">
                <span className="font-medium">Tool:</span> Only {constraints.tool} allowed
              </p>
            ) : (
              <p className="text-gray-600">
                <span className="font-medium">Tool:</span> All tools available
              </p>
            )}

            {constraints.color ? (
              <p className="text-blue-800">
                <span className="font-medium">Color:</span> Must use {constraints.color}
              </p>
            ) : (
              <p className="text-gray-600">
                <span className="font-medium">Color:</span> All colors available
              </p>
            )}

            {constraints.size_range ? (
              <p className="text-blue-800">
                <span className="font-medium">Size:</span> {constraints.size_range[0]}px - {constraints.size_range[1]}px
              </p>
            ) : (
              <p className="text-gray-600">
                <span className="font-medium">Size:</span> Full range (1px - 50px)
              </p>
            )}

            {constraints.locked && (
              <p className="text-blue-800">
                <span className="font-medium">Locked:</span> Tool palette is locked
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

