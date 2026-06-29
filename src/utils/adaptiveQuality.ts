interface QualityProfile {
  name: string;
  maxLayers: number;
  maxAnimations: number;
  enableEffects: boolean;
  renderScale: number;
  enableViewportCulling: boolean;
  frameRateTarget: number;
}

const qualityProfiles: Record<
  'low' | 'medium' | 'high' | 'auto',
  QualityProfile
> = {
  low: {
    name: 'Low Quality',
    maxLayers: 10,
    maxAnimations: 2,
    enableEffects: false,
    renderScale: 0.75,
    enableViewportCulling: true,
    frameRateTarget: 30,
  },
  medium: {
    name: 'Medium Quality',
    maxLayers: 25,
    maxAnimations: 5,
    enableEffects: true,
    renderScale: 0.85,
    enableViewportCulling: true,
    frameRateTarget: 45,
  },
  high: {
    name: 'High Quality',
    maxLayers: 50,
    maxAnimations: 10,
    enableEffects: true,
    renderScale: 1.0,
    enableViewportCulling: false,
    frameRateTarget: 60,
  },
  auto: {
    name: 'Auto Adaptive',
    maxLayers: 50,
    maxAnimations: 10,
    enableEffects: true,
    renderScale: 1.0,
    enableViewportCulling: true,
    frameRateTarget: 60,
  },
};

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  layerCount: number;
  activeAnimations: number;
}

const getProfileByName = (name: string): QualityProfile | undefined => {
  return qualityProfiles[name as keyof typeof qualityProfiles];
};

const cloneProfile = (profile: QualityProfile): QualityProfile => ({
  ...profile,
});

class AdaptiveQualityManager {
  private currentProfile: QualityProfile = qualityProfiles.high;
  private userPreference: string = 'auto';
  private performanceHistory: PerformanceMetrics[] = [];
  private maxHistorySize = 10;
  private adaptationCooldown = 5000; // 5 seconds
  private lastAdaptation = 0;

  constructor() {
    this.loadUserPreference();
    this.detectHardwareCapabilities();
  }

  private loadUserPreference(): void {
    const stored = localStorage.getItem('hal-quality-preference');
    if (stored) {
      const profile = getProfileByName(stored);
      if (profile) {
        this.userPreference = stored;
        this.currentProfile = cloneProfile(profile);
      }
    }
  }

  private detectHardwareCapabilities(): void {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    let hardwareScore = 0;

    // Check WebGL support
    if (gl) {
      hardwareScore += 20;

      // Check for high-performance GPU
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (
          renderer &&
          typeof renderer === 'string' &&
          (renderer.includes('NVIDIA') ||
            renderer.includes('AMD') ||
            renderer.includes('Intel Iris'))
        ) {
          hardwareScore += 30;
        }
      }
    }

