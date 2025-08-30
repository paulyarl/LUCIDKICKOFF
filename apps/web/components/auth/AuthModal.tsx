'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignInForm } from './SignInForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useI18n } from '@/lib/i18n/provider';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { t } = useI18n();

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return t('auth.signin.title') || 'Sign In';
      case 'signup':
        return t('auth.signup.title') || 'Create Account';
      case 'forgot-password':
        return t('auth.forgot.title') || 'Reset Password';
      default:
        return t('auth.title') || 'Authentication';
    }
  };

  const handleToggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
  };

  const handleBackToSignIn = () => {
    setMode('signin');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {mode === 'signin' && (
            <SignInForm
              onToggleMode={handleToggleMode}
              onForgotPassword={handleForgotPassword}
            />
          )}
          {mode === 'signup' && (
            <SignupForm onToggleMode={handleToggleMode} />
          )}
          {mode === 'forgot-password' && (
            <ForgotPasswordForm onBackToSignIn={handleBackToSignIn} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
