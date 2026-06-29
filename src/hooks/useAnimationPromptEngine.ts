import { useState, useCallback } from 'react';
import { Layer } from '../types/layer-types';

/**
 * Animation sequence definition for generated content
 */
export interface AnimationSequence {
  id: string;
  name: string;
  description: string;
  layers: Layer[];
  duration: number;
  variations?: string[];
}

/**
 * Result from prompt parsing
 */
export interface AnimationPromptResult {
  sequence: AnimationSequence;
  confidence: number;
  suggestions: string[];
}

/**
 * Configuration for prompt engine
 */
export interface PromptEngineConfig {
  customPrompts?: Record<string, () => AnimationSequence>;
  aiEnabled?: boolean;
  fallbackMode?: 'preset' | 'generate';
  maxSuggestions?: number;
}

/**
 * Generate unique ID for animations
 */
const generateId = () =>
  `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Default prompt library with system-specific animations
 * These cover the most common HAL-9001 use cases
 */
const defaultPromptLibrary: Record<string, () => AnimationSequence> = {
  // Connection/Startup animations
  'intro animation where a glowing dot pops up and begins to glow': () => ({
    id: generateId(),
    name: 'Connection Startup Sequence',
    description: 'A glowing dot appears with pop effect and begins pulsing',
    duration: 3000,
    layers: [
      {
        id: generateId(),
        name: 'Connection Indicator',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 0,
        scale: 0.1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor: '#14b8a6',
        strokeType: 'none',
        strokeWidth: 0,
        glowIntensity: 0,
        glowColor: '#14b8a6',
        // Animation will be applied via existing useLayerAnimation
        animation: 'custom',
        animationSpeed: 1,
      } as Layer,
    ],
    variations: [
      'startup animation with pulsing dot',
      'connection indicator with glow effect',
      'intro sequence with animated circle',
    ],
  }),

  'glowing dot pops up and begins to glow': () =>
    defaultPromptLibrary[
      'intro animation where a glowing dot pops up and begins to glow'
    ]!(),

  'startup animation': () => ({
    id: generateId(),
    name: 'System Startup',
    description: 'Professional application startup sequence',
    duration: 4000,
    layers: [
      {
        id: generateId(),
        name: 'Startup Background',
        type: 'shape',
        shapeType: 'rectangle',
        visible: true,
        opacity: 0,
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'gradient',
        fillGradient: {
          type: 'radial',
          colors: ['rgba(20, 184, 166, 0.1)', 'transparent'],
          stops: [0, 1],
          centerX: 0.5,
          centerY: 0.5,
        },
        strokeType: 'none',
        animation: 'custom',
      } as Layer,
      {
        id: generateId(),
        name: 'HAL Logo',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 0,
        scale: 0,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor: '#14b8a6',
        strokeType: 'solid',
        strokeColor: '#0d9488',
        strokeWidth: 2,
        glowIntensity: 0,
        glowColor: '#14b8a6',
        animation: 'custom',
      } as Layer,
    ],
  }),

  // Loading animations
  'loading animation': () => ({
    id: generateId(),
    name: 'Loading Spinner',
    description: 'Elegant spinning loader with gradient ring',
    duration: 2000,
    layers: [
      {
        id: generateId(),
        name: 'Loading Ring',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 1,
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'none',
        strokeType: 'gradient',
        strokeWidth: 4,
        strokeGradient: {
          type: 'conic',
          colors: ['#14b8a6', 'transparent', '#14b8a6'],
          stops: [0, 0.5, 1],
        },
        animation: 'rotate',
        animationSpeed: 1,
      } as Layer,
    ],
    variations: [
      'loading spinner',
      'spinning loader',
      'circular loading indicator',
    ],
  }),

  'loading spinner': () => defaultPromptLibrary['loading animation']!(),
  'spinning loader': () => defaultPromptLibrary['loading animation']!(),

  // Error states
  'error animation': () => ({
    id: generateId(),
    name: 'Error Indicator',
    description: 'Red pulsing error state with urgency',
    duration: 1500,
    layers: [
      {
        id: generateId(),
        name: 'Error Pulse',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 1,
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor: '#ef4444',
        strokeType: 'solid',
        strokeColor: '#dc2626',
        strokeWidth: 2,
        glowIntensity: 0.6,
        glowColor: '#ef4444',
        animation: 'pulse',
        animationSpeed: 2,
      } as Layer,
    ],
    variations: [
      'error state with red pulse',
      'red pulsing indicator',
      'error notification animation',
    ],
  }),

  'error state': () => defaultPromptLibrary['error animation']!(),

  // Success animations
  'success animation': () => ({
    id: generateId(),
    name: 'Success Celebration',
    description: 'Green checkmark with celebratory effect',
    duration: 2500,
    layers: [
      {
        id: generateId(),
        name: 'Success Background',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 0,
        scale: 0.5,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor: 'rgba(34, 197, 94, 0.2)',
        strokeType: 'none',
        animation: 'custom',
      } as Layer,
      {
        id: generateId(),
        name: 'Success Icon',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 0,
        scale: 0,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor: '#22c55e',
        strokeType: 'solid',
        strokeColor: '#16a34a',
        strokeWidth: 3,
        glowIntensity: 0.4,
        glowColor: '#22c55e',
        animation: 'custom',
      } as Layer,
    ],
    variations: [
      'success celebration',
      'green checkmark animation',
      'completion indicator',
    ],
  }),

  'success celebration': () => defaultPromptLibrary['success animation']!(),

  // Connection states
  'connection animation': () => ({
    id: generateId(),
    name: 'Connection Established',
    description: 'Expanding circles showing connection establishment',
    duration: 3500,
    layers: [
      {
        id: generateId(),
        name: 'Connection Wave 1',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 0.8,
        scale: 0.2,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'none',
        strokeType: 'solid',
        strokeColor: '#14b8a6',
        strokeWidth: 2,
        animation: 'custom',
      } as Layer,
      {
        id: generateId(),
        name: 'Connection Wave 2',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 0.6,
        scale: 0.1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'none',
        strokeType: 'solid',
        strokeColor: '#0d9488',
        strokeWidth: 1,
        animation: 'custom',
      } as Layer,
      {
        id: generateId(),
        name: 'Connection Core',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 1,
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor: '#14b8a6',
        glowIntensity: 0.8,
        glowColor: '#14b8a6',
        animation: 'pulse',
      } as Layer,
    ],
    variations: [
      'connection established',
      'expanding circles',
      'network connection animation',
    ],
  }),

  'connection established': () =>
    defaultPromptLibrary['connection animation']!(),
};

/**
 * Pattern-based prompt matching
 * Analyzes prompt text for semantic meaning
 */
const analyzePromptSemantics = (
  prompt: string
): {
  intent: string;
  elements: string[];
  modifiers: string[];
} => {
  const lowercasePrompt = prompt.toLowerCase();

  // Intent keywords
  const intents = {
    startup: ['intro', 'startup', 'start', 'boot', 'initialize', 'launch'],
    loading: ['loading', 'load', 'spinner', 'spin', 'processing', 'wait'],
    error: ['error', 'fail', 'wrong', 'problem', 'issue', 'alert'],
    success: ['success', 'complete', 'done', 'finish', 'achieve', 'win'],
    connection: ['connect', 'connection', 'link', 'network', 'establish'],
  };

  // Element keywords
  const elements = {
    dot: ['dot', 'point', 'circle', 'spot'],
    glow: ['glow', 'light', 'shine', 'bright', 'illuminate'],
    pulse: ['pulse', 'beat', 'throb', 'pulsing'],
    spin: ['spin', 'rotate', 'turn', 'revolve'],
    expand: ['expand', 'grow', 'spread', 'enlarge'],
    fade: ['fade', 'appear', 'disappear', 'transparent'],
  };

  // Modifiers
  const modifiers = {
    slow: ['slow', 'gentle', 'gradual', 'smooth'],
    fast: ['fast', 'quick', 'rapid', 'swift'],
    bright: ['bright', 'vivid', 'intense', 'strong'],
    subtle: ['subtle', 'soft', 'gentle', 'light'],
  };

  // Find matches
  let detectedIntent = 'startup'; // default
  const detectedElements: string[] = [];
  const detectedModifiers: string[] = [];

  // Check intents
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowercasePrompt.includes(keyword))) {
      detectedIntent = intent;
      break;
    }
  }

  // Check elements
  for (const [element, keywords] of Object.entries(elements)) {
    if (keywords.some(keyword => lowercasePrompt.includes(keyword))) {
      detectedElements.push(element);
    }
  }

  // Check modifiers
  for (const [modifier, keywords] of Object.entries(modifiers)) {
    if (keywords.some(keyword => lowercasePrompt.includes(keyword))) {
      detectedModifiers.push(modifier);
    }
  }

  return {
    intent: detectedIntent,
    elements: detectedElements,
    modifiers: detectedModifiers,
  };
};

/**
 * Find semantic matches in prompt library
 */
const findSemanticMatch = (
  prompt: string,
  library: Record<string, () => AnimationSequence>
): { result?: () => AnimationSequence; confidence: number } => {
  const semantics = analyzePromptSemantics(prompt);

  // Check for intent-based matches
  const intentMatches = Object.keys(library).filter(key => {
    const keySemantics = analyzePromptSemantics(key);
    return keySemantics.intent === semantics.intent;
  });

  if (intentMatches.length > 0) {
    // Find best match based on element overlap
    let bestMatch = intentMatches[0]!;
    let maxElementOverlap = 0;

    intentMatches.forEach(match => {
      const matchSemantics = analyzePromptSemantics(match);
      const overlap = semantics.elements.filter(elem =>
        matchSemantics.elements.includes(elem)
      ).length;

      if (overlap > maxElementOverlap) {
        maxElementOverlap = overlap;
        bestMatch = match;
      }
    });

    const confidence = 0.7 + maxElementOverlap * 0.1;
    const matchResult = library[bestMatch];
    if (matchResult) {
      return {
        result: matchResult,
        confidence: Math.min(confidence, 0.95),
      };
    }
  }

  return { confidence: 0 };
};

/**
 * Generate suggestions based on prompt library
 */
const generateSuggestions = (
  prompt: string,
  library: Record<string, () => AnimationSequence>,
  maxSuggestions: number = 5
): string[] => {
  const lowercasePrompt = prompt.toLowerCase();
  const suggestions = new Set<string>();

  // Add exact partial matches
  Object.keys(library).forEach(key => {
    if (
      key.toLowerCase().includes(lowercasePrompt) ||
      lowercasePrompt.includes(key.toLowerCase())
    ) {
      suggestions.add(key);
    }
  });

  // Add semantic matches
  const semantics = analyzePromptSemantics(prompt);
  Object.keys(library).forEach(key => {
    const keySemantics = analyzePromptSemantics(key);
    if (keySemantics.intent === semantics.intent) {
      suggestions.add(key);
    }
  });

  // Add variations from matching sequences
  Array.from(suggestions).forEach(suggestion => {
    const generator = library[suggestion];
    if (!generator) return;
    const sequence = generator();
    if (sequence.variations) {
      sequence.variations.forEach(variation => suggestions.add(variation));
    }
  });

  return Array.from(suggestions).slice(0, maxSuggestions);
};

/**
 * Generate fallback animation when no matches found
 */
const generateFallback = (prompt: string): AnimationSequence => {
  const semantics = analyzePromptSemantics(prompt);

  // Create a basic animation based on detected semantics
  return {
    id: generateId(),
    name: 'Generated Animation',
    description: `Basic animation based on: ${prompt}`,
    duration: 2000,
    layers: [
      {
        id: generateId(),
        name: 'Generated Element',
        type: 'shape',
        shapeType: 'circle',
        visible: true,
        opacity: 1,
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor:
          semantics.intent === 'error'
            ? '#ef4444'
            : semantics.intent === 'success'
              ? '#22c55e'
              : '#14b8a6',
        strokeType: 'none',
        animation: semantics.elements.includes('pulse')
          ? 'pulse'
          : semantics.elements.includes('spin')
            ? 'rotate'
            : 'custom',
      } as Layer,
    ],
  };
};

/**
 * Hook for animation prompt processing
 * Single Responsibility: Parse natural language prompts into animation sequences
 */
export const useAnimationPromptEngine = (config: PromptEngineConfig = {}) => {
  const [promptLibrary, setPromptLibrary] = useState(() => ({
    ...defaultPromptLibrary,
    ...config.customPrompts,
  }));
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Parse a natural language prompt into animation sequence
   */
  const parsePrompt = useCallback(
    async (prompt: string): Promise<AnimationPromptResult> => {
      if (!prompt.trim()) {
        throw new Error('Empty prompt provided');
      }

      setIsProcessing(true);

      try {
        // 1. Try exact match first
        const exactMatch = promptLibrary[prompt.toLowerCase().trim()];
        if (exactMatch) {
          const sequence = exactMatch();
          return {
            sequence,
            confidence: 1.0,
            suggestions: sequence.variations || [],
          };
        }

        // 2. Try semantic analysis
        const semanticMatch = findSemanticMatch(prompt, promptLibrary);
        if (semanticMatch.result && semanticMatch.confidence > 0.7) {
          const sequence = semanticMatch.result();
          return {
            sequence,
            confidence: semanticMatch.confidence,
            suggestions: generateSuggestions(
              prompt,
              promptLibrary,
              config.maxSuggestions
            ),
          };
        }

        // 3. Generate fallback
        const fallbackSequence = generateFallback(prompt);
        return {
          sequence: fallbackSequence,
          confidence: 0.3,
          suggestions: generateSuggestions(
            prompt,
            promptLibrary,
            config.maxSuggestions
          ),
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [promptLibrary, config.maxSuggestions]
  );

  /**
   * Add custom prompt to library
   */
  const addCustomPrompt = useCallback(
    (prompt: string, generator: () => AnimationSequence) => {
      setPromptLibrary(prev => ({
        ...prev,
        [prompt.toLowerCase().trim()]: generator,
      }));
    },
    []
  );

  /**
   * Get all available prompts
   */
  const getAvailablePrompts = useCallback(() => {
    return Object.keys(promptLibrary);
  }, [promptLibrary]);

  /**
   * Get suggestions for partial input
   */
  const getSuggestions = useCallback(
    (partial: string) => {
      if (partial.length < 2) return [];
      return generateSuggestions(partial, promptLibrary, config.maxSuggestions);
    },
    [promptLibrary, config.maxSuggestions]
  );

  /**
   * Get prompts by category/intent
   */
  const getPromptsByIntent = useCallback(
    (intent: string) => {
      return Object.keys(promptLibrary).filter(prompt => {
        const semantics = analyzePromptSemantics(prompt);
        return semantics.intent === intent;
      });
    },
    [promptLibrary]
  );

  return {
    // Core functionality
    parsePrompt,
    isProcessing,

    // Library management
    addCustomPrompt,
    getAvailablePrompts,
    getSuggestions,
    getPromptsByIntent,

    // Utility
    promptLibrary: Object.keys(promptLibrary),
    librarySize: Object.keys(promptLibrary).length,
  };
};

export default useAnimationPromptEngine;
