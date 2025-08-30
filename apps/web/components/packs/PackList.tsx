'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Icons } from '@/components/icons';
import { PackCard } from './PackCard';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/provider';

type Pack = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  progress?: number;
  isLocked?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  isFavorite?: boolean;
};

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'trending' | 'new' | 'popular' | 'favorites';

export function PackList({
  packs = [],
  title,
  description,
  className,
  showFilters = false,
  showViewToggle = true,
  maxItems,
}: {
  packs: Pack[];
  title: string;
  description?: string;
  className?: string;
  showFilters?: boolean;
  showViewToggle?: boolean;
  maxItems?: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get view mode from URL or default to 'grid'
  const view = (searchParams.get('view') as ViewMode) || 'grid';
  // Get filter from URL or default to 'all'
  const filter = (searchParams.get('filter') as FilterType) || 'all';

  // Filter and limit packs
  const filteredPacks = React.useMemo(() => {
    let result = [...packs];

    // Apply filters
    if (filter === 'trending') {
      result = result.filter((pack) => pack.isTrending);
    } else if (filter === 'new') {
      result = result.filter((pack) => pack.isNew);
    } else if (filter === 'favorites') {
      result = result.filter((pack) => pack.isFavorite);
    } else if (filter === 'popular') {
      // Sort by some popularity metric (e.g., views, downloads)
      result = [...result].sort((a, b) => (b.progress || 0) - (a.progress || 0));
    }

    // Limit the number of items if maxItems is specified
    if (maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [packs, filter, maxItems]);

  // Update URL with new view mode or filter
  const updateParams = (updates: { view?: ViewMode; filter?: FilterType }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.view) params.set('view', updates.view);
    if (updates.filter) params.set('filter', updates.filter);
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle pack actions
  const handleFavoriteToggle = (packId: string) => {
    console.log('Toggle favorite for pack:', packId);
    // Implement favorite toggle logic
  };

  const handleStudy = (packId: string) => {
    console.log('Study pack:', packId);
    // Navigate to study mode
    router.push(`/packs/${packId}/study`);
  };

  const handleStudyAndColor = (packId: string) => {
    console.log('Study and color pack:', packId);
    // Navigate to study and color mode
    router.push(`/packs/${packId}/color`);
  };

  // If no packs after filtering, show empty state
  if (filteredPacks.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Icons.packageOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{t('packs.empty.title') || 'No packs found'}</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {filter === 'favorites' 
            ? (t('packs.list.empty.favorites') || "You haven't favorited any packs yet.")
            : (t('packs.list.empty.generic') || 'Try adjusting your filters or check back later for new content.')}
        </p>
      </div>
    );
  }

  return (
    <section className={cn('space-y-4', className)} aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="text-xl font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {['all', 'trending', 'new', 'popular', 'favorites'].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams({ filter: filterType as FilterType })}
                  className="capitalize"
                >
                  {filterType === 'all' && (t('packs.list.filters.all') || 'All')}
                  {filterType === 'trending' && (t('packs.list.filters.trending') || 'Trending')}
                  {filterType === 'new' && (t('packs.list.filters.new') || 'New')}
                  {filterType === 'popular' && (t('packs.list.filters.popular') || 'Popular')}
                  {filterType === 'favorites' && (t('packs.list.filters.favorites') || 'Favorites')}
                </Button>
              ))}
            </div>
          )}

          {showViewToggle && (
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) => updateParams({ view: value as ViewMode })}
              className="ml-2"
              aria-label={t('packs.list.view') || 'View mode'}
            >
              <ToggleGroupItem value="grid" aria-label={t('packs.list.view.grid') || 'Grid view'}>
                <Icons.grid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={t('packs.list.view.list') || 'List view'}>
                <Icons.list className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div
          className={cn(
            'grid gap-4 pb-4',
            view === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1',
            'min-w-full'
          )}
        >
          {filteredPacks.map((pack) => (
            <PackCard
              key={pack.id}
              variant={view}
              onFavoriteToggle={handleFavoriteToggle}
              onStudy={handleStudy}
              onStudyAndColor={handleStudyAndColor}
              {...pack}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
