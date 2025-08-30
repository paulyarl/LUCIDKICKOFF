'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TutorialView() {
  const params = useParams();
  const tutorialId = params.tutorialId as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold">Tutorial {tutorialId}</h1>
          <Badge variant="secondary">Step-by-step</Badge>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Drawing Tutorial: Basic Shapes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Learn fundamental drawing techniques through this comprehensive tutorial.
              Master the basics before moving on to advanced concepts.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">What you'll learn:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Basic shape construction</li>
                  <li>• Line weight and control</li>
                  <li>• Proportions and measurements</li>
                  <li>• Shading techniques</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Prerequisites:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• None - beginner friendly</li>
                  <li>• Basic drawing tools</li>
                  <li>• 30 minutes of time</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="start-drawing-cta">
                Start Tutorial
              </Button>
              <Button variant="outline" size="lg">
                Preview Steps
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
