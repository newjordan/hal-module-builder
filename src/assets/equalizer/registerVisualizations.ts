/**
 * registerVisualizations - Auto-register all built-in visualizations
 * Updated for E6.3 integration with new VisualizationFactory system
 */

import { VisualizationFactory } from './visualizations/VisualizationFactory';

// Import all visualization classes
import { BarVisualization } from './visualizations/BarVisualization';
import { DotVisualization } from './visualizations/DotVisualization';
import { TriangleVisualization } from './visualizations/TriangleVisualization';
import { DiamondVisualization } from './visualizations/DiamondVisualization';
import { HexagonVisualization } from './visualizations/HexagonVisualization';
import { CircleVisualization } from './visualizations/CircleVisualization';

/**
 * Register all built-in visualizations with the factory
 */
export function registerAllVisualizations(): void {
  // Check factory state instead of local flag to handle factory clearing
  const existingTypes = VisualizationFactory.getRegisteredTypes();
  console.log('🔍 Current registered types:', existingTypes);

  const requiredTypes = [
    'bar',
    'line', // handled by BAR
    'block', // handled by BAR
    'dot',
    'triangle',
    'diamond',
    'hexagon',
    'circle',
  ];
  const hasAllRequired = requiredTypes.every(type =>
    existingTypes.includes(type)
  );

  if (hasAllRequired) {
    console.log('✅ All visualizations already registered, skipping...');
    return;
  }

  console.log('🚀 Registering missing visualizations...');

  // Register UI-matching visualizations - BAR handles all rectangular modes
  if (!existingTypes.includes('bar')) {
    VisualizationFactory.register('bar', BarVisualization);
  }
  if (!existingTypes.includes('line')) {
    VisualizationFactory.register('line', BarVisualization); // BAR handles line mode
  }
  if (!existingTypes.includes('block')) {
    VisualizationFactory.register('block', BarVisualization); // BAR handles block mode
  }
  if (!existingTypes.includes('dot')) {
    VisualizationFactory.register('dot', DotVisualization);
  }
  if (!existingTypes.includes('triangle')) {
    VisualizationFactory.register('triangle', TriangleVisualization);
  }
  if (!existingTypes.includes('diamond')) {
    VisualizationFactory.register('diamond', DiamondVisualization);
  }
  if (!existingTypes.includes('hexagon')) {
    VisualizationFactory.register('hexagon', HexagonVisualization);
  }
  if (!existingTypes.includes('circle')) {
    VisualizationFactory.register('circle', CircleVisualization);
  }

  // BAR is now the primary rectangular visualization

  console.log(
    '✅ Registered visualizations with factory:',
    VisualizationFactory.getRegisteredTypes()
  );

  // Verify all types are registered
  const finalTypes = VisualizationFactory.getRegisteredTypes();
  const missingTypes = requiredTypes.filter(type => !finalTypes.includes(type));
  if (missingTypes.length > 0) {
    console.error('❌ Failed to register types:', missingTypes);
  }
}

/**
 * Legacy function for backward compatibility
 */
export function registerLegacyVisualizations(): void {
  console.log(
    'Legacy visualization registration - use registerAllVisualizations() for E6.3 system'
  );
}
