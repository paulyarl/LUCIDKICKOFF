import { notFound } from 'next/navigation';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function PackPage({ params }: { params: { slug: string } }) {
  // In a real app, this would fetch pack data
  const pack = {
    id: params.slug,
    title: 'Sample Pack',
    aspectRatio: '16/10', // Default aspect ratio
  };

  if (!pack) {
    notFound();
  }

  const handleExport = async () => {
    'use client';
    // This would be replaced with actual export logic
    const canvas = document.createElement('canvas');
    const container = document.querySelector('[data-testid="pack-container"]');
    if (!container) return;
    
    // Get computed dimensions maintaining aspect ratio
    const { width, height } = container.getBoundingClientRect();
    
    // Create canvas with the same aspect ratio
    canvas.width = width * 2; // For better quality
    canvas.height = height * 2;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw content (in a real app, this would be the actual pack content)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some sample content
    ctx.fillStyle = '#000000';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pack.title, canvas.width / 2, canvas.height / 2);
    
    // Export as PNG
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `pack-${pack.id}.png`;
    a.click();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{pack.title}</h1>
      
      <div className="max-w-4xl mx-auto">
        {/* Container with enforced aspect ratio */}
        <div 
          data-testid="pack-container"
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{
            aspectRatio: pack.aspectRatio,
            maxHeight: '80vh'
          }}
        >
          {/* Content goes here */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-lg text-gray-600">Pack Content</p>
          </div>
          
          {/* Export button */}
          <div className="absolute bottom-4 right-4">
            <Button 
              onClick={handleExport}
              variant="outline"
              size="icon"
              data-testid="export-button"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for SSG
export async function generateStaticParams() {
  return [{ slug: 'sample-pack' }];
}