    // Check device memory
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory >= 8) hardwareScore += 25;
      else if (memory >= 4) hardwareScore += 15;
    }

    // Check hardware concurrency
    if (navigator.hardwareConcurrency >= 8) {
      hardwareScore += 15;
    } else if (navigator.hardwareConcurrency >= 4) {
      hardwareScore += 10;
    }

    // Check connection type for mobile devices
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (
        connection.effectiveType === '4g' ||
        connection.effectiveType === '5g'
      ) {
        hardwareScore += 10;
      }
    }

    // Auto-adjust initial quality based on hardware score
    if (this.userPreference === 'auto') {
      if (hardwareScore >= 70) {
        this.currentProfile = cloneProfile(qualityProfiles.high);
      } else if (hardwareScore >= 40) {
        this.currentProfile = cloneProfile(qualityProfiles.medium);
      } else {
        this.currentProfile = cloneProfile(qualityProfiles.low);
      }
    }
  }

  updatePerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);

    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }

    if (this.userPreference === 'auto') {
      this.adaptQuality(metrics);
    }
  }

  private adaptQuality(metrics: PerformanceMetrics): void {
    const now = Date.now();
    if (now - this.lastAdaptation < this.adaptationCooldown) {
      return;
    }

    const avgFps = this.getAverageMetric('fps');
    const avgMemory = this.getAverageMetric('memoryUsage');

    // Determine if we need to adjust quality
    let targetProfile = this.currentProfile;

    // Downgrade quality conditions
    if (
      avgFps < 30 ||
      avgMemory > 80 ||
      metrics.layerCount > this.currentProfile.maxLayers
    ) {
      if (this.currentProfile.name === qualityProfiles['high'].name) {
        targetProfile = qualityProfiles['medium'];
      } else if (this.currentProfile.name === qualityProfiles['medium'].name) {
        targetProfile = qualityProfiles['low'];
      }
    }
    // Upgrade quality conditions
    else if (
      avgFps > 55 &&
      avgMemory < 50 &&
      metrics.layerCount < this.currentProfile.maxLayers * 0.7
    ) {
      if (this.currentProfile.name === qualityProfiles['low'].name) {
        targetProfile = qualityProfiles['medium'];
      } else if (this.currentProfile.name === qualityProfiles['medium'].name) {
        targetProfile = qualityProfiles['high'];
      }
    }

    if (targetProfile.name !== this.currentProfile.name) {
      this.currentProfile = cloneProfile(targetProfile);
      this.lastAdaptation = now;

      console.log(`Quality adapted to: ${this.currentProfile.name}`, {
        avgFps: avgFps.toFixed(1),
        avgMemory: avgMemory.toFixed(1),
        layerCount: metrics.layerCount,
      });
    }
  }

  private getAverageMetric(metric: keyof PerformanceMetrics): number {
    if (this.performanceHistory.length === 0) return 0;

    const sum = this.performanceHistory.reduce((acc, m) => acc + m[metric], 0);
    return sum / this.performanceHistory.length;
  }

  setQualityProfile(profileName: string): void {
    const profile = getProfileByName(profileName);
    if (!profile) {
      return;
    }
    this.userPreference = profileName;
    this.currentProfile = cloneProfile(profile);

    localStorage.setItem('hal-quality-preference', profileName);

    // Reset performance history when manually changed
    this.performanceHistory = [];
  }

  getCurrentProfile(): QualityProfile {
    return cloneProfile(this.currentProfile);
  }

  getAvailableProfiles(): Record<string, QualityProfile> {
    return { ...qualityProfiles };
  }

  getUserPreference(): string {
    return this.userPreference;
  }

  shouldRenderLayer(layerIndex: number, isAnimated: boolean): boolean {
    if (layerIndex >= this.currentProfile.maxLayers) {
      return false;
    }

    // Count animated layers and limit them
    if (isAnimated) {
      const latestMetrics =
        this.performanceHistory.length > 0
          ? this.performanceHistory[this.performanceHistory.length - 1]
          : null;
      const animatedCount = latestMetrics?.activeAnimations ?? 0;

      if (animatedCount >= this.currentProfile.maxAnimations) {
        return false;
      }
    }

    return true;
  }

  shouldEnableEffect(effectType: string): boolean {
    if (!this.currentProfile.enableEffects) {
      return false;
    }

    // Disable expensive effects on lower quality settings
    if (this.currentProfile.name === qualityProfiles.low.name) {
      const expensiveEffects = ['blur', 'glow', 'shadow', 'distortion'];
      return !expensiveEffects.includes(effectType);
    }

    return true;
  }

  getRenderScale(): number {
    return this.currentProfile.renderScale;
  }

  shouldUseViewportCulling(): boolean {
    return this.currentProfile.enableViewportCulling;
  }

  getTargetFrameRate(): number {
    return this.currentProfile.frameRateTarget;
  }

  getQualityRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.fps < 30) {
      recommendations.push(
        'Consider reducing layer count or disabling animations'
      );
    }

    if (metrics.memoryUsage > 80) {
      recommendations.push(
        'High memory usage detected - consider clearing unused layers'
      );
    }

    if (metrics.layerCount > this.currentProfile.maxLayers) {
      recommendations.push(
        `Layer count (${metrics.layerCount}) exceeds recommended maximum (${this.currentProfile.maxLayers})`
      );
    }

    if (metrics.activeAnimations > this.currentProfile.maxAnimations) {
      recommendations.push(
        `Too many active animations (${metrics.activeAnimations}/${this.currentProfile.maxAnimations})`
      );
    }

    return recommendations;
  }
}

export const adaptiveQualityManager = new AdaptiveQualityManager();

export const useAdaptiveQuality = () => {
  const setProfile = (profileName: string) => {
    adaptiveQualityManager.setQualityProfile(profileName);
  };

  const updateMetrics = (metrics: PerformanceMetrics) => {
    adaptiveQualityManager.updatePerformanceMetrics(metrics);
  };

  const getCurrentProfile = () => {
    return adaptiveQualityManager.getCurrentProfile();
  };

  const getRecommendations = (metrics: PerformanceMetrics) => {
    return adaptiveQualityManager.getQualityRecommendations(metrics);
  };

  return {
    setProfile,
    updateMetrics,
    getCurrentProfile,
    getRecommendations,
    profiles: adaptiveQualityManager.getAvailableProfiles(),
    userPreference: adaptiveQualityManager.getUserPreference(),
  };
};
