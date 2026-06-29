/**
 * HAL Radial Lens System - Focused on circular lens interfaces for AI/robots
 * Makes ANY content (text, images, components) look perfect in circular arrangements
 */

import { useMemo, useCallback } from 'react';

export interface RadialLensConfig {
  // Core lens geometry
  radius: number;
  centerX: number;
  centerY: number;

  // Content arrangement
  startAngle?: number; // Default: 0 (top)
  endAngle?: number; // Default: 360 (full circle)

  // Content behavior
  contentMode: 'maintain' | 'follow-radius' | 'follow-tangent';
  alignment: 'inner' | 'center' | 'outer';

  // Spacing and sizing
  autoSize?: boolean; // Auto-calculate optimal sizes
  minSpacing?: number; // Minimum space between items
  maxItemSize?: number; // Maximum size for auto-sizing

  // Visual enhancements for lens design
  perspective?: number; // 3D depth effect (0-1)
  fadeEdges?: boolean; // Fade items at circle edges
}

export interface RadialLensItem {
  // Position in 3D space (for lens depth)
  x: number;
  y: number;
  z?: number;

  // Rotation for content orientation
  rotation: number;

  // Auto-calculated sizing
  scale: number;

  // Visual properties for lens design
  opacity: number;
  depth: number;

  // CSS transform string (ready to use)
  transform: string;
}

export interface RadialLensHook {
  // Get position for single item
  getItemTransform: (index: number, total: number) => RadialLensItem;

  // Get positions for all items
  getAllTransforms: (count: number) => RadialLensItem[];

  // Utility for measuring content
  calculateOptimalSize: (
    contentWidth: number,
    contentHeight: number,
    total: number
  ) => number;

  // Lens configuration
  config: RadialLensConfig;
}

export function useRadialLens(config: RadialLensConfig): RadialLensHook {
  // Normalize angles to radians
  const startAngle = useMemo(
    () => (((config.startAngle || 0) - 90) * Math.PI) / 180,
    [config.startAngle]
  );

  const endAngle = useMemo(
    () => (((config.endAngle || 360) - 90) * Math.PI) / 180,
    [config.endAngle]
  );

  const angleRange = useMemo(
    () => endAngle - startAngle,
    [startAngle, endAngle]
  );

  // Calculate optimal item size based on content and circle
  const calculateOptimalSize = useCallback(
    (contentWidth: number, contentHeight: number, total: number): number => {
      if (!config.autoSize) return 1;

      // Calculate available arc length
      const arcLength = config.radius * angleRange;
      const availableSpacePerItem = arcLength / total;

      // Account for minimum spacing
      const spacing = config.minSpacing || 10;
      const maxContentSize = availableSpacePerItem - spacing;

      // Calculate scale needed to fit content
      const maxDimension = Math.max(contentWidth, contentHeight);
      const optimalScale = Math.min(
        maxContentSize / maxDimension,
        config.maxItemSize || 1.5
      );

      return Math.max(0.3, optimalScale); // Minimum scale of 0.3
    },
    [config, angleRange]
  );

  // Get transform for a single item
  const getItemTransform = useCallback(
    (index: number, total: number): RadialLensItem => {
      // Calculate position angle
      const progress = total > 1 ? index / (total - 1) : 0;
      const angle = startAngle + progress * angleRange;

      // Base position on circle
      let x = config.centerX + Math.cos(angle) * config.radius;
      let y = config.centerY + Math.sin(angle) * config.radius;

      // Adjust for alignment (inner/center/outer)
      if (config.alignment === 'inner') {
        const inwardOffset = config.radius * 0.2;
        x = config.centerX + Math.cos(angle) * (config.radius - inwardOffset);
        y = config.centerY + Math.sin(angle) * (config.radius - inwardOffset);
      } else if (config.alignment === 'outer') {
        const outwardOffset = config.radius * 0.2;
        x = config.centerX + Math.cos(angle) * (config.radius + outwardOffset);
        y = config.centerY + Math.sin(angle) * (config.radius + outwardOffset);
      }

      // Calculate rotation based on content mode
      let rotation = 0;
      switch (config.contentMode) {
        case 'follow-radius':
          rotation = angle + Math.PI / 2; // Point outward from center
          break;
        case 'follow-tangent':
          rotation = angle + Math.PI; // Follow circle direction
          break;
        case 'maintain':
        default:
          rotation = 0; // Keep original orientation (e.g., text stays readable)
          break;
      }

      // Calculate scale (auto-sizing for lens design)
      const baseScale = config.autoSize
        ? calculateOptimalSize(100, 20, total)
        : 1;

      // Apply perspective scaling (items further from center appear smaller)
      const distanceFromCenter = Math.sqrt(
        Math.pow(x - config.centerX, 2) + Math.pow(y - config.centerY, 2)
      );
      const perspectiveScale = config.perspective
        ? 1 - (distanceFromCenter / (config.radius * 2)) * config.perspective
        : 1;

      const finalScale = baseScale * perspectiveScale;

      // Calculate opacity for edge fading
      let opacity = 1;
      if (config.fadeEdges) {
        const edgeDistance = Math.min(
          Math.abs(progress),
          Math.abs(progress - 1)
        );
        opacity = Math.max(0.3, edgeDistance * 2);
      }

      // Calculate depth (for 3D lens effects)
      const depth = config.perspective
        ? (distanceFromCenter / config.radius) * config.perspective
        : 0;

      // Create CSS transform string
      const transform = `translate(${x}px, ${y}px) rotate(${rotation}rad) scale(${finalScale})`;

      return {
        x,
        y,
        z: depth * 50, // Convert to z-index friendly number
        rotation,
        scale: finalScale,
        opacity,
        depth,
        transform,
      };
    },
    [config, startAngle, angleRange, calculateOptimalSize]
  );

  // Get all transforms in batch
  const getAllTransforms = useCallback(
    (count: number): RadialLensItem[] => {
      return Array.from({ length: count }, (_, index) =>
        getItemTransform(index, count)
      );
    },
    [getItemTransform]
  );

  return {
    getItemTransform,
    getAllTransforms,
    calculateOptimalSize,
    config,
  };
}

