import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { Plus, Trash2, Lightbulb, Play } from 'lucide-react';

interface HintsEditorProps {
  hints: Array<{
    tier: 1 | 2 | 3;
    text: string;
    action?: 'play_demo';
  }>;
  onHintsChange: (hints: any[]) => void;
}

export const HintsEditor: React.FC<HintsEditorProps> = ({
  hints,
  onHintsChange
}) => {
  const addHint = (tier: 1 | 2 | 3) => {
    const newHint = {
      tier,
      text: '',
      action: undefined as 'play_demo' | undefined
    };
    onHintsChange([...hints, newHint]);
  };

  const updateHint = (index: number, updates: Partial<typeof hints[0]>) => {
    const updatedHints = hints.map((hint, i) => 
      i === index ? { ...hint, ...updates } : hint
    );
    onHintsChange(updatedHints);
  };

  const removeHint = (index: number) => {
    onHintsChange(hints.filter((_, i) => i !== index));
  };

  const getHintsByTier = (tier: 1 | 2 | 3) => {
    return hints.filter(hint => hint.tier === tier);
  };

  const getTierColor = (tier: 1 | 2 | 3) => {
    switch (tier) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getTierDescription = (tier: 1 | 2 | 3) => {
    switch (tier) {
      case 1: return 'Gentle guidance - shown after first failure';
      case 2: return 'More specific help - shown after second failure';
      case 3: return 'Detailed assistance - shown after third failure';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Progressive Hints System</h3>
        <p className="text-sm text-gray-600">
          Create a 3-tier hint system that provides increasingly specific help as learners struggle
        </p>
      </div>

      {/* Tier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(tier => (
          <Card key={tier} className={`border-2 ${getTierColor(tier as 1 | 2 | 3)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Tier {tier}
                </CardTitle>
                <Badge variant="outline" className={getTierColor(tier as 1 | 2 | 3)}>
                  {getHintsByTier(tier as 1 | 2 | 3).length} hints
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {getTierDescription(tier as 1 | 2 | 3)}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addHint(tier as 1 | 2 | 3)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tier {tier} Hint
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hints List */}
      <div className="space-y-4">
        {[1, 2, 3].map(tier => {
          const tierHints = getHintsByTier(tier as 1 | 2 | 3);
          
          return (
            <Card key={tier} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    tier === 1 ? 'bg-green-500' : tier === 2 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {tier}
                  </span>
                  Tier {tier} Hints
                  <Badge variant="secondary">{tierHints.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tierHints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hints for tier {tier} yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addHint(tier as 1 | 2 | 3)}
                      className="mt-2"
                    >
                      Add First Hint
                    </Button>
                  </div>
                ) : (
                  tierHints.map((hint, hintIndex) => {
                    const globalIndex = hints.findIndex(h => h === hint);
                    return (
                      <Card key={globalIndex} className="bg-gray-50">
                        <CardContent className="pt-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <Badge variant="outline" className={getTierColor(tier as 1 | 2 | 3)}>
                              Tier {tier} - Hint {hintIndex + 1}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeHint(globalIndex)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`hint-text-${globalIndex}`}>Hint Text</Label>
                            <Textarea
                              id={`hint-text-${globalIndex}`}
                              value={hint.text}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateHint(globalIndex, { text: e.target.value })}
                              placeholder={`Enter a ${tier === 1 ? 'gentle' : tier === 2 ? 'more specific' : 'detailed'} hint...`}
                              rows={3}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`demo-action-${globalIndex}`}
                              checked={hint.action === 'play_demo'}
                              onCheckedChange={(checked: boolean) => 
                                updateHint(globalIndex, { 
                                  action: checked ? 'play_demo' : undefined 
                                })
                              }
                            />
                            <Label htmlFor={`demo-action-${globalIndex}`} className="text-sm flex items-center gap-2">
                              <Play className="w-4 h-4" />
                              Include "Play Demo" button
                            </Label>
                          </div>

                          {hint.text && (
                            <div className="p-3 bg-white rounded border">
                              <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                              <p className="text-sm text-gray-600">{hint.text}</p>
                              {hint.action === 'play_demo' && (
                                <Button size="sm" variant="outline" className="mt-2" disabled>
                                  <Play className="w-4 h-4 mr-2" />
                                  Play Demo
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hint Flow Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">Hint Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-blue-800 font-medium">How hints will be shown to learners:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>First failure → Show Tier 1 hints ({getHintsByTier(1).length} available)</li>
              <li>Second failure → Show Tier 2 hints ({getHintsByTier(2).length} available)</li>
              <li>Third failure → Show Tier 3 hints + auto-advance option ({getHintsByTier(3).length} available)</li>
            </ol>
            {hints.length === 0 && (
              <p className="text-orange-700 mt-2">
                ⚠️ No hints configured. Learners won't receive help when struggling.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
