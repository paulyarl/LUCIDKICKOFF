'use client';

import React, { useState, useMemo } from 'react';
import { PackCard } from './PackCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Icons } from '../icons';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/provider';

export interface Pack {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  progress?: number;
  isLocked?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  isFavorite?: boolean;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  ratingAvg?: number;
  ratingCount?: number;
}

interface PackGridProps {
  packs: Pack[];
  onPackStudy?: (packId: string) => void;
  onPackStudyAndColor?: (packId: string) => void;
  onPackFavoriteToggle?: (packId: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'title' | 'progress' | 'difficulty' | 'newest' | 'rating' | 'rating_count';
type FilterBy = 'all' | 'favorites' | 'unlocked' | 'locked' | 'completed' | 'in-progress';

export function PackGrid({
  packs,
  onPackStudy,
  onPackStudyAndColor,
  onPackFavoriteToggle,
  className,
}: PackGridProps) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [minRating, setMinRating] = useState<number>(0);
  const [minRatingCount, setMinRatingCount] = useState<number>(0);

  const filteredAndSortedPacks = useMemo(() => {
    let filtered = packs;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((pack) => {
        const matchesSearch =
          pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pack.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pack.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      });
    }

    // Apply category filter
    switch (filterBy) {
      case 'favorites':
        filtered = filtered.filter((pack) => pack.isFavorite);
        break;
      case 'unlocked':
        filtered = filtered.filter((pack) => !pack.isLocked);
        break;
      case 'locked':
        filtered = filtered.filter((pack) => pack.isLocked);
        break;
      case 'completed':
        filtered = filtered.filter((pack) => (pack.progress || 0) >= 100);
        break;
      case 'in-progress':
        filtered = filtered.filter((pack) => (pack.progress || 0) > 0 && (pack.progress || 0) < 100);
        break;
    }

    // Rating filters
    if (minRating > 0 || minRatingCount > 0) {
      filtered = filtered.filter((p) =>
        (p.ratingAvg ?? 0) >= minRating && (p.ratingCount ?? 0) >= minRatingCount
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          return (difficultyOrder[a.difficulty || 'beginner']) - (difficultyOrder[b.difficulty || 'beginner']);
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        case 'rating':
          return (b.ratingAvg || 0) - (a.ratingAvg || 0);
        case 'rating_count':
          return (b.ratingCount || 0) - (a.ratingCount || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [packs, searchQuery, filterBy, sortBy, minRating, minRatingCount]);

  const getFilterCount = (filter: FilterBy) => {
    switch (filter) {
      case 'all':
        return packs.length;
      case 'favorites':
        return packs.filter((pack) => pack.isFavorite).length;
      case 'unlocked':
        return packs.filter((pack) => !pack.isLocked).length;
      case 'locked':
        return packs.filter((pack) => pack.isLocked).length;
      case 'completed':
        return packs.filter((pack) => (pack.progress || 0) >= 100).length;
      case 'in-progress':
        return packs.filter((pack) => (pack.progress || 0) > 0 && (pack.progress || 0) < 100).length;
      default:
        return 0;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{t('packs.title') || 'Packs'}</h2>
          <Badge variant="secondary">{filteredAndSortedPacks.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Icons.grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <Icons.list className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort Dropdown */}
          <select
            data-testid="packs-sort"
            aria-label="Sort packs"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="title">{t('packs.sort.title') || 'Sort by Title'}</option>
            <option value="progress">{t('packs.sort.progress') || 'Sort by Progress'}</option>
            <option value="difficulty">{t('packs.sort.difficulty') || 'Sort by Difficulty'}</option>
            <option value="newest">{t('packs.sort.newest') || 'Sort by Newest'}</option>
            <option value="rating">{t('packs.sort.rating') || 'Sort by Rating'}</option>
            <option value="rating_count">{t('packs.sort.ratingCount') || 'Sort by Rating Count'}</option>
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('packs.search.placeholder') || 'Search packs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2" data-testid="packs-filter" role="group" aria-label="Filters">
          {/* Filter Buttons */}
          <button
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              filterBy === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
            onClick={() => setFilterBy('all')}
          >
            {t('packs.filters.all') || 'All'}
          </button>
          <button
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              filterBy === 'favorites' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
            onClick={() => setFilterBy('favorites')}
          >
            {t('packs.filters.favorites') || 'Favorites'}
          </button>
          <button
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              filterBy === 'unlocked' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
            onClick={() => setFilterBy('unlocked')}
          >
            {t('packs.filters.unlocked') || 'Unlocked'}
          </button>
          <button
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              filterBy === 'locked' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
            onClick={() => setFilterBy('locked')}
          >
            {t('packs.filters.locked') || 'Locked'}
          </button>
          <button
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              filterBy === 'completed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
            onClick={() => setFilterBy('completed')}
          >
            {t('packs.filters.completed') || 'Completed'}
          </button>
          <button
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              filterBy === 'in-progress' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
            onClick={() => setFilterBy('in-progress')}
          >
            {t('packs.filters.inProgress') || 'In Progress'}
          </button>
          {/* Rating filters */}
          <div className="ml-2 flex items-center gap-2">
            <label className="text-xs text-muted-foreground">{t('packs.filters.minRating') || 'Min Rating'}</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value={0}>0</option>
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={5}>5</option>
            </select>
            <label className="text-xs text-muted-foreground">{t('packs.filters.minRatings') || '# Ratings'}</label>
            <select
              value={minRatingCount}
              onChange={(e) => setMinRatingCount(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value={0}>0+</option>
              <option value={5}>5+</option>
              <option value={10}>10+</option>
              <option value={25}>25+</option>
              <option value={50}>50+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pack Grid/List */}
      {filteredAndSortedPacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icons.packageOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('packs.empty.title') || 'No packs found'}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || filterBy !== 'all'
              ? (t('packs.empty.adjust') || 'Try adjusting your search or filters')
              : (t('packs.empty.none') || 'No packs available at the moment')}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'space-y-4'
          )}
        >
          {filteredAndSortedPacks.map((pack) => (
            <PackCard
              key={pack.id}
              id={pack.id}
              title={pack.title}
              description={pack.description}
              imageUrl={pack.imageUrl}
              progress={pack.progress}
              isLocked={pack.isLocked}
              isNew={pack.isNew}
              isTrending={pack.isTrending}
              isFavorite={pack.isFavorite}
              onStudy={onPackStudy}
              onStudyAndColor={onPackStudyAndColor}
              onFavoriteToggle={onPackFavoriteToggle}
              variant={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
