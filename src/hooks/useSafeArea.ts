'use client';

import { useEffect, useState } from 'react';

export function useSafeArea() {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeAreaInsets = () => {
      // Get computed styles from the root element
      const rootStyles = getComputedStyle(document.documentElement);
      
      // Extract safe area inset values
      const top = parseInt(rootStyles.getPropertyValue('--safe-area-inset-top') || '0', 10);
      const right = parseInt(rootStyles.getPropertyValue('--safe-area-inset-right') || '0', 10);
      const bottom = parseInt(rootStyles.getPropertyValue('--safe-area-inset-bottom') || '0', 10);
      const left = parseInt(rootStyles.getPropertyValue('--safe-area-inset-left') || '0', 10);

      setSafeAreaInsets({ top, right, bottom, left });
    };

    // Initial update
    updateSafeAreaInsets();

    // Update on resize and orientation change
    window.addEventListener('resize', updateSafeAreaInsets);
    window.addEventListener('orientationchange', updateSafeAreaInsets);

    // Also try to detect safe areas using CSS env() if available
    const testElement = document.createElement('div');
    testElement.style.position = 'fixed';
    testElement.style.top = 'env(safe-area-inset-top)';
    testElement.style.right = 'env(safe-area-inset-right)';
    testElement.style.bottom = 'env(safe-area-inset-bottom)';
    testElement.style.left = 'env(safe-area-inset-left)';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);

    const computedStyles = getComputedStyle(testElement);
    const detectedInsets = {
      top: parseInt(computedStyles.top) || 0,
      right: parseInt(computedStyles.right) || 0,
      bottom: parseInt(computedStyles.bottom) || 0,
      left: parseInt(computedStyles.left) || 0,
    };

    document.body.removeChild(testElement);

    // Use detected values if they're different from CSS variables
    if (detectedInsets.bottom > 0 || detectedInsets.top > 0) {
      setSafeAreaInsets(detectedInsets);
    }

    return () => {
      window.removeEventListener('resize', updateSafeAreaInsets);
      window.removeEventListener('orientationchange', updateSafeAreaInsets);
    };
  }, []);

  return safeAreaInsets;
}
