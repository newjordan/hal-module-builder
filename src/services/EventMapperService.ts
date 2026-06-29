import { HalEvent, EventMapping, VisualCommand } from '../types/widget-types';

export class EventMapperService {
  private mappings: EventMapping[] = [];
  private defaultMappings: EventMapping[] = [];

  constructor() {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings() {
    this.defaultMappings = [
      // LLM/AI Events
      {
        pattern: /^llm\.thinking$/,
        effect: 'spiral',
        color: '#44aaff',
        intensity: 0.6,
        duration: 2000,
      },
      {
        pattern: /^llm\.response$/,
        effect: 'pulse',
        color: '#44ff88',
        intensity: 0.7,
        duration: 1500,
      },
      {
        pattern: /^llm\.error$/,
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.8,
        duration: 1000,
      },
      {
        pattern: /^llm\.token$/,
        effect: 'pulse',
        color: '#88aaff',
        intensity: 0.3,
        duration: 200,
      },

      // API Events
      {
        pattern: /^api\.request$/,
        effect: 'pulse',
        color: '#aa44ff',
        intensity: 0.4,
        duration: 800,
      },
      {
        pattern: /^api\.response\.2\d{2}$/,
        effect: 'wave',
        color: '#44ff44',
        intensity: 0.5,
        duration: 1000,
      },
      {
        pattern: /^api\.response\.4\d{2}$/,
        effect: 'flash',
        color: '#ffaa44',
        intensity: 0.6,
        duration: 800,
      },
      {
        pattern: /^api\.response\.5\d{2}$/,
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.8,
        duration: 1200,
      },

      // Development Events
      {
        pattern: /^build\.start$/,
        effect: 'spiral',
        color: '#ffff44',
        intensity: 0.5,
        duration: 1500,
      },
      {
        pattern: /^build\.success$/,
        effect: 'wave',
        color: '#44ff44',
        intensity: 0.8,
        duration: 2000,
      },
      {
        pattern: /^build\.fail$/,
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.9,
        duration: 1500,
      },
      {
        pattern: /^test\.pass$/,
        effect: 'pulse',
        color: '#44ff88',
        intensity: 0.6,
        duration: 1000,
      },
      {
        pattern: /^test\.fail$/,
        effect: 'flash',
        color: '#ff6644',
        intensity: 0.7,
        duration: 800,
      },

      // System Events
      {
        pattern: /^system\.cpu\.high$/,
        effect: 'pulse',
        color: '#ff8844',
        intensity: 0.7,
        duration: 3000,
        transform: event => ({
          ...event,
          intensity: Math.min(1, (event.data?.value || 0.5) + 0.3),
        }),
      },
      {
        pattern: /^system\.memory\.warning$/,
        effect: 'wave',
        color: '#ffaa44',
        intensity: 0.6,
        duration: 2000,
      },
      {
        pattern: /^system\.error$/,
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.9,
        duration: 1000,
      },

      // Generic Events
      {
        pattern: /^error/,
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.7,
        duration: 1000,
      },
      {
        pattern: /^success/,
        effect: 'wave',
        color: '#44ff44',
        intensity: 0.6,
        duration: 1500,
      },
      {
        pattern: /^warning/,
        effect: 'flash',
        color: '#ffaa44',
        intensity: 0.5,
        duration: 800,
      },
      {
        pattern: /^info/,
        effect: 'pulse',
        color: '#4488ff',
        intensity: 0.4,
        duration: 1000,
      },
    ];
  }

  addMapping(mapping: EventMapping): void {
    this.mappings.push(mapping);
  }

  removeMapping(index: number): void {
    if (index >= 0 && index < this.mappings.length) {
      this.mappings.splice(index, 1);
    }
  }

  clearMappings(): void {
    this.mappings = [];
  }

  getMappings(): EventMapping[] {
    return [...this.mappings];
  }

  getDefaultMappings(): EventMapping[] {
    return [...this.defaultMappings];
  }

  mapEventToVisual(event: HalEvent): VisualCommand | null {
    // Try custom mappings first
    const customMapping = this.findMatchingMapping(event, this.mappings);
    if (customMapping) {
      return this.createVisualCommand(event, customMapping);
    }

    // Try default mappings
    const defaultMapping = this.findMatchingMapping(
      event,
      this.defaultMappings
    );
    if (defaultMapping) {
      return this.createVisualCommand(event, defaultMapping);
    }

    // No mapping found, create a basic visual
    return this.createFallbackVisual(event);
  }

  private findMatchingMapping(
    event: HalEvent,
    mappings: EventMapping[]
  ): EventMapping | null {
    for (const mapping of mappings) {
      if (this.eventMatches(event, mapping)) {
        return mapping;
      }
    }
    return null;
  }

  private eventMatches(event: HalEvent, mapping: EventMapping): boolean {
    // Check pattern match
    let patternMatches = false;

    if (typeof mapping.pattern === 'string') {
      patternMatches = event.type === mapping.pattern;
    } else if (mapping.pattern instanceof RegExp) {
      patternMatches = mapping.pattern.test(event.type);
    }

    if (!patternMatches) {
      return false;
    }

    // Check optional condition
    if (mapping.condition && !mapping.condition(event)) {
      return false;
    }

    return true;
  }

  private createVisualCommand(
    event: HalEvent,
    mapping: EventMapping
  ): VisualCommand {
    let transformedEvent = event;

    // Apply transformation if provided
    if (mapping.transform) {
      const transformed = mapping.transform(event);
      transformedEvent = { ...event, ...transformed };
    }

    // Use mapping properties, falling back to event properties, then defaults
    const effect = transformedEvent.effect || mapping.effect;
    const color =
      transformedEvent.color ||
      mapping.color ||
      this.getDefaultColor(event.type);
    const intensity = transformedEvent.intensity ?? mapping.intensity ?? 0.5;
    const duration = transformedEvent.duration ?? mapping.duration ?? 1000;

    return {
      effect,
      timestamp: transformedEvent.timestamp || Date.now(),
      properties: {
        color,
        intensity,
        duration,
        ...transformedEvent.data,
      },
    };
  }

  private createFallbackVisual(event: HalEvent): VisualCommand {
    const effect = event.effect || 'pulse';
    const color = event.color || this.getDefaultColor(event.type);
    const intensity = event.intensity ?? 0.5;
    const duration = event.duration ?? 1000;

    return {
      effect,
      timestamp: event.timestamp || Date.now(),
      properties: {
        color,
        intensity,
        duration,
        ...event.data,
      },
    };
  }

  private getDefaultColor(eventType: string): string {
    const lowerType = eventType.toLowerCase();

    if (lowerType.includes('error')) return '#ff4444';
    if (lowerType.includes('success') || lowerType.includes('pass'))
      return '#44ff44';
    if (lowerType.includes('warning') || lowerType.includes('warn'))
      return '#ffaa44';
    if (lowerType.includes('info')) return '#4488ff';
    if (lowerType.includes('llm') || lowerType.includes('ai')) return '#44aaff';
    if (lowerType.includes('api') || lowerType.includes('http'))
      return '#aa44ff';
    if (lowerType.includes('build') || lowerType.includes('deploy'))
      return '#ffff44';
    if (lowerType.includes('test')) return '#44ffaa';
    if (
      lowerType.includes('system') ||
      lowerType.includes('cpu') ||
      lowerType.includes('memory')
    )
      return '#ff8844';

    return '#44aaff'; // Default blue
  }

  // Utility methods for common event patterns
  createLLMMapping(config: {
    thinking?: Partial<EventMapping>;
    response?: Partial<EventMapping>;
    error?: Partial<EventMapping>;
    token?: Partial<EventMapping>;
  }): EventMapping[] {
    const mappings: EventMapping[] = [];

    if (config.thinking) {
      mappings.push({
        pattern: /^llm\.thinking$/,
        effect: 'spiral',
        color: '#44aaff',
        intensity: 0.6,
        duration: 2000,
        ...config.thinking,
      });
    }

    if (config.response) {
      mappings.push({
        pattern: /^llm\.response$/,
        effect: 'pulse',
        color: '#44ff88',
        intensity: 0.7,
        duration: 1500,
        ...config.response,
      });
    }

    if (config.error) {
      mappings.push({
        pattern: /^llm\.error$/,
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.8,
        duration: 1000,
        ...config.error,
      });
    }

    if (config.token) {
      mappings.push({
        pattern: /^llm\.token$/,
        effect: 'pulse',
        color: '#88aaff',
        intensity: 0.3,
        duration: 200,
        ...config.token,
      });
    }

    return mappings;
  }

  createAPIMapping(config: {
    request?: Partial<EventMapping>;
    success?: Partial<EventMapping>;
    clientError?: Partial<EventMapping>;
    serverError?: Partial<EventMapping>;
  }): EventMapping[] {
    const mappings: EventMapping[] = [];

    if (config.request) {
      mappings.push({
        pattern: /^api\.request$/,
        effect: 'pulse',
        color: '#aa44ff',
        intensity: 0.4,
        duration: 800,
        ...config.request,
      });
    }

    if (config.success) {
      mappings.push({
        pattern: /^api\.response\.2\d{2}$/,
        effect: 'wave',
        color: '#44ff44',
        intensity: 0.5,
        duration: 1000,
        ...config.success,
      });
    }

    if (config.clientError) {
      mappings.push({
        pattern: /^api\.response\.4\d{2}$/,
        effect: 'flash',
        color: '#ffaa44',
        intensity: 0.6,
        duration: 800,
        ...config.clientError,
      });
    }

    if (config.serverError) {
      mappings.push({
        pattern: /^api\.response\.5\d{2}$/,
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.8,
        duration: 1200,
        ...config.serverError,
      });
    }

    return mappings;
  }

  // Export mappings to JSON
  exportMappings(): string {
    return JSON.stringify(
      {
        custom: this.mappings,
        timestamp: Date.now(),
      },
      null,
      2
    );
  }

  // Import mappings from JSON
  importMappings(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.custom && Array.isArray(data.custom)) {
        this.mappings = data.custom.map((mapping: any) => ({
          ...mapping,
          pattern:
            typeof mapping.pattern === 'string'
              ? mapping.pattern
              : new RegExp(mapping.pattern.source, mapping.pattern.flags),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import mappings:', error);
      return false;
    }
  }
}
