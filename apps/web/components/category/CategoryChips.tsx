'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type Category = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
};

type CategoryChipsProps = {
  categories: Category[];
  defaultCategory?: string;
  showCounts?: boolean;
  className?: string;
  scrollable?: boolean;
};

export function CategoryChips({
  categories,
  defaultCategory = 'all',
  showCounts = true,
  className,
  scrollable = true,
}: CategoryChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get current category from URL or use default
  useEffect(() => {
    const category = searchParams.get('category') || defaultCategory;
    setSelectedCategory(category);
  }, [searchParams, defaultCategory]);

  // Update scroll buttons visibility
  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowScrollLeft(scrollLeft > 0);
    setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    
    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  // Scroll left/right
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = direction === 'left' ? -200 : 200;
    scrollContainerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  // Update URL with selected category
  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (categoryId === defaultCategory) {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    
    // Reset pagination when changing categories
    params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={cn('relative', className)}>
      {scrollable && showScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full shadow-md border hover:bg-accent transition-colors"
          aria-label="Scroll left"
        >
          <Icons.chevronLeft className="h-4 w-4" />
        </button>
      )}
      
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide',
          scrollable ? 'px-8' : 'px-0',
          scrollable ? 'snap-x' : 'flex-wrap'
        )}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'rounded-full px-4 py-1 h-auto text-sm font-medium whitespace-nowrap',
                'transition-all duration-200',
                'flex items-center gap-2',
                isSelected 
                  ? 'bg-primary/90 hover:bg-primary shadow-sm' 
                  : 'bg-background hover:bg-accent hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'border-border/50',
                'snap-start' // For better mobile scrolling
              )}
              onClick={() => handleCategoryChange(category.id)}
              aria-pressed={isSelected}
            >
              {category.icon && (
                <span className={cn(
                  'flex-shrink-0',
                  isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                )}>
                  {category.icon}
                </span>
              )}
              <span>{category.label}</span>
              {showCounts && category.count !== undefined && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isSelected 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {category.count.toLocaleString()}
                </span>
              )}
            </Button>
          );
        })}
      </div>
      
      {scrollable && showScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full shadow-md border hover:bg-accent transition-colors"
          aria-label="Scroll right"
        >
          <Icons.chevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
