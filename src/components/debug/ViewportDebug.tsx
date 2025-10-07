'use client';

import * as React from 'react';

export function ViewportDebug() {
  const [measurements, setMeasurements] = React.useState({
    innerHeight: 0,
    innerWidth: 0,
    screenHeight: 0,
    screenWidth: 0,
    availHeight: 0,
    documentHeight: 0,
    bodyHeight: 0,
    viewportMeta: '',
    userAgent: '',
    standalone: false,
    displayMode: '',
  });

  React.useEffect(() => {
    const update = () => {
      const viewportTag = document.querySelector('meta[name="viewport"]');
      const nav = window.navigator as Navigator & { standalone?: boolean };
      
      setMeasurements({
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
        availHeight: window.screen.availHeight,
        documentHeight: document.documentElement.clientHeight,
        bodyHeight: document.body.clientHeight,
        viewportMeta: viewportTag?.getAttribute('content') || 'none',
        userAgent: navigator.userAgent,
        standalone: nav.standalone === true,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    
    // Update after a delay to catch any async changes
    setTimeout(update, 100);
    setTimeout(update, 500);
    
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return (
    <>
      {/* Visual rulers */}
      <div className="fixed top-0 left-0 w-full h-[1px] bg-red-500 z-[10000]" />
      <div className="fixed bottom-0 left-0 w-full h-[1px] bg-blue-500 z-[10000]" />
      <div className="fixed left-0 top-0 h-full w-[1px] bg-green-500 z-[10000]" />
      <div className="fixed right-0 top-0 h-full w-[1px] bg-yellow-500 z-[10000]" />
      
      {/* Measurements overlay */}
      <div className="fixed top-2 left-2 z-[10001] bg-black/90 text-white p-2 rounded text-[10px] font-mono max-w-[300px]">
        <div className="text-yellow-300 font-bold mb-1">Viewport Debug</div>
        <div>Mode: {measurements.displayMode} / {measurements.standalone ? 'iOS standalone' : 'not standalone'}</div>
        <div>innerH: {measurements.innerHeight}px</div>
        <div>screenH: {measurements.screenHeight}px</div>
        <div>availH: {measurements.availHeight}px</div>
        <div>docH: {measurements.documentHeight}px</div>
        <div>bodyH: {measurements.bodyHeight}px</div>
        <div className="mt-1 text-[9px] opacity-70">
          <div>viewport: {measurements.viewportMeta.substring(0, 50)}...</div>
        </div>
        
        {/* Gap indicator */}
        {measurements.screenHeight - measurements.innerHeight > 0 && (
          <div className="mt-1 text-red-400">
            Gap: {measurements.screenHeight - measurements.innerHeight}px
          </div>
        )}
      </div>
      
      {/* Bottom gap visualizer */}
      <div 
        className="fixed left-0 right-0 bg-red-500/30 z-[9999]"
        style={{
          bottom: 0,
          height: `${Math.max(0, measurements.screenHeight - measurements.innerHeight)}px`
        }}
      >
        <div className="text-center text-white text-xs pt-1">
          Bottom Gap: {measurements.screenHeight - measurements.innerHeight}px
        </div>
      </div>
    </>
  );
}
