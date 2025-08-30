'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LearningExperience } from '@/components/learning/LearningExperience';
import { getPackById, ALL_PACKS } from '@/lib/learning/packs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/provider';

export default function LearnPackPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const packId = Array.isArray(params.packId) ? params.packId[0] : params.packId;
  const [isClient, setIsClient] = useState(false);
  
  // Get the pack data
  const pack = getPackById(packId);
  
  // Track if the component has mounted
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Handle pack not found
  if (!pack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <Icons.alertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('learn.pack.notFound.title')}</h1>
        <p className="text-muted-foreground mb-6 max-w-md">{t('learn.pack.notFound.message')}</p>
        <Button onClick={() => router.push('/packs')}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" />
          {t('learn.pack.notFound.browse')}
        </Button>
      </div>
    );
  }
  
  // Handle quiz completion
  const handleQuizComplete = (score: number, completedPackId: string) => {
    console.log(`Quiz completed for pack ${completedPackId} with score ${score}%`);
    
    // Show a toast notification
    toast({
      title: t('learn.pack.toast.quizCompleted.title'),
      description: t('learn.pack.toast.quizCompleted.description', { score, title: pack.title }),
    });
    
    // In a real app, you would save the quiz results to your database here
    // For example:
    // await saveQuizResults(completedPackId, score);
  };
  
  // Handle artwork save
  const handleArtworkSave = (lines: any[], imageData: string) => {
    console.log('Artwork saved:', { lines, imageData: imageData.substring(0, 50) + '...' });
    
    // In a real app, you would save the artwork to your database here
    // For example:
    // await saveArtwork(packId, lines, imageData);
    
    // Show a toast notification
    toast({
      title: t('learn.pack.toast.artSaved.title'),
      description: t('learn.pack.toast.artSaved.description'),
    });
  };
  
  // Only render the learning experience on the client side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Icons.loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-2"
          >
            <Icons.arrowLeft className="mr-2 h-4 w-4" />
            {t('learn.pack.backToPacks')}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{pack.title}</h1>
          <p className="text-muted-foreground">{pack.description}</p>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <LearningExperience
          packId={pack.id}
          initialLines={[]}
          width={1200}
          height={800}
          backgroundImage={pack.backgroundImage}
          objectives={pack.objectives}
          questions={pack.questions}
          hints={pack.hints}
          onQuizComplete={handleQuizComplete}
          onArtworkSave={handleArtworkSave}
          className="h-[calc(100vh-200px)]"
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('learn.pack.morePacks')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ALL_PACKS
            .filter(p => p.id !== packId)
            .slice(0, 3)
            .map((relatedPack) => (
              <div 
                key={relatedPack.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/learn/${relatedPack.id}`)}
              >
                <div className="h-40 bg-muted relative">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${relatedPack.thumbnailUrl})` }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm">
                      <Icons.play className="mr-2 h-4 w-4" />
                      {t('learn.pack.openPack')}
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{relatedPack.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {relatedPack.description}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
