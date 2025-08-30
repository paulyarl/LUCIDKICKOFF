'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface PinInputProps {
  length?: number;
  loading?: boolean;
  onComplete: (pin: string) => void;
  error?: string;
  className?: string;
}

export function PinInput({
  length = 6,
  loading = false,
  onComplete,
  error,
  className = '',
}: PinInputProps) {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;
    
    // Update pin array
    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Only take the last character
    setPin(newPin);
    
    // Move to next input if there's a value and not the last input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Check if all inputs are filled
    if (newPin.every(digit => digit !== '') && newPin.length === length) {
      onComplete(newPin.join(''));
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    
    // Only allow digits
    if (!/^\d*$/.test(pastedData)) return;
    
    // Update pin with pasted data
    const newPin = [...pin];
    for (let i = 0; i < pastedData.length && i < length; i++) {
      newPin[i] = pastedData[i];
    }
    setPin(newPin);
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
    
    // If pasted data is complete, trigger onComplete
    if (pastedData.length >= length) {
      onComplete(pastedData.slice(0, length));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={pin[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={loading}
            className={`h-14 w-12 text-center text-2xl font-mono ${
              error ? 'border-destructive' : ''
            }`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
          />
        ))}
      </div>
      
      {loading && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
      
      <p className="text-center text-sm text-muted-foreground">
        Enter your {length}-digit PIN
      </p>
    </div>
  );
}
