/**
 * PerformanceMonitor - Handles performance monitoring and FPS tracking
 */
import { useEffect, useRef } from 'react';
import type { PerformanceMetrics } from '../../types';

export interface PerformanceMonitorProps {
  isEnabled: boolean;
  isActive: boolean;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

export const usePerformanceMonitor = ({
  isEnabled,
  isActive,
  onPerformanceUpdate,
}: PerformanceMonitorProps) => {
  const performanceRef = useRef({ lastFrame: 0, frameCount: 0 });
  useEffect(() => {
    let animationFrameId: number | undefined;
    if (isActive && isEnabled) {
      const monitor = () => {
        const now = performance.now();
        performanceRef.current.frameCount++;
        const elapsed = now - performanceRef.current.lastFrame;
        if (elapsed >= 1000) {
          // Update every second
          const fps = Math.round(
            (performanceRef.current.frameCount * 1000) / elapsed
          );
          performanceRef.current.frameCount = 0;
          performanceRef.current.lastFrame = now;
          if (onPerformanceUpdate) {
            onPerformanceUpdate({
              fps,
              frameTime: 1000 / fps, // milliseconds per frame
              renderTime: elapsed / 1000,
              memoryUsage:
                (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
              timestamp: now,
            });
          }
        }
        animationFrameId = requestAnimationFrame(monitor);
      };
      performanceRef.current.lastFrame = performance.now();
      animationFrameId = requestAnimationFrame(monitor);
    }
    return () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, isEnabled, onPerformanceUpdate]);
  return performanceRef;
};
export default usePerformanceMonitor;
