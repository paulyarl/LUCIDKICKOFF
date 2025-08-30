import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Pencil, Pen, Paintbrush, Move, Palette } from 'lucide-react';
import { Constraints } from '../../features/learn/canvas/CanvasEngine';

export interface Tool {
  id: 'pencil' | 'pen' | 'fill' | 'move';
  name: string;
  icon: React.ReactNode;
  color?: string;
  size?: number;
}

export interface ToolPaletteProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  constraints?: Constraints;
  className?: string;
}

const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'pencil',
    name: 'Pencil',
    icon: <Pencil className="w-4 h-4" />,
    size: 2
  },
  {
    id: 'pen',
    name: 'Pen',
    icon: <Pen className="w-4 h-4" />,
    size: 3
  },
  {
    id: 'fill',
    name: 'Fill',
    icon: <Paintbrush className="w-4 h-4" />
  },
  {
    id: 'move',
    name: 'Move',
    icon: <Move className="w-4 h-4" />
  }
];

const COLOR_PALETTE = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#800080', '#FFC0CB', '#A52A2A', '#808080'
];

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  selectedTool,
  onToolSelect,
  constraints,
  className = ''
}) => {
  const availableTools = DEFAULT_TOOLS.filter(tool => {
    return !constraints || constraints.canUseTool(tool.id);
  });

  const lockedColor = constraints?.getLockedColor();
  const sizeRange = constraints?.getSizeRange();
  const isLocked = constraints?.isToolLocked();

  const handleToolSelect = (tool: Tool) => {
    if (constraints && !constraints.canUseTool(tool.id)) return;
    onToolSelect(tool);
  };

  const handleColorSelect = (color: string) => {
    if (lockedColor && color !== lockedColor) return;
    onToolSelect({ ...selectedTool, color });
  };

  const handleSizeChange = (size: number) => {
    if (sizeRange && (size < sizeRange[0] || size > sizeRange[1])) return;
    onToolSelect({ ...selectedTool, size });
  };

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      {/* Tool Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          Tools
          {isLocked && <Badge variant="secondary" className="text-xs">Locked</Badge>}
        </h3>
        <div className="flex gap-2">
          {availableTools.map(tool => {
            const isSelected = selectedTool.id === tool.id;
            const isDisabled = !!constraints && !constraints.canUseTool(tool.id);
            
            return (
              <Button
                key={tool.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolSelect(tool)}
                disabled={isDisabled}
                className="flex flex-col gap-1 h-12 w-12 p-1"
                title={tool.name}
              >
                {tool.icon}
                <span className="text-xs">{tool.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Color Palette */}
      {selectedTool.id !== 'move' && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color
            {lockedColor && <Badge variant="secondary" className="text-xs">Locked</Badge>}
          </h3>
          <div className="grid grid-cols-6 gap-1">
            {COLOR_PALETTE.map(color => {
              const isSelected = selectedTool.color === color;
              const isDisabled = !!lockedColor && color !== lockedColor;
              
              return (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    isSelected ? 'border-gray-800 scale-110' : 'border-gray-300'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  disabled={isDisabled}
                  title={color}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size Slider */}
      {selectedTool.id !== 'move' && selectedTool.id !== 'fill' && (
        <div>
          <h3 className="text-sm font-medium mb-2">
            Size: {selectedTool.size || 2}px
            {sizeRange && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {sizeRange[0]}-{sizeRange[1]}px
              </Badge>
            )}
          </h3>
          <input
            type="range"
            min={sizeRange?.[0] || 1}
            max={sizeRange?.[1] || 20}
            value={selectedTool.size || 2}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSizeChange(parseInt(e.target.value))}
            className="w-full"
            disabled={!!sizeRange && sizeRange[0] === sizeRange[1]}
          />
        </div>
      )}
    </div>
  );
};

export default ToolPalette;
