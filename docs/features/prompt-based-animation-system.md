# HAL-9001 Prompt-Based Animation System
## Comprehensive Feature Implementation Plan

**Version:** 1.0.0
**Created:** 2025-01-24
**Epic:** Animation Engine Evolution
**Status:** Planning Phase

---

## 🎯 Executive Summary

Transform HAL-9001's animation capabilities from keyframe-only to an intuitive prompt-based system with professional timeline controls. Users will describe desired animations in natural language ("make me an intro animation where a glowing dot pops up and begins to glow") and receive ready-to-customize timeline sequences using our existing layer architecture.

### Key Innovation Points
- **Prompt-to-Animation Translation Engine**
- **After Effects-Style Timeline Interface**
- **Non-Destructive Layer Generation**
- **Seamless Integration with Existing Architecture**
- **Full Frost Glass Theme Integration**

---

## 🏗️ Architecture Overview

### System Integration Strategy
```typescript
// Enhanced animation architecture builds on existing foundation
Current Foundation:
- useLayerAnimation (keyframe-based)
- Layer types (image, shape, audio, equalizer)
- Frost Glass theming system
- 60fps rendering pipeline

New Additions:
- useAnimationPromptEngine (natural language processing)
- useTimelineManager (After Effects-style controls)
- useAnimationPresetLibrary (expandable preset system)
- useAnimationOrchestrator (multi-layer coordination)
- AnimationStudio UI (comprehensive timeline interface)
```

### Core Principles Adherence
- **SRP**: Each hook handles single animation concern
- **DRY**: Reuses existing layer properties and rendering
- **Non-Destructive**: Generates new layers, preserves originals
- **Performance**: Maintains 60fps with optimized batch operations

---

## 🔧 Hook Architecture Specifications

### 1. `useAnimationPromptEngine`
**Single Responsibility:** Parse natural language into animation sequences

```typescript
// hooks/useAnimationPromptEngine.ts
export interface AnimationPromptResult {
  layers: Layer[];
  timeline: AnimationTimeline;
  suggestions: string[];
  confidence: number;
}

export interface PromptEngineConfig {
  customPrompts?: Record<string, AnimationSequence>;
  aiEnabled?: boolean;
  fallbackMode?: 'preset' | 'generate';
}

export const useAnimationPromptEngine = (
  config: PromptEngineConfig = {}
) => {
  const [promptLibrary, setPromptLibrary] = useState(defaultPromptLibrary);
  const [isProcessing, setIsProcessing] = useState(false);

  const parsePrompt = useCallback(async (
    prompt: string
  ): Promise<AnimationPromptResult> => {
    setIsProcessing(true);

    try {
      // 1. Pattern matching against known prompts
      const exactMatch = promptLibrary[prompt.toLowerCase()];
      if (exactMatch) {
        return {
          layers: exactMatch.generateLayers(),
          timeline: exactMatch.generateTimeline(),
          suggestions: exactMatch.variations || [],
          confidence: 1.0
        };
      }

      // 2. Semantic analysis for partial matches
      const semanticMatch = findSemanticMatch(prompt, promptLibrary);
      if (semanticMatch.confidence > 0.7) {
        return {
          layers: semanticMatch.result.generateLayers(),
          timeline: semanticMatch.result.generateTimeline(),
          suggestions: generateVariations(prompt),
          confidence: semanticMatch.confidence
        };
      }

      // 3. AI-powered generation (if enabled)
      if (config.aiEnabled) {
        return await generateWithAI(prompt);
      }

      // 4. Fallback to basic preset
      return generateFallback(prompt);

    } finally {
      setIsProcessing(false);
    }
  }, [promptLibrary, config]);

  return {
    parsePrompt,
    isProcessing,
    addCustomPrompt: (prompt: string, sequence: AnimationSequence) => {
      setPromptLibrary(prev => ({ ...prev, [prompt]: sequence }));
    },
    getAvailablePrompts: () => Object.keys(promptLibrary),
    getSuggestions: (partial: string) => getSuggestions(partial, promptLibrary)
  };
};

// Default prompt library with system-specific animations
const defaultPromptLibrary: Record<string, AnimationSequence> = {
  "intro animation where a glowing dot pops up and begins to glow": {
    name: "Connection Startup Sequence",
    generateLayers: () => [
      {
        id: generateId(),
        name: "Connection Indicator",
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 0,
        scale: 0.1,
        fillType: 'solid',
        fillColor: '#14b8a6',
        glowIntensity: 0,
        glowColor: '#14b8a6',
        // Position in center
        offsetX: 0,
        offsetY: 0
      } as Layer
    ],
    generateTimeline: () => ({
      id: generateId(),
      name: "Connection Startup",
      duration: 3000,
      tracks: [
        // Scale up animation (pop effect)
        {
          layerId: 'connection-indicator',
          property: 'scale',
          keyframes: [
            { time: 0, value: 0.1, easing: 'ease-out' },
            { time: 0.3, value: 1.2, easing: 'ease-in-out' },
            { time: 0.6, value: 1.0, easing: 'ease-out' }
          ]
        },
        // Opacity fade in
        {
          layerId: 'connection-indicator',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0, easing: 'ease-in' },
            { time: 0.4, value: 1, easing: 'ease-out' }
          ]
        },
        // Glow intensity animation
        {
          layerId: 'connection-indicator',
          property: 'glowIntensity',
          keyframes: [
            { time: 0.6, value: 0, easing: 'ease-in' },
            { time: 1.0, value: 0.8, easing: 'ease-out' },
            { time: 1.5, value: 0.4, easing: 'ease-in-out' },
            { time: 2.0, value: 0.6, easing: 'ease-in-out' }
          ]
        }
      ]
    }),
    variations: [
      "startup animation with pulsing dot",
      "connection indicator with glow effect",
      "intro sequence with animated circle"
    ]
  },

  "loading animation with spinning elements": {
    name: "Processing Indicator",
    generateLayers: () => [
      {
        id: generateId(),
        name: "Loading Ring",
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 1,
        scale: 1,
        strokeType: 'gradient',
        strokeWidth: 4,
        fillType: 'none',
        strokeGradient: {
          type: 'conic',
          colors: ['#14b8a6', 'transparent', '#14b8a6'],
          stops: [0, 0.5, 1]
        }
      } as Layer
    ],
    generateTimeline: () => ({
      id: generateId(),
      name: "Loading Spinner",
      duration: 2000,
      tracks: [
        {
          layerId: 'loading-ring',
          property: 'rotation',
          keyframes: [
            { time: 0, value: 0, easing: 'linear' },
            { time: 1, value: 360, easing: 'linear' }
          ]
        }
      ]
    })
  }
};
```

