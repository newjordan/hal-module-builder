/**
 * Effect Library Registry for HAL Builder Effects Asset System
 * Story 1.3d: Effects Asset System
 */

import { IEffect } from './IEffect';

export interface EffectRegistration {
  /** Effect instance */
  effect: IEffect;
  /** Registration timestamp */
  registeredAt: number;
  /** Whether effect is enabled */
  enabled: boolean;
  /** Registration metadata */
  metadata?: {
    registeredBy?: string;
    description?: string;
    tags?: string[];
  };
}

export interface LibraryStats {
  /** Total registered effects */
  totalEffects: number;
  /** Effects by category */
  byCategory: Record<string, number>;
  /** Enabled vs disabled effects */
  enabledCount: number;
  /** Library initialization time */
  initTime: number;
  /** Last modification time */
  lastModified: number;
}

/**
 * Singleton Effect Library Registry
 * Manages registration, discovery, and lifecycle of effects
 */
export class EffectLibrary {
  private static instance: EffectLibrary | null = null;
  private effects: Map<string, EffectRegistration> = new Map();
  private initTime: number;
  private lastModified: number;
  private eventListeners: Map<string, Array<(...args: any[]) => void>> =
    new Map();

  private constructor() {
    this.initTime = Date.now();
    this.lastModified = this.initTime;
    console.log('EffectLibrary initialized');
  }

  /**
   * Get singleton instance of EffectLibrary
   */
  public static getInstance(): EffectLibrary {
    if (!EffectLibrary.instance) {
      EffectLibrary.instance = new EffectLibrary();
    }
    return EffectLibrary.instance;
  }

  /**
   * Register a new effect in the library
   */
  public registerEffect(
    effect: IEffect,
    options?: {
      enabled?: boolean;
      registeredBy?: string;
      description?: string;
      tags?: string[];
    }
  ): boolean {
    try {
      const effectType = effect.metadata.type;

      // Validate effect before registration
      const validation = this.validateEffect(effect);
      if (!validation.isValid) {
        console.error(
          `Cannot register effect ${effectType}:`,
          validation.errors
        );
        return false;
      }

      // Check for duplicate registration
      if (this.effects.has(effectType)) {
        console.warn(`Effect ${effectType} is already registered. Skipping.`);
        return false;
      }

      // Create registration
      const metadata: {
        registeredBy?: string;
        description?: string;
        tags?: string[];
      } = {};
      if (options?.registeredBy !== undefined)
        metadata.registeredBy = options.registeredBy;
      if (options?.description !== undefined)
        metadata.description = options.description;
      if (options?.tags !== undefined) metadata.tags = options.tags;

      const registration: EffectRegistration = {
        effect,
        registeredAt: Date.now(),
        enabled: options?.enabled ?? true,
        metadata,
      };

      this.effects.set(effectType, registration);
      this.lastModified = Date.now();

      console.log(
        `Effect registered: ${effectType} (${effect.metadata.displayName})`
      );
      this.emit('effectRegistered', { effectType, effect });

      return true;
    } catch (error) {
      console.error(
        `Failed to register effect ${effect.metadata.type}:`,
        error
      );
      return false;
    }
  }

  /**
   * Unregister an effect from the library
   */
  public unregisterEffect(effectType: string): boolean {
    const registration = this.effects.get(effectType);
    if (!registration) {
      console.warn(`Effect ${effectType} not found for unregistration`);
      return false;
    }

    try {
      // Cleanup resources
      registration.effect.dispose();
      this.effects.delete(effectType);
      this.lastModified = Date.now();

      console.log(`Effect unregistered: ${effectType}`);
      this.emit('effectUnregistered', { effectType });

      return true;
    } catch (error) {
      console.error(`Failed to unregister effect ${effectType}:`, error);
      return false;
    }
  }

  /**
   * Get effect by type
   */
  public getEffect(effectType: string): IEffect | null {
    const registration = this.effects.get(effectType);
    return registration?.enabled ? registration.effect : null;
  }

  /**
   * Get effect registration info
   */
  public getEffectRegistration(effectType: string): EffectRegistration | null {
    return this.effects.get(effectType) || null;
  }

  /**
   * Get all registered effects
   */
  public getAllEffects(): Map<string, IEffect> {
    const result = new Map<string, IEffect>();
    for (const [type, registration] of this.effects) {
      if (registration.enabled) {
        result.set(type, registration.effect);
      }
    }
    return result;
  }

  /**
   * Get effects by category
   */
  public getEffectsByCategory(category: string): Map<string, IEffect> {
    const result = new Map<string, IEffect>();
    for (const [type, registration] of this.effects) {
      if (
        registration.enabled &&
        registration.effect.metadata.category === category
      ) {
        result.set(type, registration.effect);
      }
    }
    return result;
  }