// ===== Preset Lens Configurations =====

export const LensPresets = {
  // Classic HAL interface - clean and readable
  halClassic: (
    centerX: number,
    centerY: number,
    radius = 120
  ): RadialLensConfig => ({
    radius,
    centerX,
    centerY,
    contentMode: 'maintain', // Keep text readable
    alignment: 'center',
    autoSize: true,
    minSpacing: 15,
    perspective: 0.1, // Subtle depth
    fadeEdges: false,
  }),

  // Futuristic robot lens - dynamic and 3D
  robotLens: (
    centerX: number,
    centerY: number,
    radius = 140
  ): RadialLensConfig => ({
    radius,
    centerX,
    centerY,
    contentMode: 'follow-tangent', // Follow circle flow
    alignment: 'center',
    autoSize: true,
    minSpacing: 20,
    perspective: 0.3, // Strong 3D effect
    fadeEdges: true,
    startAngle: 0,
    endAngle: 270, // 3/4 circle for tech look
  }),

  // Status indicators around lens perimeter
  statusRing: (
    centerX: number,
    centerY: number,
    radius = 100
  ): RadialLensConfig => ({
    radius,
    centerX,
    centerY,
    contentMode: 'follow-radius', // Point outward like spokes
    alignment: 'outer',
    autoSize: true,
    minSpacing: 10,
    perspective: 0,
    fadeEdges: false,
  }),

  // Content carousel around center
  contentCarousel: (
    centerX: number,
    centerY: number,
    radius = 160
  ): RadialLensConfig => ({
    radius,
    centerX,
    centerY,
    contentMode: 'maintain', // Keep content orientation
    alignment: 'center',
    autoSize: true,
    minSpacing: 25,
    perspective: 0.2,
    fadeEdges: true,
    startAngle: 0,
    endAngle: 360,
  }),
};

// ===== Quick Setup Hooks =====

export function useHALClassicLens(
  center: { x: number; y: number },
  radius?: number
) {
  return useRadialLens(LensPresets.halClassic(center.x, center.y, radius));
}

export function useRobotLens(
  center: { x: number; y: number },
  radius?: number
) {
  return useRadialLens(LensPresets.robotLens(center.x, center.y, radius));
}

export function useStatusRing(
  center: { x: number; y: number },
  radius?: number
) {
  return useRadialLens(LensPresets.statusRing(center.x, center.y, radius));
}

export function useContentCarousel(
  center: { x: number; y: number },
  radius?: number
) {
  return useRadialLens(LensPresets.contentCarousel(center.x, center.y, radius));
}
