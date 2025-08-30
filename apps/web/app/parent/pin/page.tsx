'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

export default function PinPage() {
  const { t } = useI18n();
  const [pin, setPin] = useState<string[]>(Array(4).fill(''));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(4).fill(''));
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const router = useRouter();

  const handlePinChange = (index: number, value: string) => {
    if (step === 'create') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
      
      if (newPin.every(digit => digit !== '')) {
        setStep('confirm');
        // Focus first confirm input
        setTimeout(() => {
          const firstConfirmInput = document.getElementById('confirm-0') as HTMLInputElement;
          if (firstConfirmInput) firstConfirmInput.focus();
        }, 50);
      }
    } else {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`confirm-${index + 1}`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'create') {
      setStep('confirm');
    } else {
      // Verify pins match
      if (pin.join('') === confirmPin.join('')) {
        // In a real app, you would save the PIN here
        alert('PIN set successfully!');
        router.push('/parent');
      } else {
        alert('PINs do not match. Please try again.');
        setPin(Array(4).fill(''));
        setConfirmPin(Array(4).fill(''));
        setStep('create');
      }
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 border rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {step === 'create' ? (t('parent.pin.createTitle') || 'Create a 4-digit PIN') : (t('parent.pin.confirmTitle') || 'Confirm your PIN')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === 'create' 
              ? (t('parent.pin.createSubtitle') || 'This will be used to access parent controls.')
              : (t('parent.pin.confirmSubtitle') || 'Please re-enter your PIN to confirm.')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-4">
            {(step === 'create' ? pin : confirmPin).map((digit, index) => (
              <input
                key={index}
                id={`${step === 'create' ? 'pin' : 'confirm'}-${index}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  handlePinChange(index, value);
                }}
                className="w-16 h-16 text-2xl text-center border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label={t('parent.pin.digitAria', { index: index + 1 }) || `Digit ${index + 1} of your PIN`}
              />
            ))}
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={step === 'create' 
                ? !pin.every(digit => digit !== '')
                : !confirmPin.every(digit => digit !== '')}
            >
              {step === 'create' ? (t('btn.continue') || 'Continue') : (t('parent.pin.confirmCta') || 'Confirm PIN')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
