import React, { useRef, useEffect, useState } from 'react';
import {
  HalEvent,
  VisualCommand,
  VisualEffect,
  WidgetSettings,
} from '../../types/widget-types';
import { VisualEffectEngine } from '../../services/VisualEffectEngine';

export interface WidgetRendererProps {
  events: HalEvent[];
  settings: Partial<WidgetSettings>;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  events,
  settings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VisualEffectEngine | null>(null);
  const animationFrameRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the visual engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      engineRef.current = new VisualEffectEngine(canvas);
      setIsInitialized(true);
      console.log('Widget renderer initialized');
    } catch (error) {
      console.error('Failed to initialize visual engine:', error);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInitialized) return;

    const updateCanvasSize = () => {
      const size = settings.size || 200;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (engineRef.current) {
        engineRef.current.resize(size, size);
      }
    };

    updateCanvasSize();
  }, [settings.size, isInitialized]);

  // Process events into visual commands
  useEffect(() => {
    if (!engineRef.current || !isInitialized) return;

    events.forEach(event => {
      const visualCommand = createVisualCommand(event);
      if (visualCommand) {
        engineRef.current!.addEffect(visualCommand);
      }
    });
  }, [events, isInitialized]);

  // Start render loop
  useEffect(() => {
    if (!engineRef.current || !isInitialized) return;

    const render = (timestamp: number) => {
      if (engineRef.current) {
        engineRef.current.render(timestamp);
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInitialized]);

  // Convert HalEvent to VisualCommand
  const createVisualCommand = (event: HalEvent): VisualCommand | null => {
    const effect = event.effect || getDefaultEffect(event.type);
    if (!effect) return null;

    return {
      effect: effect as VisualEffect,
      timestamp: event.timestamp || Date.now(),
      properties: {
        color: event.color || getDefaultColor(event.type),
        intensity: event.intensity || 0.5,
        duration: event.duration || 1000,
        ...event.data,
      },
    };
  };

  // Get default effect based on event type
  const getDefaultEffect = (eventType: string): string => {
    const defaultMappings: Record<string, string> = {
      'llm.thinking': 'spiral',
      'llm.response': 'pulse',
      'llm.error': 'shake',
      'api.request': 'pulse',
      'api.response': 'wave',
      'api.error': 'flash',
      error: 'shake',
      success: 'glow',
      info: 'pulse',
      warning: 'flash',
    };

    // Try exact match first
    if (defaultMappings[eventType]) {
      return defaultMappings[eventType];
    }

    // Try prefix match
    for (const [prefix, effect] of Object.entries(defaultMappings)) {
      if (eventType.startsWith(prefix)) {
        return effect;
      }
    }

    return 'pulse'; // Default fallback
  };

  // Get default color based on event type
  const getDefaultColor = (eventType: string): string => {
    const colorMappings: Record<string, string> = {
      error: '#ff4444',
      success: '#44ff44',
      warning: '#ffaa44',
      info: '#4444ff',
      llm: '#44aaff',
      api: '#aa44ff',
    };

    // Try exact match first
    if (colorMappings[eventType]) {
      return colorMappings[eventType];
    }

    // Try prefix match
    for (const [prefix, color] of Object.entries(colorMappings)) {
      if (eventType.startsWith(prefix)) {
        return color;
      }
    }

    return '#44aaff'; // Default blue
  };

  return (
    <div
      className='widget-renderer'
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
        }}
      />

      {/* Fallback for when engine is not initialized */}
      {!isInitialized && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#888',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          Initializing...
        </div>
      )}
    </div>
  );
};
