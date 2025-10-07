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
      // Create a test element to measure actual env() values
      const testElement = document.createElement('div');
      testElement.style.position = 'fixed';
      testElement.style.top = '0';
      testElement.style.left = '0';
      testElement.style.width = '1px';
      testElement.style.height = '1px';
      testElement.style.visibility = 'hidden';
      testElement.style.pointerEvents = 'none';
      testElement.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      testElement.style.paddingRight = 'env(safe-area-inset-right, 0px)';
      testElement.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
      testElement.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
      
      document.body.appendChild(testElement);
      
      const computedStyles = getComputedStyle(testElement);
      const top = parseInt(computedStyles.paddingTop) || 0;
      const right = parseInt(computedStyles.paddingRight) || 0;
      const bottom = parseInt(computedStyles.paddingBottom) || 0;
      const left = parseInt(computedStyles.paddingLeft) || 0;
      
      document.body.removeChild(testElement);

      setSafeAreaInsets({ top, right, bottom, left });
    };

    // Initial update - delay slightly to ensure DOM is ready
    const initialTimeout = setTimeout(updateSafeAreaInsets, 100);

    // Update on resize and orientation change
    window.addEventListener('resize', updateSafeAreaInsets);
    window.addEventListener('orientationchange', updateSafeAreaInsets);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener('resize', updateSafeAreaInsets);
      window.removeEventListener('orientationchange', updateSafeAreaInsets);
    };
  }, []);

  return safeAreaInsets;
}
