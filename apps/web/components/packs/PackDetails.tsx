'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/provider';

type PagePreview = {
  id: string;
  imageUrl: string;
  altText: string;
  isLocked: boolean;
};

type PackDetailsProps = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  pages: PagePreview[];
  isLocked: boolean;
  progress?: number;
  onUnlock: () => Promise<void>;
  onStudy: () => void;
  onStudyAndColor: () => void;
};

export function PackDetails({
  id,
  title,
  description,
  coverImage,
  pages,
  isLocked,
  progress = 0,
  onUnlock,
  onStudy,
  onStudyAndColor,
}: PackDetailsProps) {
  const { t } = useI18n();
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [previewPage, setPreviewPage] = React.useState<PagePreview | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const unlockedPages = pages.filter((page) => !page.isLocked);
  const lockedPages = pages.filter((page) => page.isLocked);
  const showProgress = progress > 0 && progress < 100;

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true);
      await onUnlock();
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePreview = (page: PagePreview) => {
    if (page.isLocked) return;
    
    if (previewPage?.id === page.id) {
      // Close preview if clicking the same page
      setPreviewPage(null);
    } else {
      // Open new preview with transition
      setIsTransitioning(true);
      setPreviewPage(page);
      
      // Reset transition state after animation completes
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-muted">
              <Image
                src={coverImage}
                alt={`"${title}" pack cover`}
                fill
                className={cn(
                  'object-cover transition-all duration-300',
                  isLocked ? 'blur-sm' : 'blur-0'
                )}
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                  <Icons.lock className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Title and Actions */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
            
            {showProgress && (
              <div className="mt-4 max-w-md">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>{t('packs.details.progress') || 'Progress'}</span>
                  <span>
                    {Math.round(progress)}% {t('packs.details.completeSuffix') || 'Complete'}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {isLocked ? (
                <Button
                  size="lg"
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className="min-w-[180px]"
                >
                  {isUnlocking ? (
                    <>
                      <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                      {t('packs.details.unlocking') || 'Unlocking...'}
                    </>
                  ) : (
                    <>
                      <Icons.unlock className="mr-2 h-4 w-4" />
                      {t('packs.details.unlockPack') || 'Unlock Pack'}
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={onStudy}
                    className="border-cyan-500 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 dark:border-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-900/50 dark:hover:text-cyan-300 min-w-[180px]"
                  >
                    <Icons.bookOpen className="mr-2 h-4 w-4" />
                    {t('packs.details.study') || 'Study'}
                  </Button>
                  <Button
                    size="lg"
                    onClick={onStudyAndColor}
                    className="bg-coral-500 hover:bg-coral-600 dark:bg-coral-600 dark:hover:bg-coral-700 min-w-[180px]"
                  >
                    <Icons.palette className="mr-2 h-4 w-4" />
                    {t('packs.details.studyColor') || 'Study & Color'}
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="lg">
                <Icons.share className="mr-2 h-4 w-4" />
                {t('packs.details.share') || 'Share'}
              </Button>
              
              <Button variant="ghost" size="icon" className="ml-auto">
                <Icons.heart className="h-5 w-5" />
                <span className="sr-only">{t('packs.details.addToFavorites') || 'Add to favorites'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Previews */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">{t('packs.details.pagesInPack') || 'Pages in this pack'}</h2>
        
        {/* Unlocked Pages */}
        {unlockedPages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t('packs.details.availablePages', { available: unlockedPages.length, total: pages.length }) || `Available Pages (${unlockedPages.length}/${pages.length})`}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {unlockedPages.map((page) => (
                <PagePreviewCard
                  key={page.id}
                  page={page}
                  isActive={previewPage?.id === page.id}
                  onClick={() => handlePreview(page)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Locked Pages */}
        {lockedPages.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t('packs.details.lockedPages', { count: lockedPages.length }) || `Locked Pages (${lockedPages.length})`}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {lockedPages.map((page) => (
                <PagePreviewCard
                  key={page.id}
                  page={page}
                  isActive={false}
                  onClick={() => {}}
                />
              ))}
            </div>
            
            {isLocked && (
              <div className="mt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {t('packs.details.unlockFullPackMsg', { count: lockedPages.length }) || `Unlock the full pack to access all ${lockedPages.length} additional pages`}
                </p>
                <Button onClick={handleUnlock} disabled={isUnlocking}>
                  {isUnlocking ? (
                    <>
                      <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                      {t('packs.details.unlocking') || 'Unlocking...'}
                    </>
                  ) : (
                    (t('packs.details.unlockFullPackCta') || 'Unlock Full Pack')
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Preview Modal */}
      {previewPage && (
        <div 
          className={cn(
            'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300',
            isTransitioning ? 'opacity-0' : 'opacity-100'
          )}
          onClick={() => setPreviewPage(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label={t('packs.details.preview.closeAria') || 'Close preview'}
            >
              <Icons.x className="h-6 w-6" />
            </button>
            
            <div className="relative aspect-[16/10] bg-muted rounded-lg overflow-hidden">
              <Image
                src={previewPage.imageUrl}
                alt={previewPage.altText}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 80vw"
              />
            </div>
            
            <div className="mt-4 text-center text-white">
              <p className="text-sm">
                {t('packs.details.preview.closeHint') || 'Click outside or press ESC to close'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type PagePreviewCardProps = {
  page: PagePreview;
  isActive: boolean;
  onClick: () => void;
};

function PagePreviewCard({ page, isActive, onClick }: PagePreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative aspect-[16/10] rounded-md overflow-hidden transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        isActive ? 'ring-2 ring-offset-2 ring-primary' : 'ring-1 ring-border/50',
        page.isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
      )}
      disabled={page.isLocked}
      aria-label={page.isLocked ? 'Locked page' : `Preview: ${page.altText}`}
    >
      <div className="relative w-full h-full">
        <Image
          src={page.imageUrl}
          alt={page.altText}
          fill
          className={cn(
            'object-cover transition-all duration-300',
            page.isLocked ? 'blur-sm' : 'group-hover:scale-105'
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16.66vw"
        />
        
        {page.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <Icons.lock className="h-6 w-6 text-white" />
          </div>
        )}
        
        {!page.isLocked && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity',
            'group-hover:opacity-100 group-focus:opacity-100',
            isActive && 'opacity-100'
          )}>
            <div className="bg-white/90 text-foreground rounded-full p-2 shadow-lg">
              <Icons.zoomIn className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