### 2. `useTimelineManager`
**Single Responsibility:** Manage After Effects-style timeline interface

```typescript
// hooks/useTimelineManager.ts
export interface TimelineKeyframe {
  id: string;
  time: number; // 0-1 normalized time
  value: any;
  easing: EasingFunction;
  selected?: boolean;
}

export interface TimelineTrack {
  id: string;
  layerId: string;
  property: keyof Layer;
  keyframes: TimelineKeyframe[];
  expanded?: boolean;
  locked?: boolean;
  solo?: boolean;
  muted?: boolean;
}

export interface AnimationTimeline {
  id: string;
  name: string;
  duration: number; // in milliseconds
  currentTime: number;
  tracks: TimelineTrack[];
  playbackState: 'playing' | 'paused' | 'stopped';
  loop: boolean;
  selectedKeyframes: string[];
}

export const useTimelineManager = (
  layers: Layer[],
  initialTimeline?: Partial<AnimationTimeline>
) => {
  const [timeline, setTimeline] = useState<AnimationTimeline>({
    id: generateId(),
    name: 'Animation Timeline',
    duration: 5000,
    currentTime: 0,
    tracks: [],
    playbackState: 'stopped',
    loop: false,
    selectedKeyframes: [],
    ...initialTimeline
  });

  const playbackRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Playback controls
  const play = useCallback(() => {
    if (timeline.playbackState === 'playing') return;

    const startTime = performance.now() - timeline.currentTime;
    startTimeRef.current = startTime;

    const updatePlayback = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const newTime = Math.min(elapsed, timeline.duration);

      setTimeline(prev => ({
        ...prev,
        currentTime: newTime,
        playbackState: newTime >= timeline.duration ? 'stopped' : 'playing'
      }));

      if (newTime < timeline.duration) {
        playbackRef.current = requestAnimationFrame(updatePlayback);
      } else if (timeline.loop) {
        // Restart timeline
        setTimeline(prev => ({ ...prev, currentTime: 0 }));
        startTimeRef.current = timestamp;
        playbackRef.current = requestAnimationFrame(updatePlayback);
      }
    };

    setTimeline(prev => ({ ...prev, playbackState: 'playing' }));
    playbackRef.current = requestAnimationFrame(updatePlayback);
  }, [timeline]);

  const pause = useCallback(() => {
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
    }
    setTimeline(prev => ({ ...prev, playbackState: 'paused' }));
  }, []);

  const stop = useCallback(() => {
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
    }
    setTimeline(prev => ({
      ...prev,
      playbackState: 'stopped',
      currentTime: 0
    }));
  }, []);

  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(timeline.duration, time));
    setTimeline(prev => ({ ...prev, currentTime: clampedTime }));
  }, [timeline.duration]);

  // Timeline editing
  const addKeyframe = useCallback((
    trackId: string,
    time: number,
    value: any
  ) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              keyframes: [
                ...track.keyframes,
                {
                  id: generateId(),
                  time: time / prev.duration, // Normalize to 0-1
                  value,
                  easing: 'ease-in-out'
                }
              ].sort((a, b) => a.time - b.time)
            }
          : track
      )
    }));
  }, []);

  const removeKeyframe = useCallback((keyframeId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        keyframes: track.keyframes.filter(kf => kf.id !== keyframeId)
      }))
    }));
  }, []);

  const updateKeyframe = useCallback((
    keyframeId: string,
    updates: Partial<TimelineKeyframe>
  ) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        keyframes: track.keyframes.map(kf =>
          kf.id === keyframeId ? { ...kf, ...updates } : kf
        )
      }))
    }));
  }, []);

  const addTrack = useCallback((
    layerId: string,
    property: keyof Layer
  ) => {
    const newTrack: TimelineTrack = {
      id: generateId(),
      layerId,
      property,
      keyframes: [],
      expanded: true
    };

    setTimeline(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
  }, []);

  // Get current animated values for all layers
  const getCurrentAnimatedProperties = useCallback((): Record<string, Partial<Layer>> => {
    const progress = timeline.currentTime / timeline.duration;
    const animatedProps: Record<string, Partial<Layer>> = {};

    timeline.tracks.forEach(track => {
      if (track.keyframes.length === 0 || track.muted) return;

      // Find surrounding keyframes
      const currentKeyframes = track.keyframes
        .filter(kf => kf.time <= progress)
        .sort((a, b) => a.time - b.time);
      const nextKeyframes = track.keyframes
        .filter(kf => kf.time > progress)
        .sort((a, b) => a.time - b.time);

      const currentKf = currentKeyframes[currentKeyframes.length - 1];
      const nextKf = nextKeyframes[0];

      if (!animatedProps[track.layerId]) {
        animatedProps[track.layerId] = {};
      }

      if (currentKf && nextKf) {
        // Interpolate between keyframes
        const localProgress = (progress - currentKf.time) / (nextKf.time - currentKf.time);
        const easedProgress = applyEasing(localProgress, currentKf.easing);
        animatedProps[track.layerId][track.property] = interpolateValue(
          currentKf.value,
          nextKf.value,
          easedProgress
        );
      } else if (currentKf) {
        // Use last keyframe value
        animatedProps[track.layerId][track.property] = currentKf.value;
      }
    });

    return animatedProps;
  }, [timeline]);

  return {
    timeline,
    setTimeline,

    // Playback
    play,
    pause,
    stop,
    seekTo,

    // Editing
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    addTrack,

    // Animation output
    getCurrentAnimatedProperties,

    // Selection
    selectKeyframes: (keyframeIds: string[]) => {
      setTimeline(prev => ({ ...prev, selectedKeyframes: keyframeIds }));
    },

    // Utility
    exportTimeline: () => timeline,
    importTimeline: (importedTimeline: AnimationTimeline) => {
      setTimeline(importedTimeline);
    }
  };
};
```

### 3. `useAnimationPresetLibrary`
**Single Responsibility:** Manage expandable animation preset system

