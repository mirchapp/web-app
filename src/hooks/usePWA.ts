'use client';

import { useEffect, useState } from 'react';

export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Detect if running as PWA
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        nav.standalone === true;
    setIsPWA(isStandalone);
  }, []);

  return isPWA;
}
