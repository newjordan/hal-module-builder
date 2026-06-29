/**
 * ID Generation Utilities for HAL Builder
 * Provides consistent, unique ID generation for layers, presets, and other entities
 */

/**
 * Generate a UUID-like unique identifier
 * Uses crypto.getRandomValues when available, falls back to Math.random
 */
export const generateUniqueId = (prefix?: string): string => {
  const timestamp = Date.now().toString(36);
  let randomPart: string;

  // Use crypto.getRandomValues for better randomness if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    randomPart = Array.from(array, byte => byte.toString(36)).join('');
  } else {
    // Fallback to Math.random
    randomPart = Math.random().toString(36).substring(2, 15);
  }

  const baseId = `${timestamp}_${randomPart}`;
  return prefix ? `${prefix}_${baseId}` : baseId;
};

/**
 * Generate a unique layer ID
 */
export const generateLayerId = (): string => {
  return generateUniqueId('layer');
};

/**
 * Generate a unique preset ID
 */
export const generatePresetId = (): string => {
  return generateUniqueId('preset');
};

/**
 * Generate a unique group ID
 */
export const generateGroupId = (): string => {
  return generateUniqueId('group');
};

/**
 * Validate that an ID is unique within a collection
 */
export const ensureUniqueId = <T extends { id: string }>(
  collection: T[],
  candidateId: string,
  prefix?: string
): string => {
  const existingIds = new Set(collection.map(item => item.id));

  let uniqueId = candidateId;
  let counter = 1;

  // If the candidate ID already exists, generate a new one
  while (existingIds.has(uniqueId)) {
    uniqueId = prefix
      ? `${prefix}_${Date.now()}_${counter}`
      : `${candidateId}_${counter}`;
    counter++;
  }

  return uniqueId;
};

/**
 * Check if an ID has a valid format
 */
export const isValidId = (id: string): boolean => {
  // ID should be a non-empty string with no whitespace
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    !/\s/.test(id) &&
    id.trim() === id
  );
};

/**
 * Sanitize a name to be used as an ID base
 */
export const sanitizeForId = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

/**
 * Generate an ID based on a name with uniqueness checking
 */
export const generateIdFromName = <T extends { id: string }>(
  collection: T[],
  name: string,
  prefix?: string
): string => {
  const sanitizedName = sanitizeForId(name) || 'item';
  const baseId = prefix ? `${prefix}_${sanitizedName}` : sanitizedName;
  return ensureUniqueId(collection, baseId, prefix);
};
