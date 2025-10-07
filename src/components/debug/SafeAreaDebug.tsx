'use client';

import * as React from 'react';
import { useSafeArea } from '@/hooks/useSafeArea';

/**
 * Debug component to visualize safe area insets in PWA
 * Only shows in development or when ?debug=1 is in URL
 */
export function SafeAreaDebug() {
  const [show, setShow] = React.useState(false);
  const safeAreaInsets = useSafeArea();
  const [isPWA, setIsPWA] = React.useState(false);
  const [viewportHeight, setViewportHeight] = React.useState(0);

  React.useEffect(() => {
    // Check if debug mode is enabled
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === '1' || process.env.NODE_ENV === 'development';
    setShow(debugMode);

    // Detect PWA
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    setIsPWA(isStandalone);

    // Get viewport height
    setViewportHeight(window.innerHeight);

    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/90 text-white text-xs p-3 rounded-lg font-mono pointer-events-none max-w-[200px]">
      <div className="font-bold mb-2 text-green-400">Safe Area Debug</div>
      <div>Mode: {isPWA ? 'PWA' : 'Browser'}</div>
      <div>VH: {viewportHeight}px</div>
      <div className="mt-2 border-t border-white/20 pt-2">
        <div>Top: {safeAreaInsets.top}px</div>
        <div>Right: {safeAreaInsets.right}px</div>
        <div>Bottom: {safeAreaInsets.bottom}px</div>
        <div>Left: {safeAreaInsets.left}px</div>
      </div>
    </div>
  );
}

