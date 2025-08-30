import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Upload, Square, Circle, Pen, Plus, Trash2 } from 'lucide-react';
import { StepType } from '../../../types/lesson';

interface GuideAssetEditorProps {
  stepType: StepType;
  guideAsset: {
    type: 'upload' | 'parametric' | null;
    data: any;
    overlay?: string;
    path?: Array<{x: number, y: number}>;
    mask?: ImageData;
    targets?: Array<{x: number, y: number}>;
    targetOrder?: string[];
  };
  onAssetChange: (asset: any) => void;
}

export const GuideAssetEditor: React.FC<GuideAssetEditorProps> = ({
  stepType,
  guideAsset,
  onAssetChange
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'parametric'>('upload');
  const [parametricShape, setParametricShape] = useState<'circle' | 'rectangle' | 'path'>('circle');
  const [pathPoints, setPathPoints] = useState<Array<{x: number, y: number}>>([]);
  const [targets, setTargets] = useState<Array<{x: number, y: number}>>([]);
  const [layerOrder, setLayerOrder] = useState<string[]>(['background', 'foreground']);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onAssetChange({
        ...guideAsset,
        type: 'upload',
        data: { overlay: result }
      });
    };
    reader.readAsDataURL(file);
  }, [guideAsset, onAssetChange]);

  const handleParametricShape = useCallback((shape: 'circle' | 'rectangle' | 'path') => {
    setParametricShape(shape);
    
    let shapeData;
    switch (shape) {
      case 'circle':
        shapeData = {
          type: 'circle',
          center: { x: 200, y: 200 },
          radius: 100,
          path: generateCirclePath(200, 200, 100)
        };
        break;
      case 'rectangle':
        shapeData = {
          type: 'rectangle',
          x: 150, y: 150,
          width: 100, height: 80,
          path: generateRectanglePath(150, 150, 100, 80)
        };
        break;
      case 'path':
        shapeData = {
          type: 'path',
          path: pathPoints
        };
        break;
    }

    onAssetChange({
      ...guideAsset,
      type: 'parametric',
      data: shapeData
    });
  }, [guideAsset, onAssetChange, pathPoints]);

  const generateCirclePath = (cx: number, cy: number, radius: number) => {
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * 2 * Math.PI;
      points.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      });
    }
    return points;
  };

  const generateRectanglePath = (x: number, y: number, width: number, height: number) => {
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
      { x, y }
    ];
  };

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (stepType === 'dot-to-dot') {
      const newTargets = [...targets, { x, y }];
      setTargets(newTargets);
      onAssetChange({
        ...guideAsset,
        targets: newTargets
      });
    } else if (parametricShape === 'path') {
      const newPoints = [...pathPoints, { x, y }];
      setPathPoints(newPoints);
      onAssetChange({
        ...guideAsset,
        type: 'parametric',
        data: { type: 'path', path: newPoints }
      });
    }
  }, [stepType, targets, pathPoints, parametricShape, guideAsset, onAssetChange]);

  const addLayerOrderItem = () => {
    const newItem = `layer_${layerOrder.length + 1}`;
    const newOrder = [...layerOrder, newItem];
    setLayerOrder(newOrder);
    onAssetChange({
      ...guideAsset,
      targetOrder: newOrder
    });
  };

  const removeLayerOrderItem = (index: number) => {
    const newOrder = layerOrder.filter((_, i) => i !== index);
    setLayerOrder(newOrder);
    onAssetChange({
      ...guideAsset,
      targetOrder: newOrder
    });
  };

  const moveLayerOrderItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...layerOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      setLayerOrder(newOrder);
      onAssetChange({
        ...guideAsset,
        targetOrder: newOrder
      });
    }
  };

  const renderStepTypeSpecificContent = () => {
    switch (stepType) {
      case 'stroke-path':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create or upload a path that learners will trace
            </p>
            {activeTab === 'parametric' && (
              <div className="space-y-4">
                <Label>Shape Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={parametricShape === 'circle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleParametricShape('circle')}
                  >
                    <Circle className="w-4 h-4 mr-2" />
                    Circle
                  </Button>
                  <Button
                    variant={parametricShape === 'rectangle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleParametricShape('rectangle')}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Rectangle
                  </Button>
                  <Button
                    variant={parametricShape === 'path' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleParametricShape('path')}
                  >
                    <Pen className="w-4 h-4 mr-2" />
                    Custom Path
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'area-fill':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a mask image or create a shape to fill
            </p>
            <div className="space-y-2">
              <Label>Target Color</Label>
              <Input
                type="color"
                defaultValue="#ff0000"
                className="w-20 h-10"
                onChange={(e) => onAssetChange({
                  ...guideAsset,
                  data: { ...guideAsset.data, targetColor: { h: 0, s: 100, l: 50 } }
                })}
              />
            </div>
          </div>
        );

      case 'dot-to-dot':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Click on the canvas below to place dots in the correct sequence
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Targets: {targets.length}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTargets([]);
                  onAssetChange({ ...guideAsset, targets: [] });
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        );

      case 'layer-order':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Define the correct order of layers from bottom to top
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Layer Order (Bottom to Top)</Label>
                <Button size="sm" onClick={addLayerOrderItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Layer
                </Button>
              </div>
              <div className="space-y-2">
                {layerOrder.map((layer, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-mono flex-1">{layer}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveLayerOrderItem(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveLayerOrderItem(index, 'down')}
                        disabled={index === layerOrder.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLayerOrderItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Guide Asset Configuration</h3>
        <p className="text-sm text-gray-600">
          Configure the visual guides and assets for your {stepType} step
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'upload' | 'parametric')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Asset</TabsTrigger>
          <TabsTrigger value="parametric">Parametric Shapes</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Guide Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click to upload an image</p>
                  <p className="text-sm text-gray-500">PNG, JPG, or SVG</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametric" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Parametric Shape</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepTypeSpecificContent()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Interactive Canvas */}
      {(stepType === 'dot-to-dot' || (activeTab === 'parametric' && parametricShape === 'path')) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {stepType === 'dot-to-dot' ? 'Place Target Dots' : 'Draw Custom Path'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="border rounded-lg cursor-crosshair bg-white"
              onClick={handleCanvasClick}
            />
            <p className="text-sm text-gray-500 mt-2">
              {stepType === 'dot-to-dot' 
                ? 'Click to place dots in the order learners should connect them'
                : 'Click to add points to your custom path'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