```typescript
// hooks/useAnimationPresetLibrary.ts
export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'user' | 'ui' | 'effects';
  tags: string[];
  thumbnail?: string;
  generate: (config?: any) => {
    layers: Layer[];
    timeline: AnimationTimeline;
  };
  config?: {
    duration?: { min: number; max: number; default: number };
    intensity?: { min: number; max: number; default: number };
    customizable?: string[];
  };
}

export const useAnimationPresetLibrary = () => {
  const [presets, setPresets] = useState<AnimationPreset[]>(systemPresets);
  const [userPresets, setUserPresets] = useState<AnimationPreset[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const getPresetsByCategory = useCallback((category: string) => {
    return [...presets, ...userPresets].filter(preset => preset.category === category);
  }, [presets, userPresets]);

  const searchPresets = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return [...presets, ...userPresets].filter(preset =>
      preset.name.toLowerCase().includes(lowercaseQuery) ||
      preset.description.toLowerCase().includes(lowercaseQuery) ||
      preset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [presets, userPresets]);

  const createPresetFromTimeline = useCallback((
    name: string,
    description: string,
    timeline: AnimationTimeline,
    layers: Layer[]
  ) => {
    const newPreset: AnimationPreset = {
      id: generateId(),
      name,
      description,
      category: 'user',
      tags: [],
      generate: () => ({
        layers: layers.map(layer => ({ ...layer, id: generateId() })),
        timeline: {
          ...timeline,
          id: generateId(),
          tracks: timeline.tracks.map(track => ({
            ...track,
            id: generateId(),
            keyframes: track.keyframes.map(kf => ({ ...kf, id: generateId() }))
          }))
        }
      })
    };

    setUserPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, []);

  return {
    presets: [...presets, ...userPresets],
    systemPresets: presets,
    userPresets,
    favorites,
    getPresetsByCategory,
    searchPresets,
    createPresetFromTimeline,
    addToFavorites: (presetId: string) => {
      setFavorites(prev => [...prev, presetId]);
    },
    removeFromFavorites: (presetId: string) => {
      setFavorites(prev => prev.filter(id => id !== presetId));
    }
  };
};

// System presets optimized for HAL-9001 use cases
const systemPresets: AnimationPreset[] = [
  {
    id: 'system-startup',
    name: 'System Startup',
    description: 'Professional application startup sequence',
    category: 'system',
    tags: ['startup', 'intro', 'professional'],
    generate: (config = { duration: 3000, intensity: 1 }) => ({
      layers: [
        // Background fade
        {
          id: generateId(),
          name: 'Startup Background',
          type: 'shape',
          shapeType: 'rectangle',
          visible: true,
          opacity: 0,
          fillType: 'gradient',
          fillGradient: {
            type: 'radial',
            colors: ['rgba(20, 184, 166, 0.1)', 'transparent'],
            stops: [0, 1],
            centerX: 0.5,
            centerY: 0.5
          }
        } as Layer,

        // HAL indicator
        {
          id: generateId(),
          name: 'HAL Indicator',
          type: 'shape',
          shapeType: 'circle',
          visible: true,
          opacity: 0,
          scale: 0,
          fillType: 'solid',
          fillColor: '#14b8a6',
          glowIntensity: 0,
          glowColor: '#14b8a6'
        } as Layer
      ],
      timeline: {
        id: generateId(),
        name: 'System Startup Timeline',
        duration: config.duration,
        currentTime: 0,
        tracks: [
          {
            id: generateId(),
            layerId: 'startup-background',
            property: 'opacity',
            keyframes: [
              { id: generateId(), time: 0, value: 0, easing: 'ease-in' },
              { id: generateId(), time: 0.3, value: 1, easing: 'ease-out' }
            ]
          },
          {
            id: generateId(),
            layerId: 'hal-indicator',
            property: 'scale',
            keyframes: [
              { id: generateId(), time: 0.2, value: 0, easing: 'ease-out' },
              { id: generateId(), time: 0.6, value: 1.2 * config.intensity, easing: 'ease-in-out' },
              { id: generateId(), time: 0.8, value: 1, easing: 'ease-out' }
            ]
          },
          {
            id: generateId(),
            layerId: 'hal-indicator',
            property: 'opacity',
            keyframes: [
              { id: generateId(), time: 0.2, value: 0, easing: 'ease-in' },
              { id: generateId(), time: 0.5, value: 1, easing: 'ease-out' }
            ]
          },
          {
            id: generateId(),
            layerId: 'hal-indicator',
            property: 'glowIntensity',
            keyframes: [
              { id: generateId(), time: 0.7, value: 0, easing: 'ease-in' },
              { id: generateId(), time: 1.0, value: 0.8 * config.intensity, easing: 'ease-out' }
            ]
          }
        ],
        playbackState: 'stopped',
        loop: false,
        selectedKeyframes: []
      }
    })
  },

  {
    id: 'ui-button-hover',
    name: 'Button Hover Effect',
    description: 'Subtle hover animation for interactive elements',
    category: 'ui',
    tags: ['hover', 'button', 'interactive', 'subtle'],
    generate: () => ({
      layers: [
        {
          id: generateId(),
          name: 'Hover Glow',
          type: 'shape',
          shapeType: 'rectangle',
          visible: true,
          opacity: 0,
          scale: 1,
          fillType: 'solid',
          fillColor: 'rgba(20, 184, 166, 0.1)',
          glowIntensity: 0,
          glowColor: '#14b8a6'
        } as Layer
      ],
      timeline: {
        id: generateId(),
        name: 'Hover Timeline',
        duration: 200,
        currentTime: 0,
        tracks: [
          {
            id: generateId(),
            layerId: 'hover-glow',
            property: 'opacity',
            keyframes: [
              { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
              { id: generateId(), time: 1, value: 1, easing: 'ease-in' }
            ]
          },
          {
            id: generateId(),
            layerId: 'hover-glow',
            property: 'glowIntensity',
            keyframes: [
              { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
              { id: generateId(), time: 1, value: 0.3, easing: 'ease-in' }
            ]
          }
        ],
        playbackState: 'stopped',
        loop: false,
        selectedKeyframes: []
      }
    })
  }
];
```

### 4. `useAnimationOrchestrator`
**Single Responsibility:** Coordinate multiple timelines and layer animations

