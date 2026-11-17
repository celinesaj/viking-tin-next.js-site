'use client';

import { useEffect, useState } from 'react';
import AgeGate from './AgeGate';
import { getAgeVerified, setAgeVerified } from '@/lib/age-gate';

type AgeGateProviderProps = {
  children: React.ReactNode;
};

function shouldSkipAgeGate(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/dashboard');
}

export default function AgeGateProvider({ children }: AgeGateProviderProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (shouldSkipAgeGate()) {
      setIsVerified(true);
      return;
    }
    setIsVerified(getAgeVerified());
  }, []);

  const handleConfirm = () => {
    setAgeVerified(true);
    setIsVerified(true);
  };

  const handleReject = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <>
      {children}
      {isVerified === false && (
        <AgeGate onConfirm={handleConfirm} onReject={handleReject} />
      )}
    </>
  );
}