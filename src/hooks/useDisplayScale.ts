import { useEffect, useState } from 'react';

/**
 * Hook to detect and normalize Windows display scaling
 * Windows scaling (125%, 150%, etc.) can cause UI elements to appear larger
 * This hook normalizes the display to always render at 100% scale
 * 
 * How it works:
 * - Detects Windows scaling via devicePixelRatio (125% = 1.25, 150% = 1.5, etc.)
 * - Applies inverse CSS zoom to normalize back to 100%
 * - Only applies to common Windows scaling ratios to avoid affecting high-DPI displays
 * 
 * Note: CSS zoom is supported in Chrome, Edge, and Safari. Firefox users will see
 * the default browser scaling behavior.
 */

// Function to detect browser zoom level - aggressive detection for Chrome
const getBrowserZoom = (): number => {
  // Method 1: Create a test element to measure actual zoom (most accurate for Chrome)
  try {
    if (document.body) {
      // Create a hidden test element with known dimensions
      const testElement = document.createElement('div');
      testElement.style.cssText = 'width:100px;height:100px;position:absolute;top:-9999px;left:-9999px;visibility:hidden;pointer-events:none;margin:0;padding:0;border:none;box-sizing:border-box;';
      document.body.appendChild(testElement);
      
      // Force multiple reflows to ensure accurate measurement
      void testElement.offsetWidth;
      void testElement.offsetHeight;
      void document.body.offsetWidth;
      
      const rect = testElement.getBoundingClientRect();
      const actualWidth = rect.width;
      document.body.removeChild(testElement);
      
      if (actualWidth > 0) {
        const zoom = 100 / actualWidth;
        console.log('[DisplayScale] Test element - expected: 100px, actual:', actualWidth.toFixed(2), 'px, detected zoom:', zoom.toFixed(3));
        
        // Return zoom if it's in a reasonable range (0.25 to 5.0)
        // Be more lenient - accept any value that's not exactly 1.0
        if (zoom > 0.25 && zoom < 5) {
          return zoom;
        }
      }
    }
  } catch (e) {
    console.log('[DisplayScale] Test element method failed:', e);
  }
  
  // Method 2: Use window.devicePixelRatio (can indicate browser zoom in some cases)
  const devicePixelRatio = window.devicePixelRatio || 1;
  console.log('[DisplayScale] devicePixelRatio:', devicePixelRatio);
  
  // Method 3: Compare outer/inner width (less reliable but sometimes works)
  if (window.outerWidth && window.innerWidth && window.outerWidth > 0 && window.innerWidth > 0) {
    const ratio = window.outerWidth / window.innerWidth;
    console.log('[DisplayScale] outer/inner width ratio:', ratio.toFixed(3));
    if (ratio > 0.25 && ratio < 5 && Math.abs(ratio - 1) > 0.01) {
      return ratio;
    }
  }
  
  console.log('[DisplayScale] No zoom detected, defaulting to 100%');
  return 1; // Default to 100%
};

