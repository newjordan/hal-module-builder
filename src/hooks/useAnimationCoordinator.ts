import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Performance budget configuration for animation system
 * Ensures animations don't degrade overall app performance
 */
export interface AnimationPerformanceBudget {
  /** Maximum additional CPU percentage (0-100) */
  maxCPUPercentage: number;
  /** Maximum additional memory in MB */
  maxMemoryMB: number;
  /** Number of consecutive dropped frames before action */
  frameDropThreshold: number;
  /** Automatically reduce animation quality under pressure */
  adaptiveQuality: boolean;
  /** Target FPS (usually 60) */
  targetFPS: number;
  /** Maximum simultaneous animations */
  maxSimultaneousAnimations: number;
}

/**
 * Animation system statistics for monitoring
 */
export interface AnimationStats {
  /** Current frames per second */
  currentFPS: number;
  /** Number of dropped frames in last second */
  droppedFrames: number;
  /** Current memory usage in MB */
  memoryUsage: number;
  /** Number of active animations */
  activeAnimations: number;
  /** Performance score (0-100) */
  performanceScore: number;
  /** Is system throttled */
  isThrottled: boolean;
}

/**
 * Registered animation callback with metadata
 */
interface AnimationCallback {
  id: string;
  callback: (timestamp: number) => void;
  priority: number;
  lastExecutionTime?: number;
  averageExecutionTime?: number;
  skipCount?: number;
}

/**
 * Master animation coordinator hook
 * Single Responsibility: Coordinate all animation RAF loops to prevent conflicts
 * and maintain performance budget
 *
 * This is the foundation layer that all animation systems should use instead
 * of directly calling requestAnimationFrame
 */
