import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type DashboardHeroProps = {
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function DashboardHero({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  className,
}: DashboardHeroProps) {
  return (
    <section 
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 p-6 md:p-8 lg:p-12',
        'border border-border/50',
        className
      )}
      aria-labelledby="dashboard-hero-title"
    >
      <div className="relative z-10 max-w-3xl">
        <h1 
          id="dashboard-hero-title"
          className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          {subtitle}
        </p>
        
        <div className="mt-8 flex flex-wrap gap-4">
          {primaryAction && (
            <Button 
              size="lg" 
              className="group relative overflow-hidden"
              onClick={primaryAction.onClick}
            >
              <span className="relative z-10 flex items-center">
                {primaryAction.icon && (
                  <span className="mr-2">{primaryAction.icon}</span>
                )}
                {primaryAction.label}
              </span>
              <span 
                className="absolute inset-0 -z-0 bg-gradient-to-r from-primary/80 to-primary/60 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </Button>
          )}
          
          {secondaryAction && (
            <Button 
              variant="outline" 
              size="lg"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div 
        className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" 
        aria-hidden="true"
      />
      <div 
        className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" 
        aria-hidden="true"
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
    </section>
  );
}
