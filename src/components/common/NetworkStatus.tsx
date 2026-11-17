'use client';

import { useEffect, useState } from 'react';
import { WifiOff, AlertTriangle, X } from 'lucide-react';

type ConnectionType = 'slow' | 'offline' | 'online';

export default function NetworkStatus() {
  const [status, setStatus] = useState<ConnectionType>('online');
  const [showSlowWarning, setShowSlowWarning] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check initial online status
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setStatus('offline');
    }

    // Slow connection detection using Network Information API
    const connection = (navigator as any).connection;
    const updateSlowStatus = () => {
      if (!connection) return;
      const effectiveType = connection.effectiveType;
      const isSlow = effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
      if (isSlow && navigator.onLine && status !== 'offline') {
        setStatus('slow');
      } else if (!isSlow && status === 'slow' && navigator.onLine) {
        setStatus('online');
      }
    };

    if (connection) {
      updateSlowStatus();
      connection.addEventListener('change', updateSlowStatus);
      return () => {
        connection.removeEventListener('change', updateSlowStatus);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [status]);

  // Don't show anything if online and not slow
  if (status === 'online') return null;
  if (status === 'slow' && !showSlowWarning) return null;

  const isOffline = status === 'offline';

  return (
    <div
      className={`sticky top-0 z-50 flex w-full items-center justify-between gap-3 px-4 py-2 text-sm font-medium shadow-md ${
        isOffline ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOffline ? (
          <WifiOff size={18} />
        ) : (
          <AlertTriangle size={18} />
        )}
        <span>
          {isOffline
            ? 'No internet connection. Please check your network.'
            : 'Your internet connection appears slow. Some features may load slowly.'}
        </span>
      </div>
      {!isOffline && (
        <button
          onClick={() => setShowSlowWarning(false)}
          className="rounded-full p-1 hover:bg-black/10"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}