  /**
   * Search effects by criteria
   */
  public searchEffects(criteria: {
    query?: string;
    category?: string;
    tags?: string[];
    author?: string;
  }): Map<string, IEffect> {
    const result = new Map<string, IEffect>();

    for (const [type, registration] of this.effects) {
      if (!registration.enabled) continue;

      const { effect } = registration;
      const metadata = effect.metadata;
      let matches = true;

      // Text search in name and description
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        const searchableText =
          `${metadata.displayName} ${metadata.description}`.toLowerCase();
        if (!searchableText.includes(query)) {
          matches = false;
        }
      }

      // Category filter
      if (criteria.category && metadata.category !== criteria.category) {
        matches = false;
      }

      // Tags filter
      if (criteria.tags && criteria.tags.length > 0) {
        const effectTags = registration.metadata?.tags || [];
        const hasMatchingTag = criteria.tags.some(tag =>
          effectTags.includes(tag)
        );
        if (!hasMatchingTag) {
          matches = false;
        }
      }

      // Author filter
      if (criteria.author && metadata.author !== criteria.author) {
        matches = false;
      }

      if (matches) {
        result.set(type, effect);
      }
    }

    return result;
  }

  /**
   * Enable or disable an effect
   */
  public setEffectEnabled(effectType: string, enabled: boolean): boolean {
    const registration = this.effects.get(effectType);
    if (!registration) {
      console.warn(`Effect ${effectType} not found`);
      return false;
    }

    registration.enabled = enabled;
    this.lastModified = Date.now();

    console.log(`Effect ${effectType} ${enabled ? 'enabled' : 'disabled'}`);
    this.emit('effectToggled', { effectType, enabled });

    return true;
  }

  /**
   * Get library statistics
   */
  public getStats(): LibraryStats {
    const byCategory: Record<string, number> = {};
    let enabledCount = 0;

    for (const registration of this.effects.values()) {
      const category = registration.effect.metadata.category;
      byCategory[category] = (byCategory[category] || 0) + 1;

      if (registration.enabled) {
        enabledCount++;
      }
    }

    return {
      totalEffects: this.effects.size,
      byCategory,
      enabledCount,
      initTime: this.initTime,
      lastModified: this.lastModified,
    };
  }

  /**
   * Check if effect type is available
   */
  public hasEffect(effectType: string): boolean {
    return (
      this.effects.has(effectType) && this.effects.get(effectType)!.enabled
    );
  }

  /**
   * List all available effect types
   */
  public getAvailableTypes(): string[] {
    const types: string[] = [];
    for (const [type, registration] of this.effects) {
      if (registration.enabled) {
        types.push(type);
      }
    }
    return types.sort();
  }

  /**
   * Clear all effects (for testing/reset)
   */
  public clear(): void {
    // Dispose all effects first
    for (const registration of this.effects.values()) {
      try {
        registration.effect.dispose();
      } catch (error) {
        console.warn('Error disposing effect during clear:', error);
      }
    }

    this.effects.clear();
    this.lastModified = Date.now();
    this.emit('libraryCleared');

    console.log('Effect library cleared');
  }

  /**
   * Validate effect before registration
   */
  private validateEffect(effect: IEffect): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check metadata
    if (!effect.metadata) {
      errors.push('Effect metadata is required');
    } else {
      if (!effect.metadata.type) {
        errors.push('Effect type is required');
      }
      if (!effect.metadata.displayName) {
        errors.push('Effect display name is required');
      }
      if (!effect.metadata.version) {
        errors.push('Effect version is required');
      }
      if (!effect.metadata.category) {
        errors.push('Effect category is required');
      }
    }

    // Check required methods
    if (typeof effect.process !== 'function') {
      errors.push('Effect must implement process method');
    }
    if (typeof effect.getParameterDescriptors !== 'function') {
      errors.push('Effect must implement getParameterDescriptors method');
    }
    if (typeof effect.validateParameters !== 'function') {
      errors.push('Effect must implement validateParameters method');
    }

    // Check default parameters
    if (!effect.defaultParameters) {
      errors.push('Effect must provide default parameters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Event system for library changes
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get library version info
   */
  public getVersion(): { version: string; buildDate: string } {
    return {
      version: '1.0.0',
      buildDate: new Date().toISOString(),
    };
  }

  /**
   * Export library state for debugging
   */
  public exportState(): any {
    const state = {
      version: this.getVersion(),
      stats: this.getStats(),
      effects: {},
    };

    for (const [type, registration] of this.effects) {
      (state.effects as any)[type] = {
        metadata: registration.effect.metadata,
        enabled: registration.enabled,
        registeredAt: registration.registeredAt,
        parameterCount: registration.effect.getParameterDescriptors().length,
      };
    }

    return state;
  }
}