```typescript
// hooks/useAnimationOrchestrator.ts
export interface AnimationSession {
  id: string;
  name: string;
  timelines: AnimationTimeline[];
  globalPlaybackState: 'playing' | 'paused' | 'stopped';
  masterDuration: number;
  currentTime: number;
}

export const useAnimationOrchestrator = (
  layers: Layer[],
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void
) => {
  const [session, setSession] = useState<AnimationSession>({
    id: generateId(),
    name: 'Animation Session',
    timelines: [],
    globalPlaybackState: 'stopped',
    masterDuration: 0,
    currentTime: 0
  });

  const animationFrameRef = useRef<number>();

  // Aggregate all animated properties from all timelines
  const getCurrentAnimatedProperties = useCallback((): Record<string, Partial<Layer>> => {
    const aggregatedProps: Record<string, Partial<Layer>> = {};

    session.timelines.forEach(timeline => {
      const progress = session.currentTime / timeline.duration;

      timeline.tracks.forEach(track => {
        if (track.muted || track.keyframes.length === 0) return;

        const animatedValue = getAnimatedValueAtTime(track, progress);

        if (!aggregatedProps[track.layerId]) {
          aggregatedProps[track.layerId] = {};
        }

        // Handle property conflicts (later timelines override earlier ones)
        aggregatedProps[track.layerId][track.property] = animatedValue;
      });
    });

    return aggregatedProps;
  }, [session]);

  // Apply animations to layers
  const applyAnimationsToLayers = useCallback(() => {
    const animatedProps = getCurrentAnimatedProperties();

    Object.entries(animatedProps).forEach(([layerId, props]) => {
      onLayerUpdate(layerId, props);
    });
  }, [getCurrentAnimatedProperties, onLayerUpdate]);

  // Master playback controls
  const play = useCallback(() => {
    if (session.globalPlaybackState === 'playing') return;

    const startTime = performance.now() - session.currentTime;

    const updateAnimation = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const newTime = Math.min(elapsed, session.masterDuration);

      setSession(prev => ({
        ...prev,
        currentTime: newTime,
        globalPlaybackState: newTime >= prev.masterDuration ? 'stopped' : 'playing'
      }));

      applyAnimationsToLayers();

      if (newTime < session.masterDuration) {
        animationFrameRef.current = requestAnimationFrame(updateAnimation);
      }
    };

    setSession(prev => ({ ...prev, globalPlaybackState: 'playing' }));
    animationFrameRef.current = requestAnimationFrame(updateAnimation);
  }, [session, applyAnimationsToLayers]);

  const pause = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setSession(prev => ({ ...prev, globalPlaybackState: 'paused' }));
  }, []);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setSession(prev => ({
      ...prev,
      globalPlaybackState: 'stopped',
      currentTime: 0
    }));
    applyAnimationsToLayers();
  }, [applyAnimationsToLayers]);

  const addTimeline = useCallback((timeline: AnimationTimeline) => {
    setSession(prev => ({
      ...prev,
      timelines: [...prev.timelines, timeline],
      masterDuration: Math.max(prev.masterDuration, timeline.duration)
    }));
  }, []);

  const removeTimeline = useCallback((timelineId: string) => {
    setSession(prev => {
      const newTimelines = prev.timelines.filter(t => t.id !== timelineId);
      return {
        ...prev,
        timelines: newTimelines,
        masterDuration: newTimelines.reduce((max, t) => Math.max(max, t.duration), 0)
      };
    });
  }, []);

  return {
    session,
    play,
    pause,
    stop,
    seekTo: (time: number) => {
      setSession(prev => ({ ...prev, currentTime: time }));
      applyAnimationsToLayers();
    },
    addTimeline,
    removeTimeline,
    getCurrentAnimatedProperties
  };
};

// Utility function to get animated value at specific time
function getAnimatedValueAtTime(track: TimelineTrack, progress: number) {
  const keyframes = track.keyframes.sort((a, b) => a.time - b.time);

  if (keyframes.length === 0) return undefined;
  if (keyframes.length === 1) return keyframes[0].value;

  // Find surrounding keyframes
  let currentKf = keyframes[0];
  let nextKf = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
      currentKf = keyframes[i];
      nextKf = keyframes[i + 1];
      break;
    }
  }

  if (progress <= currentKf.time) return currentKf.value;
  if (progress >= nextKf.time) return nextKf.value;

  // Interpolate between keyframes
  const localProgress = (progress - currentKf.time) / (nextKf.time - currentKf.time);
  const easedProgress = applyEasing(localProgress, currentKf.easing);

  return interpolateValue(currentKf.value, nextKf.value, easedProgress);
}
```

---

## 🎨 UI Component Architecture with Frost Glass Theme

### 1. `AnimationStudio` - Main Timeline Interface

