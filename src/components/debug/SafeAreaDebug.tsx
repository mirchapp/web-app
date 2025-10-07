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
  const [screenHeight, setScreenHeight] = React.useState(0);
  const [documentHeight, setDocumentHeight] = React.useState(0);
  const [bodyHeight, setBodyHeight] = React.useState(0);
  const [cssVars, setCssVars] = React.useState({ top: '0', bottom: '0' });

  React.useEffect(() => {
    // Always show in development
    setShow(true);

    // Detect PWA
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    setIsPWA(isStandalone);

    // Get all height measurements
    const updateMeasurements = () => {
      setViewportHeight(window.innerHeight);
      setScreenHeight(window.screen.height);
      setDocumentHeight(document.documentElement.clientHeight);
      setBodyHeight(document.body.clientHeight);
      
      // Get CSS variables
      const rootStyles = getComputedStyle(document.documentElement);
      setCssVars({
        top: rootStyles.getPropertyValue('--safe-area-inset-top').trim() || '0',
        bottom: rootStyles.getPropertyValue('--safe-area-inset-bottom').trim() || '0'
      });
    };

    updateMeasurements();
    const handleResize = () => updateMeasurements();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/90 text-white text-[10px] p-3 rounded-lg font-mono pointer-events-none max-w-[250px]">
      <div className="font-bold mb-2 text-green-400">Viewport Debug</div>
      <div className="space-y-1">
        <div>Mode: {isPWA ? 'PWA' : 'Browser'}</div>
        <div>window.innerHeight: {viewportHeight}px</div>
        <div>screen.height: {screenHeight}px</div>
        <div>document.clientHeight: {documentHeight}px</div>
        <div>body.clientHeight: {bodyHeight}px</div>
        <div className="mt-2 pt-2 border-t border-white/20">
          <div>Safe Area (hook):</div>
          <div className="pl-2">T: {safeAreaInsets.top}px, B: {safeAreaInsets.bottom}px</div>
          <div>CSS Variables:</div>
          <div className="pl-2">T: {cssVars.top}, B: {cssVars.bottom}</div>
        </div>
      </div>
      {/* Visual indicators */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-red-500 pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-blue-500 pointer-events-none" />
    </div>
  );
}

