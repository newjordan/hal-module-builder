/**
 * ImageMemoryManager - Optimized image handling with memory leak prevention
 * Manages image loading, caching, and cleanup to prevent memory leaks
 */

interface ImageCacheEntry {
  url: string;
  image: HTMLImageElement;
  lastUsed: number;
  size: number;
}

interface ImageUploadOptions {
  maxSize?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

class ImageMemoryManager {
  private imageCache = new Map<string, ImageCacheEntry>();
  private maxCacheSize = 50; // Maximum cached images
  private maxMemoryUsage = 100 * 1024 * 1024; // 100MB max memory usage
  private currentMemoryUsage = 0;
  private activeReaders = new Set<FileReader>();

  /**
   * Upload and process image with memory optimization
   */
  async uploadImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<string> {
    const { maxSize = 2048, quality = 0.85, format = 'webp' } = options;

    return new Promise((resolve, reject) => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('Image file too large (max 10MB)'));
        return;
      }

      const reader = new FileReader();
      this.activeReaders.add(reader);

      reader.onload = async e => {
        try {
          const result = e.target?.result as string;

          // Optimize image if it's large
          const optimizedResult = await this.optimizeImage(
            result,
            maxSize,
            quality,
            format
          );

          resolve(optimizedResult);
        } catch (error) {
          reject(error);
        } finally {
          this.activeReaders.delete(reader);
          this.cleanup(reader);
        }
      };

      reader.onerror = () => {
        this.activeReaders.delete(reader);
        this.cleanup(reader);
        reject(new Error('Failed to read image file'));
      };

      reader.onabort = () => {
        this.activeReaders.delete(reader);
        this.cleanup(reader);
        reject(new Error('Image reading was aborted'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Optimize image for memory usage
   */
  private async optimizeImage(
    dataUrl: string,
    maxSize: number,
    quality: number,
    format: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Check if optimization is needed
          if (img.width <= maxSize && img.height <= maxSize) {
            resolve(dataUrl);
            this.cleanup(img);
            return;
          }

          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(dataUrl); // Fallback to original
            this.cleanup(img);
            return;
          }

          // Calculate new dimensions
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = Math.floor(img.width * ratio);
          canvas.height = Math.floor(img.height * ratio);

          // Draw resized image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert to optimized format
          const mimeType =
            format === 'webp'
              ? 'image/webp'
              : format === 'jpeg'
                ? 'image/jpeg'
                : 'image/png';

          const optimizedDataUrl = canvas.toDataURL
            ? canvas.toDataURL(mimeType, quality)
            : dataUrl;

          // Cleanup
          this.cleanup(img);
          this.cleanup(canvas);

          resolve(optimizedDataUrl);
        } catch (error) {
          this.cleanup(img);
          reject(error);
        }
      };

      img.onerror = () => {
        this.cleanup(img);
        reject(new Error('Failed to load image for optimization'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Cache management for frequently used images
   */
  getCachedImage(url: string): HTMLImageElement | null {
    const entry = this.imageCache.get(url);
    if (entry) {
      entry.lastUsed = Date.now();
      return entry.image;
    }
    return null;
  }

  cacheImage(
    url: string,
    image: HTMLImageElement,
    estimatedSize: number
  ): void {
    // Clean cache if needed
    this.cleanupCache();

    const entry: ImageCacheEntry = {
      url,
      image,
      lastUsed: Date.now(),
      size: estimatedSize,
    };

    this.imageCache.set(url, entry);
    this.currentMemoryUsage += estimatedSize;
  }

  /**
   * Clean up least recently used images from cache
   */
  private cleanupCache(): void {
    // Remove oldest entries if cache is too full
    while (
      this.imageCache.size >= this.maxCacheSize ||
      this.currentMemoryUsage > this.maxMemoryUsage
    ) {
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      for (const [key, entry] of this.imageCache.entries()) {
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        const entry = this.imageCache.get(oldestKey);
        if (entry) {
          this.currentMemoryUsage -= entry.size;
          this.cleanup(entry.image);
          this.imageCache.delete(oldestKey);
        }
      } else {
        break; // Safety break
      }
    }
  }

  /**
   * Generic cleanup utility for various image-related objects
   */
  private cleanup(obj: any): void {
    if (obj) {
      // Cleanup HTMLImageElement
      if (obj.src) {
        obj.onload = null;
        obj.onerror = null;
        obj.onabort = null;
        if (obj.src.startsWith('blob:')) {
          URL.revokeObjectURL(obj.src);
        }
        obj.src = '';
      }

      // Cleanup FileReader
      if (obj.readyState !== undefined) {
        obj.onload = null;
        obj.onerror = null;
        obj.onabort = null;
        obj.onprogress = null;
        if (obj.readyState === FileReader.LOADING) {
          obj.abort();
        }
      }

      // Cleanup Canvas
      if (obj.getContext) {
        const ctx = obj.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, obj.width, obj.height);
        }
        obj.width = 0;
        obj.height = 0;
      }
    }
  }

  /**
   * Force cleanup all active readers and cache
   */
  dispose(): void {
    // Cleanup active readers
    for (const reader of this.activeReaders) {
      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
      this.cleanup(reader);
    }
    this.activeReaders.clear();

    // Cleanup image cache
    for (const entry of this.imageCache.values()) {
      this.cleanup(entry.image);
    }
    this.imageCache.clear();
    this.currentMemoryUsage = 0;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    cacheSize: number;
    memoryUsage: number;
    activeReaders: number;
  } {
    return {
      cacheSize: this.imageCache.size,
      memoryUsage: this.currentMemoryUsage,
      activeReaders: this.activeReaders.size,
    };
  }

  /**
   * Preload image with caching
   */
  async preloadImage(url: string): Promise<HTMLImageElement> {
    // Check cache first
    const cached = this.getCachedImage(url);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        // Estimate size (rough calculation)
        const estimatedSize = img.width * img.height * 4; // RGBA
        this.cacheImage(url, img, estimatedSize);
        resolve(img);
      };

      img.onerror = () => {
        this.cleanup(img);
        reject(new Error(`Failed to preload image: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Add garbage collection hints
   */
  suggestGarbageCollection(): void {
    // Force cleanup of unused cache entries
    this.cleanupCache();

    // Suggest garbage collection if available
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }

    // Alternative: trigger garbage collection through memory pressure
    if ('performance' in window && 'memory' in window.performance) {
      const memInfo = (window.performance as any).memory;
      if (memInfo.usedJSHeapSize > memInfo.usedJSHeapSize * 0.8) {
        // Memory pressure detected, force cleanup
        this.dispose();
      }
    }
  }
}

// Singleton instance
export const imageMemoryManager = new ImageMemoryManager();

// Hook for React integration
export const useImageMemoryManager = () => {
  const uploadImage = (file: File, options?: ImageUploadOptions) =>
    imageMemoryManager.uploadImage(file, options);

  const preloadImage = (url: string) => imageMemoryManager.preloadImage(url);

  const getStats = () => imageMemoryManager.getMemoryStats();

  const cleanup = () => imageMemoryManager.dispose();

  return {
    uploadImage,
    preloadImage,
    getStats,
    cleanup,
  };
};

export default ImageMemoryManager;