```typescript
// components/AnimationStudio/AnimationStudio.tsx
import React, { useState } from 'react';
import { Layer } from '../../types/layer-types';
import { useTheme } from '../ThemeSystem/ThemeProvider';
import { AnimationPromptInput } from './AnimationPromptInput';
import { TimelineView } from './TimelineView';
import { AnimationPresetLibrary } from './AnimationPresetLibrary';
import { AnimationControls } from './AnimationControls';

export interface AnimationStudioProps {
  layers: Layer[];
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onAddLayers: (layers: Layer[]) => void;
  className?: string;
}

export const AnimationStudio: React.FC<AnimationStudioProps> = ({
  layers,
  onLayerUpdate,
  onAddLayers,
  className = ''
}) => {
  const { theme } = useTheme();
  const [activeView, setActiveView] = useState<'prompt' | 'timeline' | 'presets'>('prompt');

  // Theme-aware class names
  const containerClass = `
    ${theme === 'frost_light' ? 'frost_light' : 'frost_dark'}
    ${theme === 'frost_light'
      ? 'frostlight-app-panel'
      : 'frostdark-app-panel'
    }
    animation-studio
    ${className}
  `;

  const headerClass = `
    frost-flex frost-items-center frost-justify-between frost-p-4 frost-border-b
    ${theme === 'frost_light'
      ? 'frost-border-gray-200'
      : 'frost-border-gray-700'
    }
  `;

  const tabClass = (isActive: boolean) => `
    frost-px-4 frost-py-2 frost-text-sm frost-font-medium frost-rounded-lg
    frost-transition-all frost-duration-200
    ${isActive
      ? theme === 'frost_light'
        ? 'frostlight-button-action'
        : 'frostdark-button-action'
      : theme === 'frost_light'
        ? 'frost-text-gray-600 hover:frost-text-gray-800 hover:frost-bg-gray-100'
        : 'frost-text-gray-400 hover:frost-text-gray-200 hover:frost-bg-gray-800'
    }
  `;

  return (
    <div className={containerClass}>
      {/* Studio Header */}
      <div className={headerClass}>
        <div className="frost-flex frost-items-center frost-space-x-1">
          <button
            onClick={() => setActiveView('prompt')}
            className={tabClass(activeView === 'prompt')}
          >
            ✨ Prompt
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={tabClass(activeView === 'timeline')}
          >
            ⏱️ Timeline
          </button>
          <button
            onClick={() => setActiveView('presets')}
            className={tabClass(activeView === 'presets')}
          >
            📚 Presets
          </button>
        </div>

        <div className="frost-text-sm frost-text-gray-500">
          Animation Studio
        </div>
      </div>

      {/* Studio Content */}
      <div className="frost-flex-1 frost-overflow-hidden">
        {activeView === 'prompt' && (
          <AnimationPromptInput
            onAnimationGenerated={onAddLayers}
            theme={theme}
          />
        )}

        {activeView === 'timeline' && (
          <TimelineView
            layers={layers}
            onLayerUpdate={onLayerUpdate}
            theme={theme}
          />
        )}

        {activeView === 'presets' && (
          <AnimationPresetLibrary
            onPresetApplied={onAddLayers}
            theme={theme}
          />
        )}
      </div>

      {/* Global Animation Controls */}
      <AnimationControls
        layers={layers}
        theme={theme}
        className="frost-border-t frost-p-4"
      />
    </div>
  );
};

// Animation Studio specific styles
const animationStudioStyles = `
.animation-studio {
  min-height: 600px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.animation-studio .frost_light {
  background: linear-gradient(
    145deg,
    rgba(206, 247, 253, 0.95) 0%,
    rgba(128, 235, 213, 0.90) 25%,
    rgba(198, 232, 255, 0.85) 50%,
    rgba(155, 200, 229, 0.90) 75%,
    rgba(80, 129, 236, 0.95) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(20, 184, 166, 0.2);
}

.animation-studio .frost_dark {
  background: linear-gradient(
    145deg,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.90) 25%,
    rgba(51, 65, 85, 0.85) 50%,
    rgba(71, 85, 105, 0.90) 75%,
    rgba(100, 116, 139, 0.95) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(148, 163, 184, 0.2);
}
`;
```

### 2. `AnimationPromptInput` - Natural Language Interface

```typescript
// components/AnimationStudio/AnimationPromptInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Layer } from '../../types/layer-types';
import { useAnimationPromptEngine } from '../../hooks/useAnimationPromptEngine';

export interface AnimationPromptInputProps {
  onAnimationGenerated: (layers: Layer[]) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

export const AnimationPromptInput: React.FC<AnimationPromptInputProps> = ({
  onAnimationGenerated,
  theme,
  className = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    parsePrompt,
    isProcessing,
    getSuggestions,
    getAvailablePrompts
  } = useAnimationPromptEngine();

  // Theme-aware classes
  const containerClass = `
    prompt-input-container frost-p-6 frost-space-y-4
    ${className}
  `;

  const inputContainerClass = theme === 'frost_light'
    ? 'frostlight-conv-input-container'
    : 'frostdark-conv-input-container';

  const inputClass = `
    ${theme === 'frost_light' ? 'frostlight-conv-input' : 'frostdark-conv-input'}
    prompt-textarea
  `;

  const buttonClass = `
    ${theme === 'frost_light' ? 'frostlight-button-action' : 'frostdark-button-action'}
    frost-px-6 frost-py-2 frost-ml-3
  `;

  const suggestionClass = `
    frost-px-3 frost-py-2 frost-text-sm frost-rounded-lg frost-cursor-pointer
    frost-transition-all frost-duration-200
    ${theme === 'frost_light'
      ? 'frost-bg-gray-100 hover:frost-bg-gray-200 frost-text-gray-700'
      : 'frost-bg-gray-800 hover:frost-bg-gray-700 frost-text-gray-300'
    }
  `;

  // Handle prompt input
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);

    if (value.length > 2) {
      const newSuggestions = getSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Generate animation from prompt
  const handleGenerate = async () => {
    if (!prompt.trim() || isProcessing) return;

    try {
      const result = await parsePrompt(prompt);
      if (result.layers.length > 0) {
        onAnimationGenerated(result.layers);
        setPrompt('');
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Failed to generate animation:', error);
    }
  };

  // Quick examples
  const quickExamples = [
    'intro animation where a glowing dot pops up and begins to glow',
    'loading animation with spinning elements',
    'error state with red pulsing indicator',
    'success celebration with green checkmark',
    'connection established with expanding circles'
  ];

  return (
    <div className={containerClass}>
      {/* Main Input */}
      <div>
        <label className="frost-block frost-text-sm frost-font-medium frost-mb-2">
          Describe your animation
        </label>
        <div className={inputContainerClass}>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Type what you want to animate... e.g., 'make me an intro animation where a glowing dot pops up and begins to glow'"
            rows={3}
            className={inputClass}
            disabled={isProcessing}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isProcessing}
            className={buttonClass}
          >
            {isProcessing ? '⏳' : '✨'} Generate
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-panel">
          <div className="frost-text-sm frost-font-medium frost-mb-2">
            Suggestions:
          </div>
          <div className="frost-flex frost-flex-wrap frost-gap-2">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setPrompt(suggestion);
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
                className={suggestionClass}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Examples */}
      <div className="examples-section">
        <div className="frost-text-sm frost-font-medium frost-mb-3">
          Try these examples:
        </div>
        <div className="frost-grid frost-grid-cols-1 frost-gap-2">
          {quickExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              className={`
                frost-text-left frost-p-3 frost-rounded-lg frost-text-sm
                frost-transition-all frost-duration-200
                ${theme === 'frost_light'
                  ? 'frost-bg-white/50 hover:frost-bg-white/70 frost-text-gray-700 frost-border frost-border-gray-200'
                  : 'frost-bg-gray-900/50 hover:frost-bg-gray-800/70 frost-text-gray-300 frost-border frost-border-gray-700'
                }
              `}
            >
              <div className="frost-flex frost-items-start frost-space-x-2">
                <span className="frost-text-teal-500 frost-font-medium">💡</span>
                <span>{example}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className={`
        frost-text-xs frost-p-3 frost-rounded-lg
        ${theme === 'frost_light'
          ? 'frost-bg-blue-50 frost-text-blue-700 frost-border frost-border-blue-200'
          : 'frost-bg-blue-900/30 frost-text-blue-300 frost-border frost-border-blue-700/50'
        }
      `}>
        <div className="frost-font-medium frost-mb-1">💡 Pro Tips:</div>
        <ul className="frost-list-disc frost-list-inside frost-space-y-1">
          <li>Be specific about timing (e.g., "slowly fade in")</li>
          <li>Mention colors or effects (e.g., "glowing blue circle")</li>
          <li>Describe the purpose (e.g., "connection indicator", "loading state")</li>
          <li>Use familiar terms like "pop up", "slide in", "pulse", "spin"</li>
        </ul>
      </div>
    </div>
  );
};

// Prompt input specific styles
const promptInputStyles = `
.prompt-textarea {
  min-height: 100px;
  resize: vertical;
}

.suggestions-panel {
  animation: fadeIn 0.2s ease-out;
}

.examples-section {
  max-height: 400px;
  overflow-y: auto;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
```

### 3. `TimelineView` - After Effects-Style Timeline

```typescript
// components/AnimationStudio/TimelineView.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Layer } from '../../types/layer-types';
import { useTimelineManager, TimelineTrack, TimelineKeyframe } from '../../hooks/useTimelineManager';

export interface TimelineViewProps {
  layers: Layer[];
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  layers,
  onLayerUpdate,
  theme,
  className = ''
}) => {
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{
    keyframeId: string;
    startX: number;
    startTime: number;
  } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  const {
    timeline,
    play,
    pause,
    stop,
    seekTo,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    addTrack
  } = useTimelineManager(layers);

  // Theme-aware classes
  const containerClass = `
    timeline-view frost-flex frost-flex-col frost-h-full
    ${className}
  `;

  const headerClass = `
    frost-flex frost-items-center frost-justify-between frost-p-4 frost-border-b
    ${theme === 'frost_light'
      ? 'frost-border-gray-200 frost-bg-white/30'
      : 'frost-border-gray-700 frost-bg-gray-900/30'
    }
  `;

  const timelineAreaClass = `
    frost-flex-1 frost-flex frost-overflow-hidden
    ${theme === 'frost_light'
      ? 'frost-bg-gray-50/50'
      : 'frost-bg-gray-900/50'
    }
  `;

  const tracksContainerClass = `
    frost-w-64 frost-border-r frost-overflow-y-auto
    ${theme === 'frost_light'
      ? 'frost-border-gray-200 frost-bg-white/20'
      : 'frost-border-gray-700 frost-bg-gray-800/20'
    }
  `;

  const keyframesAreaClass = `
    frost-flex-1 frost-relative frost-overflow-x-auto frost-overflow-y-hidden
  `;

  // Convert pixel position to time
  const pixelToTime = useCallback((pixelX: number): number => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return 0;

    const relativeX = pixelX - rect.left;
    const timelineWidth = rect.width;
    return (relativeX / timelineWidth) * timeline.duration;
  }, [timeline.duration]);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number): number => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return 0;

    return (time / timeline.duration) * rect.width;
  }, [timeline.duration]);

  // Handle keyframe drag
  const handleKeyframeDrag = useCallback((
    keyframeId: string,
    event: React.MouseEvent
  ) => {
    const keyframe = timeline.tracks
      .flatMap(track => track.keyframes)
      .find(kf => kf.id === keyframeId);

    if (!keyframe) return;

    setDragState({
      keyframeId,
      startX: event.clientX,
      startTime: keyframe.time * timeline.duration
    });
  }, [timeline]);

  // Mouse move handler for dragging
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaTime = (deltaX / (timelineRef.current?.clientWidth || 1)) * timeline.duration;
    const newTime = Math.max(0, Math.min(timeline.duration, dragState.startTime + deltaTime));

    updateKeyframe(dragState.keyframeId, {
      time: newTime / timeline.duration
    });
  }, [dragState, timeline.duration, updateKeyframe]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Effect for mouse events
  React.useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  return (
    <div className={containerClass}>
      {/* Timeline Header */}
      <div className={headerClass}>
        <div className="frost-flex frost-items-center frost-space-x-2">
          {/* Playback Controls */}
          <button
            onClick={timeline.playbackState === 'playing' ? pause : play}
            className={`
              frost-p-2 frost-rounded-lg frost-transition-colors
              ${theme === 'frost_light'
                ? 'frostlight-button-action'
                : 'frostdark-button-action'
              }
            `}
          >
            {timeline.playbackState === 'playing' ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={stop}
            className={`
              frost-p-2 frost-rounded-lg frost-transition-colors
              ${theme === 'frost_light'
                ? 'frost-text-gray-600 hover:frost-bg-gray-200'
                : 'frost-text-gray-400 hover:frost-bg-gray-700'
              }
            `}
          >
            ⏹️
          </button>

          {/* Timeline Info */}
          <div className="frost-text-sm frost-text-gray-500 frost-ml-4">
            {Math.round(timeline.currentTime)}ms / {timeline.duration}ms
          </div>
        </div>

        {/* Timeline Controls */}
        <div className="frost-flex frost-items-center frost-space-x-2">
          <button
            onClick={() => {
              // Add track for selected layer
              const firstLayer = layers[0];
              if (firstLayer) {
                addTrack(firstLayer.id, 'opacity');
              }
            }}
            className={`
              frost-text-sm frost-px-3 frost-py-1 frost-rounded-lg
              ${theme === 'frost_light'
                ? 'frost-text-teal-600 hover:frost-bg-teal-50'
                : 'frost-text-teal-400 hover:frost-bg-teal-900/20'
              }
            `}
          >
            + Add Track
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className={timelineAreaClass}>
        {/* Track Names */}
        <div className={tracksContainerClass}>
          <div className="frost-space-y-1 frost-p-2">
            {timeline.tracks.map(track => (
              <TrackHeader
                key={track.id}
                track={track}
                layer={layers.find(l => l.id === track.layerId)}
                theme={theme}
                onToggleExpand={() => {/* Handle expand */}}
                onToggleSolo={() => {/* Handle solo */}}
                onToggleMute={() => {/* Handle mute */}}
              />
            ))}
          </div>
        </div>

        {/* Timeline Area */}
        <div className={keyframesAreaClass} ref={timelineRef}>
          {/* Time Ruler */}
          <TimeRuler
            duration={timeline.duration}
            currentTime={timeline.currentTime}
            theme={theme}
            onSeek={seekTo}
          />

          {/* Keyframe Tracks */}
          <div className="frost-space-y-1 frost-mt-12">
            {timeline.tracks.map((track, trackIndex) => (
              <KeyframeTrack
                key={track.id}
                track={track}
                timeline={timeline}
                theme={theme}
                isSelected={(kf: TimelineKeyframe) => selectedKeyframes.includes(kf.id)}
                onKeyframeClick={(keyframeId: string) => {
                  setSelectedKeyframes(prev =>
                    prev.includes(keyframeId)
                      ? prev.filter(id => id !== keyframeId)
                      : [...prev, keyframeId]
                  );
                }}
                onKeyframeDrag={handleKeyframeDrag}
                onAddKeyframe={(time: number) => {
                  addKeyframe(track.id, time, track.keyframes[0]?.value || 0);
                }}
              />
            ))}
          </div>

          {/* Current Time Indicator */}
          <div
            className="frost-absolute frost-top-0 frost-bottom-0 frost-w-0.5 frost-bg-red-500 frost-pointer-events-none frost-z-10"
            style={{
              left: `${(timeline.currentTime / timeline.duration) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Supporting Components
const TrackHeader: React.FC<{
  track: TimelineTrack;
  layer?: Layer;
  theme: 'frost_light' | 'frost_dark';
  onToggleExpand: () => void;
  onToggleSolo: () => void;
  onToggleMute: () => void;
}> = ({ track, layer, theme, onToggleExpand, onToggleSolo, onToggleMute }) => {
  const headerClass = `
    frost-p-2 frost-text-sm frost-rounded-lg frost-border
    ${theme === 'frost_light'
      ? 'frost-bg-white frost-border-gray-200'
      : 'frost-bg-gray-800 frost-border-gray-600'
    }
  `;

  return (
    <div className={headerClass}>
      <div className="frost-flex frost-items-center frost-justify-between">
        <div className="frost-flex-1 frost-min-w-0">
          <div className="frost-font-medium frost-truncate">
            {layer?.name || 'Unknown Layer'}
          </div>
          <div className="frost-text-xs frost-text-gray-500 frost-truncate">
            {track.property}
          </div>
        </div>

        <div className="frost-flex frost-items-center frost-space-x-1 frost-ml-2">
          <button
            onClick={onToggleSolo}
            className={`
              frost-w-6 frost-h-6 frost-text-xs frost-rounded
              ${track.solo
                ? 'frost-bg-yellow-500 frost-text-white'
                : 'frost-bg-gray-200 frost-text-gray-600'
              }
            `}
          >
            S
          </button>

          <button
            onClick={onToggleMute}
            className={`
              frost-w-6 frost-h-6 frost-text-xs frost-rounded
              ${track.muted
                ? 'frost-bg-red-500 frost-text-white'
                : 'frost-bg-gray-200 frost-text-gray-600'
              }
            `}
          >
            M
          </button>
        </div>
      </div>
    </div>
  );
};

const TimeRuler: React.FC<{
  duration: number;
  currentTime: number;
  theme: 'frost_light' | 'frost_dark';
  onSeek: (time: number) => void;
}> = ({ duration, currentTime, theme, onSeek }) => {
  const rulerClass = `
    frost-absolute frost-top-0 frost-left-0 frost-right-0 frost-h-12 frost-border-b
    frost-cursor-pointer
    ${theme === 'frost_light'
      ? 'frost-bg-gray-100 frost-border-gray-200'
      : 'frost-bg-gray-800 frost-border-gray-700'
    }
  `;

  const handleClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const clickTime = (relativeX / rect.width) * duration;
    onSeek(clickTime);
  };

  // Generate time markers
  const markers = [];
  const markerCount = 10;
  for (let i = 0; i <= markerCount; i++) {
    const time = (i / markerCount) * duration;
    const position = (i / markerCount) * 100;

    markers.push(
      <div
        key={i}
        className="frost-absolute frost-top-0 frost-bottom-0 frost-flex frost-flex-col frost-justify-between"
        style={{ left: `${position}%` }}
      >
        <div className={`frost-w-px frost-h-full ${
          theme === 'frost_light' ? 'frost-bg-gray-300' : 'frost-bg-gray-600'
        }`} />
        <div className="frost-text-xs frost-text-gray-500 frost-mt-1">
          {Math.round(time)}ms
        </div>
      </div>
    );
  }

  return (
    <div className={rulerClass} onClick={handleClick}>
      {markers}
    </div>
  );
};

const KeyframeTrack: React.FC<{
  track: TimelineTrack;
  timeline: any;
  theme: 'frost_light' | 'frost_dark';
  isSelected: (kf: TimelineKeyframe) => boolean;
  onKeyframeClick: (keyframeId: string) => void;
  onKeyframeDrag: (keyframeId: string, event: React.MouseEvent) => void;
  onAddKeyframe: (time: number) => void;
}> = ({
  track,
  timeline,
  theme,
  isSelected,
  onKeyframeClick,
  onKeyframeDrag,
  onAddKeyframe
}) => {
  const trackClass = `
    frost-relative frost-h-12 frost-border-b frost-cursor-pointer
    ${theme === 'frost_light'
      ? 'frost-border-gray-200 hover:frost-bg-gray-50'
      : 'frost-border-gray-700 hover:frost-bg-gray-800/50'
    }
  `;

  const handleTrackClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const clickTime = (relativeX / rect.width) * timeline.duration;
    onAddKeyframe(clickTime);
  };

  return (
    <div className={trackClass} onClick={handleTrackClick}>
      {track.keyframes.map(keyframe => (
        <div
          key={keyframe.id}
          className={`
            frost-absolute frost-top-1/2 frost-w-3 frost-h-3 frost-rounded-full
            frost-transform frost--translate-y-1/2 frost-cursor-move frost-border-2
            frost-transition-all frost-duration-200
            ${isSelected(keyframe)
              ? 'frost-bg-blue-500 frost-border-blue-600 frost-scale-125'
              : theme === 'frost_light'
                ? 'frost-bg-teal-400 frost-border-teal-500 hover:frost-scale-110'
                : 'frost-bg-teal-500 frost-border-teal-600 hover:frost-scale-110'
            }
          `}
          style={{
            left: `${(keyframe.time * 100)}%`
          }}
          onClick={(e) => {
            e.stopPropagation();
            onKeyframeClick(keyframe.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onKeyframeDrag(keyframe.id, e);
          }}
        />
      ))}
    </div>
  );
};
```

---

## 📱 Implementation Phases

### Phase 1: Foundation Enhancement (Weeks 1-2)
**Goal:** Enhance existing animation system with prompt parsing capabilities

#### Week 1: Core Infrastructure
- ✅ **Extend `useLayerAnimation`** with timeline compatibility
- ✅ **Implement `useAnimationPromptEngine`** with basic pattern matching
- ✅ **Create default prompt library** (10 essential animations)
- ✅ **Build `AnimationPromptInput`** component with frost glass theme

#### Week 2: Basic UI Integration
- ✅ **Integrate prompt input** into existing PropertyPanel
- ✅ **Add animation presets** to layer creation workflow
- ✅ **Implement basic timeline controls** (play/pause/stop)
- ✅ **Test with existing layer types** (shape, image, audio)

### Phase 2: Timeline Interface (Weeks 3-4)
**Goal:** Build professional timeline editing capabilities

#### Week 3: Timeline Core
- ✅ **Implement `useTimelineManager`** with full keyframe support
- ✅ **Build `TimelineView`** with After Effects-style interface
- ✅ **Create track management** (add/remove/organize tracks)
- ✅ **Implement keyframe editing** (drag, delete, edit values)

#### Week 4: Advanced Timeline Features
- ✅ **Add timeline ruler** with time markers and seeking
- ✅ **Implement multi-select** keyframes with bulk operations
- ✅ **Create easing controls** (visual curve editor)
- ✅ **Add timeline export/import** functionality

### Phase 3: Animation Orchestration (Weeks 5-6)
**Goal:** Multi-layer animation coordination and advanced features

#### Week 5: Multi-Layer System
- ✅ **Implement `useAnimationOrchestrator`** for complex sequences
- ✅ **Add animation conflict resolution** (property priority system)
- ✅ **Create animation layers** (background, foreground, overlay)
- ✅ **Build animation templates** for common UI patterns

#### Week 6: Advanced Features
- ✅ **Add animation triggers** (onLoad, onHover, onEvent)
- ✅ **Implement animation chains** (sequential animations)
- ✅ **Create animation groups** for synchronized playback
- ✅ **Add performance optimization** (animation batching)

### Phase 4: Polish & Integration (Weeks 7-8)
**Goal:** Production-ready features and seamless integration

#### Week 7: UI Polish
- ✅ **Complete frost glass theme integration** for all components
- ✅ **Add animation preview** capabilities
- ✅ **Implement undo/redo** for timeline operations
- ✅ **Create animation library** with user-saved presets

#### Week 8: Testing & Documentation
- ✅ **Comprehensive testing** (unit, integration, E2E)
- ✅ **Performance optimization** and 60fps validation
- ✅ **Documentation and examples** for common use cases
- ✅ **Integration with existing HAL-9001 workflows**

---

## 🔌 Integration Points

### Existing Architecture Integration
```typescript
// Integration with existing HalModuleBuilder
export const EnhancedHalModuleBuilder: React.FC = () => {
  const { layers, addLayer, updateLayer } = useLayerManagement();
  const [showAnimationStudio, setShowAnimationStudio] = useState(false);

  return (
    <div className="hal-module-builder">
      {/* Existing layout */}
      <LayerManager layers={layers} onAddLayer={addLayer} />
      <Canvas layers={layers} />
      <PropertyPanel
        layers={layers}
        onUpdateLayer={updateLayer}
        // New: Animation studio toggle
        extraActions={
          <button
            onClick={() => setShowAnimationStudio(!showAnimationStudio)}
            className="frost-btn frost-btn-animation"
          >
            ✨ Animate
          </button>
        }
      />

      {/* New: Animation Studio Modal/Panel */}
      {showAnimationStudio && (
        <AnimationStudio
          layers={layers}
          onLayerUpdate={updateLayer}
          onAddLayers={(newLayers) => {
            newLayers.forEach(layer => addLayer(layer));
          }}
          className="frost-modal-overlay"
        />
      )}
    </div>
  );
};
```

### Service Layer Integration
```typescript
// New animation service works alongside existing services
export const AnimationService = {
  // Integrates with existing AudioService for audio-reactive animations
  createAudioReactiveAnimation: (audioData: AudioAnalysisData) => {
    return {
      layers: generateVisualizerLayers(audioData),
      timeline: generateAudioTimeline(audioData.duration)
    };
  },

  // Integrates with existing TemplateService for animation templates
  saveAnimationTemplate: (name: string, animation: AnimationSequence) => {
    TemplateService.saveTemplate({
      ...animation,
      type: 'animation-template',
      metadata: { category: 'animation' }
    });
  },

  // Integrates with existing PerformanceService for optimization
  optimizeAnimationForPerformance: (timeline: AnimationTimeline) => {
    return PerformanceService.optimizeForTarget60FPS(timeline);
  }
};
```

---

## 🎯 Success Metrics

### User Experience Metrics
- **Adoption Rate**: % of users who try animation features within first week
- **Prompt Success Rate**: % of prompts that generate usable animations (target: >80%)
- **Time to Animation**: Average time from prompt to applied animation (target: <2 minutes)
- **User Retention**: % of users who use animations repeatedly (target: >60%)

### Technical Performance Metrics
- **60fps Maintenance**: Animations maintain 60fps with 10+ simultaneous layers
- **Memory Usage**: Animation system adds <50MB peak memory usage
- **Load Time Impact**: Animation features add <500ms to initial app load
- **Bundle Size**: Animation code adds <100KB to production bundle

### Feature Usage Metrics
- **Most Used Prompts**: Track popular prompt patterns for library expansion
- **Timeline Adoption**: % of users who move from prompts to timeline editing
- **Preset Usage**: Most popular animation presets for future development
- **Export/Import**: Usage of animation template sharing features

---

## 🚀 Future Enhancements

### Phase 2 Additions (Post-Launch)
1. **AI-Powered Prompt Enhancement**
   - Integration with LLM for natural language understanding
   - Context-aware animation suggestions
   - Voice-to-animation capabilities

2. **Advanced Timeline Features**
   - Bezier curve editor for custom easing
   - Motion blur and advanced effects
   - 3D animation support

3. **Collaboration Features**
   - Shared animation libraries
   - Real-time collaborative editing
   - Animation version control

4. **Performance Optimizations**
   - GPU acceleration for complex animations
   - Animation streaming for large projects
   - Progressive loading for animation libraries

---

## 📋 Technical Specifications

### Browser Support
- **Chrome**: 90+ (full feature support)
- **Firefox**: 88+ (full feature support)
- **Safari**: 14+ (full feature support)
- **Edge**: 90+ (full feature support)

### Performance Requirements
- **Animation Smoothness**: 60fps sustained with 20+ simultaneous animations
- **Memory Usage**: <200MB peak with complex timeline projects
- **CPU Usage**: <15% additional CPU load during playback
- **Startup Time**: <2s to load animation system components

### Accessibility Features
- **Keyboard Navigation**: Full timeline control via keyboard
- **Screen Reader**: Comprehensive ARIA labels and descriptions
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Animation UI works in high contrast mode

---

## 🔚 Conclusion

This prompt-based animation system transforms HAL-9001 from a static visual builder into a dynamic animation powerhouse while maintaining our core architectural principles. By leveraging natural language processing, professional timeline controls, and seamless integration with existing systems, users can create sophisticated animations without learning complex keyframe interfaces.

The phased implementation approach ensures we can deliver value incrementally while building toward a comprehensive animation solution that rivals professional tools like After Effects, but specifically optimized for the HAL-9001 ecosystem.

**Ready for implementation approval and resource allocation.**

---

*Generated by HAL-9001 Animation System Planning Engine v1.0.0*
*For questions, contact the development team or reference the technical specifications above.*