export const useAnimationCoordinator = (
  budget: AnimationPerformanceBudget = {
    maxCPUPercentage: 10,
    maxMemoryMB: 50,
    frameDropThreshold: 2,
    adaptiveQuality: true,
    targetFPS: 60,
    maxSimultaneousAnimations: 20,
  }
) => {
  // Core state
  const [stats, setStats] = useState<AnimationStats>({
    currentFPS: 60,
    droppedFrames: 0,
    memoryUsage: 0,
    activeAnimations: 0,
    performanceScore: 100,
    isThrottled: false,
  });

  const [isRunning, setIsRunning] = useState(false);

  // Animation management
  const animationCallbacks = useRef<Map<string, AnimationCallback>>(new Map());
  const rafId = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const droppedFramesBuffer = useRef<number[]>([]);

  // Performance tracking
  const frameTimeBuffer = useRef<number[]>([]);
  const memoryCheckInterval = useRef<number>();
  const performanceStartTime = useRef<number>(0);

  /**
   * Calculate current FPS based on frame times
   */
  const calculateFPS = useCallback(
    (deltaTime: number): number => {
      frameTimeBuffer.current.push(deltaTime);

      // Keep only last 60 frames for calculation
      if (frameTimeBuffer.current.length > 60) {
        frameTimeBuffer.current.shift();
      }

      const averageFrameTime =
        frameTimeBuffer.current.reduce((a, b) => a + b, 0) /
        frameTimeBuffer.current.length;
      return Math.min(budget.targetFPS, 1000 / averageFrameTime);
    },
    [budget.targetFPS]
  );

  /**
   * Check if frame was dropped
   */
  const checkFrameDrop = useCallback(
    (deltaTime: number): boolean => {
      const targetFrameTime = 1000 / budget.targetFPS;
      const threshold = targetFrameTime * 1.5; // Allow 50% variance
      return deltaTime > threshold;
    },
    [budget.targetFPS]
  );

  /**
   * Calculate performance score (0-100)
   */
  const calculatePerformanceScore = useCallback((): number => {
    const fpsScore = (stats.currentFPS / budget.targetFPS) * 40; // 40% weight
    const droppedFrameScore = Math.max(0, 30 - stats.droppedFrames * 10); // 30% weight
    const memoryScore = Math.max(
      0,
      30 - (stats.memoryUsage / budget.maxMemoryMB) * 30
    ); // 30% weight

    return Math.min(
      100,
      Math.max(0, fpsScore + droppedFrameScore + memoryScore)
    );
  }, [stats, budget]);

  /**
   * Main animation loop
   */
  const animationLoop = useCallback(
    (timestamp: number) => {
      if (!isRunning) return;

      // Calculate frame timing
      const deltaTime = timestamp - lastFrameTime.current;
      lastFrameTime.current = timestamp;

      // Skip first frame
      if (deltaTime === timestamp) {
        rafId.current = requestAnimationFrame(animationLoop);
        return;
      }

      // Update FPS
      const currentFPS = calculateFPS(deltaTime);

      // Check for dropped frames
      const isFrameDropped = checkFrameDrop(deltaTime);
      if (isFrameDropped) {
        droppedFramesBuffer.current.push(timestamp);
        // Clean old entries (older than 1 second)
        droppedFramesBuffer.current = droppedFramesBuffer.current.filter(
          t => timestamp - t < 1000
        );
      }

      // Determine if we should throttle
      const shouldThrottle =
        budget.adaptiveQuality &&
        (droppedFramesBuffer.current.length > budget.frameDropThreshold ||
          currentFPS < budget.targetFPS * 0.8);

      // Sort callbacks by priority
      const sortedCallbacks = Array.from(
        animationCallbacks.current.values()
      ).sort((a, b) => b.priority - a.priority);

      // Execute callbacks based on performance
      sortedCallbacks.forEach((animCallback, index) => {
        // Skip low priority animations if throttling
        if (
          shouldThrottle &&
          index > Math.floor(sortedCallbacks.length * 0.5)
        ) {
          animCallback.skipCount = (animCallback.skipCount || 0) + 1;
          return;
        }

        const startTime = performance.now();

        try {
          animCallback.callback(timestamp);
        } catch (error) {
          console.error(`Animation callback ${animCallback.id} failed:`, error);
          // Remove failing callbacks to prevent cascade failures
          animationCallbacks.current.delete(animCallback.id);
        }

        const executionTime = performance.now() - startTime;

        // Track execution time
        animCallback.lastExecutionTime = executionTime;
        animCallback.averageExecutionTime = animCallback.averageExecutionTime
          ? (animCallback.averageExecutionTime + executionTime) / 2
          : executionTime;
      });

      // Update stats every 10 frames
      if (frameCount.current % 10 === 0) {
        setStats(prev => ({
          ...prev,
          currentFPS,
          droppedFrames: droppedFramesBuffer.current.length,
          activeAnimations: animationCallbacks.current.size,
          performanceScore: calculatePerformanceScore(),
          isThrottled: shouldThrottle,
        }));
      }

      frameCount.current++;
      rafId.current = requestAnimationFrame(animationLoop);
    },
    [isRunning, calculateFPS, checkFrameDrop, budget, calculatePerformanceScore]
  );

  /**
   * Register an animation callback
   */
  const registerAnimation = useCallback(
    (
      id: string,
      callback: (timestamp: number) => void,
      priority: number = 5
    ): (() => void) => {
      // Check max animations limit
      if (animationCallbacks.current.size >= budget.maxSimultaneousAnimations) {
        console.warn(
          `Maximum animation limit reached (${budget.maxSimultaneousAnimations})`
        );

        // Find and remove lowest priority animation if new one has higher priority
        const lowestPriority = Array.from(
          animationCallbacks.current.values()
        ).sort((a, b) => a.priority - b.priority)[0];

        if (lowestPriority && lowestPriority.priority < priority) {
          animationCallbacks.current.delete(lowestPriority.id);
        } else {
          return () => {}; // Don't register if priority too low
        }
      }

      animationCallbacks.current.set(id, {
        id,
        callback,
        priority,
        skipCount: 0,
      });

      // Start animation loop if this is the first animation
      if (animationCallbacks.current.size === 1 && !isRunning) {
        start();
      }

      // Return cleanup function
      return () => {
        unregisterAnimation(id);
      };
    },
    [budget.maxSimultaneousAnimations]
  );

  /**
   * Unregister an animation callback
   */
  const unregisterAnimation = useCallback(
    (id: string) => {
      animationCallbacks.current.delete(id);

      // Stop animation loop if no more animations
      if (animationCallbacks.current.size === 0 && isRunning) {
        stop();
      }
    },
    [isRunning]
  );

  /**
   * Start the animation coordinator
   */
  const start = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    lastFrameTime.current = performance.now();
    performanceStartTime.current = performance.now();
    frameCount.current = 0;
    frameTimeBuffer.current = [];
    droppedFramesBuffer.current = [];

    // Start memory monitoring
    if (typeof (performance as any).memory !== 'undefined') {
      memoryCheckInterval.current = window.setInterval(() => {
        const memoryInfo = (performance as any).memory;
        const usedMemoryMB = memoryInfo.usedJSHeapSize / 1048576;

        setStats(prev => ({
          ...prev,
          memoryUsage: usedMemoryMB,
        }));
      }, 1000);
    }

    rafId.current = requestAnimationFrame(animationLoop);
  }, [isRunning, animationLoop]);

  /**
   * Stop the animation coordinator
   */
  const stop = useCallback(() => {
    if (!isRunning) return;

    setIsRunning(false);

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = undefined;
    }

    if (memoryCheckInterval.current) {
      clearInterval(memoryCheckInterval.current);
      memoryCheckInterval.current = undefined;
    }

    // Reset stats
    setStats({
      currentFPS: 60,
      droppedFrames: 0,
      memoryUsage: 0,
      activeAnimations: 0,
      performanceScore: 100,
      isThrottled: false,
    });
  }, [isRunning]);

  /**
   * Pause all animations temporarily
   */
  const pause = useCallback(() => {
    if (!isRunning) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = undefined;
    }
  }, [isRunning]);

  /**
   * Resume all animations
   */
  const resume = useCallback(() => {
    if (!isRunning) return;

    lastFrameTime.current = performance.now();
    rafId.current = requestAnimationFrame(animationLoop);
  }, [isRunning, animationLoop]);

  /**
   * Get detailed performance report
   */
  const getPerformanceReport = useCallback(() => {
    const callbacks = Array.from(animationCallbacks.current.values());

    return {
      stats,
      animations: callbacks.map(cb => ({
        id: cb.id,
        priority: cb.priority,
        lastExecutionTime: cb.lastExecutionTime || 0,
        averageExecutionTime: cb.averageExecutionTime || 0,
        skipCount: cb.skipCount || 0,
      })),
      totalRuntime: performance.now() - performanceStartTime.current,
      budget,
    };
  }, [stats, budget]);

  /**
   * Update performance budget
   */
  const updateBudget = useCallback(
    (newBudget: Partial<AnimationPerformanceBudget>) => {
      Object.assign(budget, newBudget);
    },
    [budget]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    // Core functions
    registerAnimation,
    unregisterAnimation,

    // Control functions
    start,
    stop,
    pause,
    resume,

    // State
    isRunning,
    stats,

    // Utilities
    getPerformanceReport,
    updateBudget,

    // Direct access for advanced use cases
    hasAnimation: (id: string) => animationCallbacks.current.has(id),
    getAnimationCount: () => animationCallbacks.current.size,
  };
};

export default useAnimationCoordinator;