// Function to calculate and apply scale (can be called outside React)
export const applyDisplayScale = () => {
  // Wait for DOM to be ready
  if (!document.documentElement) {
    return 1;
  }
  
  // Get browser zoom level (user's browser zoom setting)
  const browserZoom = getBrowserZoom();
  
  // Get the device pixel ratio (Windows display scaling)
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  let normalizedScale = 1;
  
  // Strategy: Always normalize browser zoom if detected
  // Browser zoom is what the user sees in the browser (125%, 150%, etc.)
  
  // Strategy: Always normalize browser zoom first, then handle Windows scaling
  // Step 1: Handle browser zoom (the main issue shown in images)
  if (browserZoom !== 1 && browserZoom > 0.25 && browserZoom < 5) {
    // Browser is zoomed - normalize it back to 100%
    normalizedScale = 1 / browserZoom;
    console.log('[DisplayScale] Normalizing browser zoom:', browserZoom, '→', normalizedScale);
  }
  
  // Step 2: Handle Windows display scaling (only if browser zoom is at 100%)
  // High-DPI displays usually have devicePixelRatio >= 2.5, which we don't want to scale
  if (devicePixelRatio > 1 && devicePixelRatio <= 2.0 && browserZoom === 1) {
    // Only apply Windows scaling normalization if browser zoom is at 100%
    normalizedScale = 1 / devicePixelRatio;
    console.log('[DisplayScale] Normalizing Windows scaling:', devicePixelRatio, '→', normalizedScale);
  }
  
  // Debug logging - always log to help debug
  console.log('[DisplayScale]', {
    browserZoom: `${(browserZoom * 100).toFixed(0)}%`,
    devicePixelRatio: devicePixelRatio.toFixed(2),
    normalizedScale: normalizedScale.toFixed(3),
    finalZoom: `${(normalizedScale * 100).toFixed(0)}%`,
    action: normalizedScale !== 1 ? 'Applying normalization' : 'No scaling needed'
  });
  
  // Apply the scale using CSS zoom (Chrome supports this well)
  const root = document.documentElement;
  const body = document.body;
  
  if (normalizedScale !== 1 && normalizedScale > 0.1 && normalizedScale < 10) {
    const zoomValue = normalizedScale.toString();
    
    console.log('[DisplayScale] Attempting to apply zoom:', zoomValue);
    
    // Method 1: Direct assignment (most reliable in Chrome)
    (root as any).style.zoom = zoomValue;
    root.style.setProperty('zoom', zoomValue, 'important');
    
    // Method 2: Also set on body as backup
    if (body) {
      (body as any).style.zoom = zoomValue;
    }
    
    // Force multiple reflows to ensure it takes effect
    void root.offsetWidth;
    void root.offsetHeight;
    void root.scrollTop;
    if (body) {
      void body.offsetWidth;
      void body.offsetHeight;
    }
    
    // Wait a tick and verify
    setTimeout(() => {
      const computedZoom = window.getComputedStyle(root).zoom;
      const inlineZoom = (root as any).style.zoom;
      console.log('[DisplayScale] Zoom verification - inline:', inlineZoom, 'computed:', computedZoom);
      
      // If zoom didn't apply, try transform as fallback
      if ((!computedZoom || computedZoom === '1' || computedZoom === 'normal') && (!inlineZoom || inlineZoom === '1' || inlineZoom === '')) {
        console.log('[DisplayScale] CSS zoom failed, applying transform scale as fallback');
        if (body) {
          body.style.setProperty('transform', `scale(${zoomValue})`, 'important');
          body.style.setProperty('transform-origin', 'top left', 'important');
          body.style.setProperty('width', `${(100 / normalizedScale).toFixed(2)}%`, 'important');
          body.style.setProperty('height', `${(100 / normalizedScale).toFixed(2)}%`, 'important');
          void body.offsetWidth; // Force reflow
        }
      }
    }, 0);
    
    console.log('[DisplayScale] Zoom applied:', zoomValue);
  } else {
    // At 100%, ensure no scaling is applied
    console.log('[DisplayScale] No scaling needed (100%)');
    (root as any).style.zoom = '';
    root.style.removeProperty('zoom');
    if (body) {
      (body as any).style.zoom = '';
      body.style.removeProperty('transform');
      body.style.removeProperty('transform-origin');
      body.style.removeProperty('width');
      body.style.removeProperty('height');
    }
  }
  
  // Also ensure the base font size stays at 16px regardless of scaling
  // This prevents rem units from scaling
  root.style.setProperty('font-size', '16px', 'important');
  (root as any).style.fontSize = '16px';
  
  return normalizedScale;
};

export const useDisplayScale = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', calculateScale);
        return;
      }
      
      const newScale = applyDisplayScale();
      setScale(newScale);
    };

    // Calculate immediately
    calculateScale();

    // Also run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', calculateScale);
    } else {
      // DOM already ready, run after a short delay
      setTimeout(calculateScale, 100);
      setTimeout(calculateScale, 500);
    }

    // Recalculate on resize (in case user changes scaling or zoom)
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    
    // Listen for device pixel ratio changes (some browsers support this)
    if (window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', calculateScale);
        } else if (mediaQuery.addListener) {
          // Fallback for older browsers
          mediaQuery.addListener(calculateScale);
        }
      } catch (e) {
        // Some browsers don't support resolution media queries - that's okay
      }
    }

    return () => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('orientationchange', calculateScale);
      document.removeEventListener('DOMContentLoaded', calculateScale);
      // Reset zoom on unmount
      document.documentElement.style.removeProperty('zoom');
    };
  }, []);

  return scale;
};

