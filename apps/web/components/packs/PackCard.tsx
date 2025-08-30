import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icons } from '../icons';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/provider';

type PackCardProps = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  progress?: number;
  isLocked?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onStudy?: (id: string) => void;
  onStudyAndColor?: (id: string) => void;
  className?: string;
  variant?: 'grid' | 'list';
};

export function PackCard({
  id,
  title,
  description,
  imageUrl,
  progress = 0,
  isLocked = false,
  isNew = false,
  isTrending = false,
  isFavorite = false,
  onFavoriteToggle,
  onStudy,
  onStudyAndColor,
  className,
  variant = 'grid',
}: PackCardProps) {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const isList = variant === 'list';
  const aspectRatio = isList ? 'aspect-video' : 'aspect-[16/10]';
  const showProgress = progress > 0 && progress < 100;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md',
        isList ? 'flex-row h-48' : 'h-full',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-labelledby={`pack-${id}-title`}
      aria-describedby={`pack-${id}-desc`}
    >
      {/* Image Container */}
      <div
        className={cn(
          'relative overflow-hidden bg-muted',
          isList ? 'w-1/3' : 'w-full',
          aspectRatio
        )}
      >
        <Image
          src={imageUrl}
          alt={`"${title}"`}
          fill
          className={cn(
            'object-cover transition-all duration-300',
            isLocked && !isHovered ? 'blur-sm' : 'blur-0',
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsImageLoaded(true)}
          sizes={isList ? '33vw' : '(max-width: 768px) 75vw, 25vw'}
          priority={isTrending}
        />
        
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity">
            <Icons.lock className="h-8 w-8 text-white" />
          </div>
        )}
        
        {isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            {t('packs.card.new') || 'New'}
          </span>
        )}
        
        {onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteToggle(id);
            }}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
            aria-label={isFavorite ? (t('packs.card.favorite.remove') || 'Remove from favorites') : (t('packs.card.favorite.add') || 'Add to favorites')}
          >
            <Icons.heart
              className={cn(
                'h-5 w-5',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground/50'
              )}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex flex-1 flex-col p-4', isList ? 'w-2/3' : 'w-full')}>
        <div className="flex-1">
          <h3
            id={`pack-${id}-title`}
            className="line-clamp-2 font-medium leading-tight text-foreground"
          >
            {title}
          </h3>
          <p
            id={`pack-${id}-desc`}
            className="mt-1 line-clamp-2 text-sm text-muted-foreground"
          >
            {description}
          </p>
        </div>

        {showProgress && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('packs.card.progress') || 'Progress'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {isLocked ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault();
                onStudy?.(id);
              }}
            >
              <Icons.lock className="mr-2 h-4 w-4" />
              {t('packs.card.unlock') || 'Unlock Pack'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-cyan-500 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 dark:border-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-900/50 dark:hover:text-cyan-300"
                onClick={(e) => {
                  e.preventDefault();
                  onStudy?.(id);
                }}
              >
                <Icons.bookOpen className="mr-2 h-4 w-4" />
                {t('packs.card.study') || 'Study'}
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-coral-500 text-white hover:bg-coral-600 dark:bg-coral-600 dark:hover:bg-coral-700"
                onClick={(e) => {
                  e.preventDefault();
                  onStudyAndColor?.(id);
                }}
              >
                <Icons.palette className="mr-2 h-4 w-4" />
                {t('packs.card.studyColor') || 'Study & Color'}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Accessibility: Make the entire card clickable but hide the link visually */}
      <Link 
        href={`/packs/${id}`} 
        className="absolute inset-0 z-0 focus:outline-none"
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className="sr-only">{t('packs.card.viewDetails', { title }) || `View ${title} pack details`}</span>
      </Link>
    </article>
  );
}
