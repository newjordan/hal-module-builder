import { Layer } from '../types/layer-types';

const debounceTimeouts = new Map<string, number>();

export const debounceLayerUpdate = <T extends Partial<Layer>>(
  layerId: string,
  updates: T,
  callback: (layerId: string, updates: T) => void,
  delay: number = 50
): void => {
  const existingTimeout = debounceTimeouts.get(layerId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeoutId = window.setTimeout(() => {
    callback(layerId, updates);
    debounceTimeouts.delete(layerId);
  }, delay);

  debounceTimeouts.set(layerId, timeoutId);
};

export const batchLayerUpdates = (
  operations: Array<{
    layerId: string;
    updates: Partial<Layer>;
  }>,
  callback: (
    operations: Array<{ layerId: string; updates: Partial<Layer> }>
  ) => void
): void => {
  requestAnimationFrame(() => {
    callback(operations);
  });
};

export const optimizeLayerReordering = (
  layers: Layer[],
  fromIndex: number,
  toIndex: number
): Layer[] => {
  if (fromIndex === toIndex) return layers;

  const newLayers = [...layers];
  const [movedLayer] = newLayers.splice(fromIndex, 1);
  if (!movedLayer) {
    return layers;
  }
  newLayers.splice(toIndex, 0, movedLayer);

  return newLayers;
};

interface TransformCache {
  [layerId: string]: {
    transform: string;
    lastUpdate: number;
    dependencies: string;
  };
}

class LayerTransformCache {
  private cache: TransformCache = {};
  private cacheDuration = 1000; // 1 second

  getTransform(layer: Layer): string | null {
    const cacheKey = layer.id;
    const cached = this.cache[cacheKey];

    if (!cached) return null;

    const dependencies = this.getDependencies(layer);
    const isExpired = Date.now() - cached.lastUpdate > this.cacheDuration;

    if (isExpired || cached.dependencies !== dependencies) {
      delete this.cache[cacheKey];
      return null;
    }

    return cached.transform;
  }

  setTransform(layer: Layer, transform: string): void {
    this.cache[layer.id] = {
      transform,
      lastUpdate: Date.now(),
      dependencies: this.getDependencies(layer),
    };
  }

  private getDependencies(layer: Layer): string {
    return `${layer.offsetX},${layer.offsetY},${layer.scale},${layer.rotation},${layer.opacity}`;
  }

  clearCache(): void {
    this.cache = {};
  }

  cleanup(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      const entry = this.cache[key];
      if (!entry) {
        return;
      }
      if (now - entry.lastUpdate > this.cacheDuration) {
        delete this.cache[key];
      }
    });
  }
}

export const transformCache = new LayerTransformCache();

export const generateOptimizedTransform = (layer: Layer): string => {
  const cached = transformCache.getTransform(layer);
  if (cached) return cached;

  const transform = `translate(${layer.offsetX}px, ${layer.offsetY}px) scale(${layer.scale}) rotate(${layer.rotation}deg) translateZ(0)`;

  transformCache.setTransform(layer, transform);
  return transform;
};

interface LayerCalculationWorkerTask {
  id: string;
  type: 'transform' | 'bounds' | 'collision';
  data: any;
}

class LayerCalculationManager {
  private worker: Worker | null = null;
  private taskQueue: LayerCalculationWorkerTask[] = [];
  private isProcessing = false;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof Worker !== 'undefined') {
      try {
        const workerBlob = new Blob(
          [
            `
          self.onmessage = function(e) {
            const { id, type, data } = e.data;
            
            try {
              let result;
              
              switch (type) {
                case 'transform':
                  result = generateTransformMatrix(data);
                  break;
                case 'bounds':
                  result = calculateLayerBounds(data);
                  break;
                case 'collision':
                  result = checkLayerCollision(data);
                  break;
                default:
                  throw new Error('Unknown task type');
              }
              
              self.postMessage({ id, result });
            } catch (error) {
              self.postMessage({ id, error: error.message });
            }
          };
          
          function generateTransformMatrix(data) {
            const { offsetX, offsetY, scale, rotation } = data;
            // Complex matrix calculations here
            return {
              transform: \`translate(\${offsetX}px, \${offsetY}px) scale(\${scale}) rotate(\${rotation}deg)\`,
              matrix: [scale, 0, 0, scale, offsetX, offsetY]
            };
          }
          
          function calculateLayerBounds(data) {
            const { layers, viewport } = data;
            return layers.map(layer => ({
              id: layer.id,
              bounds: {
                left: layer.offsetX - (layer.width * layer.scale / 2),
                top: layer.offsetY - (layer.height * layer.scale / 2),
                right: layer.offsetX + (layer.width * layer.scale / 2),
                bottom: layer.offsetY + (layer.height * layer.scale / 2)
              }
            }));
          }
          
          function checkLayerCollision(data) {
            const { layer1, layer2 } = data;
            // Collision detection logic
            return { collision: false, overlap: 0 };
          }
        `,
          ],
          { type: 'application/javascript' }
        );

        this.worker = new Worker(URL.createObjectURL(workerBlob));
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
      } catch (error) {
        console.warn(
          'Web Worker not available, falling back to main thread calculations'
        );
      }
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { id, error } = event.data;

    if (error) {
      console.error(`Worker calculation error for task ${id}:`, error);
    }

    this.processNextTask();
  }

  queueCalculation(task: LayerCalculationWorkerTask): Promise<any> {
    return new Promise(resolve => {
      if (this.worker) {
        this.worker.postMessage(task);
        resolve(null); // For now, just resolve immediately
      } else {
        resolve(this.fallbackCalculation(task));
      }
    });
  }

  private fallbackCalculation(task: LayerCalculationWorkerTask): any {
    switch (task.type) {
      case 'transform':
        return { transform: generateOptimizedTransform(task.data) };
      default:
        return null;
    }
  }

  private processNextTask(): void {
    if (this.taskQueue.length > 0 && !this.isProcessing) {
      this.isProcessing = true;
      const task = this.taskQueue.shift();
      if (task && this.worker) {
        this.worker.postMessage(task);
      }
      this.isProcessing = false;
    }
  }

  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.taskQueue = [];
  }
}

export const layerCalculationManager = new LayerCalculationManager();

export const requestIdleUpdate = (callback: () => void): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 1000 });
  } else {
    setTimeout(callback, 16);
  }
};

export const scheduleLayerUpdate = (callback: () => void): void => {
  requestAnimationFrame(() => {
    requestIdleUpdate(callback);
  });
};

export class LayerUpdateBatcher {
  private updateQueue: Map<string, Partial<Layer>> = new Map();
  private flushTimeout: number | null = null;
  private onFlush: (updates: Map<string, Partial<Layer>>) => void;

  constructor(onFlush: (updates: Map<string, Partial<Layer>>) => void) {
    this.onFlush = onFlush;
  }

  addUpdate(layerId: string, updates: Partial<Layer>): void {
    const existing = this.updateQueue.get(layerId) || {};
    this.updateQueue.set(layerId, { ...existing, ...updates });

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = window.setTimeout(() => {
      this.flush();
    }, 16); // Next frame
  }

  flush(): void {
    if (this.updateQueue.size > 0) {
      this.onFlush(new Map(this.updateQueue));
      this.updateQueue.clear();
    }

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }

  dispose(): void {
    this.flush();
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
  }
}
