'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

type HintBubbleProps = {
  x: number;
  y: number;
  content: string;
  id: string;
  title?: string;
  type?: 'fact' | 'hint' | 'tip';
  className?: string;
  onClose?: (id: string) => void;
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
};

export function HintBubble({
  x,
  y,
  content,
  id,
  title,
  type = 'fact',
  className,
  onClose,
  onPositionChange,
}: HintBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Update position when props change
  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
    
    if (onPositionChange) {
      onPositionChange(id, { x: newX, y: newY });
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add/remove event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Get icon and color based on hint type
  const getTypeInfo = () => {
    switch (type) {
      case 'hint':
        return {
          icon: <Icons.lightbulb className="h-4 w-4" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900/50',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-500',
        };
      case 'tip':
        return {
          icon: <Icons.sparkles className="h-4 w-4" />,
          bgColor: 'bg-purple-100 dark:bg-purple-900/50',
          borderColor: 'border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-800 dark:text-purple-200',
          iconColor: 'text-purple-500',
        };
      case 'fact':
      default:
        return {
          icon: <Icons.info className="h-4 w-4" />,
          bgColor: 'bg-green-100 dark:bg-green-900/50',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-500',
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconColor } = getTypeInfo();

  return (
    <div 
      className={cn(
        'absolute z-50 select-none',
        'transform -translate-x-1/2 -translate-y-1/2',
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      ref={bubbleRef}
      role="button"
      aria-label={`${type} bubble: ${title || 'Click to view details'}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(!isOpen);
        }
      }}
    >
      {/* Bubble button */}
      <button
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
          'transition-all duration-200 transform hover:scale-110',
          bgColor,
          borderColor && 'border',
          borderColor,
          isOpen && 'scale-110',
          isDragging && 'scale-105 shadow-lg'
        )}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-controls={`hint-content-${id}`}
      >
        <span className={iconColor}>
          {icon}
        </span>
      </button>
      
      {/* Content panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`hint-content-${id}`}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 mt-3 w-64 p-4 rounded-lg shadow-xl',
              'border',
              bgColor,
              borderColor,
              'z-50',
              'transform origin-top',
              'focus:outline-none',
              'ring-1 ring-black/5',
              'dark:ring-white/10',
              'backdrop-blur-sm'
            )}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            role="region"
            aria-labelledby={`hint-title-${id}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 
                id={`hint-title-${id}`}
                className={cn('font-medium text-sm uppercase tracking-wider', textColor)}
              >
                {title || type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onClose) onClose(id);
                }}
                className={cn(
                  'p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
                  'transition-colors',
                  textColor
                )}
                aria-label="Close hint"
              >
                <Icons.x className="h-4 w-4" />
              </button>
            </div>
            <p className={cn('text-sm', textColor)}>{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type HintBubblesManagerProps = {
  hints: Array<{
    id: string;
    x: number;
    y: number;
    content: string;
    title?: string;
    type?: 'fact' | 'hint' | 'tip';
  }>;
  visible?: boolean;
  onHintPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onHintRemove?: (id: string) => void;
  className?: string;
};

export function HintBubblesManager({
  hints,
  visible = true,
  onHintPositionChange,
  onHintRemove,
  className,
}: HintBubblesManagerProps) {
  if (!visible) return null;

  return (
    <div className={cn('pointer-events-none', className)}>
      {hints.map((hint) => (
        <HintBubble
          key={hint.id}
          {...hint}
          onPositionChange={onHintPositionChange}
          onClose={onHintRemove}
        />
      ))}
    </div>
  );
}
