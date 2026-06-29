import { VisualCommand } from '../types/widget-types';

export interface VisualEffect {
  id: string;
  type: string;
  startTime: number;
  duration: number;
  properties: Record<string, any>;
  isComplete: boolean;
}

export class VisualEffectEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private effects: VisualEffect[] = [];
  private centerX: number = 0;
  private centerY: number = 0;
  private radius: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D rendering context');
    }
    this.ctx = ctx;
    this.updateDimensions();
  }

  updateDimensions() {
    const rect = this.canvas.getBoundingClientRect();
    this.centerX = rect.width / 2;
    this.centerY = rect.height / 2;
    this.radius = Math.min(rect.width, rect.height) / 2 - 10; // Leave some padding
  }

  resize(width: number, height: number) {
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.radius = Math.min(width, height) / 2 - 10;
  }

  addEffect(command: VisualCommand) {
    const effect: VisualEffect = {
      id: `${command.effect}_${Date.now()}_${Math.random()}`,
      type: command.effect,
      startTime: command.timestamp,
      duration: command.properties.duration || 1000,
      properties: { ...command.properties },
      isComplete: false,
    };

    this.effects.push(effect);

    // Clean up old effects periodically
    if (this.effects.length > 50) {
      this.effects = this.effects.filter(e => !e.isComplete).slice(-20);
    }
  }

  render(timestamp: number) {
    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and render each effect
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      if (!effect) continue;
      const elapsed = timestamp - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1);

      if (progress >= 1) {
        effect.isComplete = true;
        this.effects.splice(i, 1);
        continue;
      }

      this.renderEffect(effect, progress, elapsed);
    }

    // Always draw a subtle base state
    this.renderBaseState();
  }

  private renderBaseState() {
    this.ctx.save();

    // Draw a very subtle circle to show the widget bounds
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 4]);
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius * 0.9, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderEffect(
    effect: VisualEffect,
    progress: number,
    elapsed: number
  ) {
    this.ctx.save();

    const { type, properties } = effect;
    const color = properties.color || '#44aaff';
    const intensity = (properties.intensity || 0.5) * (1 - progress * 0.5); // Fade out over time

    switch (type) {
      case 'pulse':
        this.renderPulse(color, intensity, progress);
        break;
      case 'wave':
        this.renderWave(color, intensity, progress, elapsed);
        break;
      case 'flash':
        this.renderFlash(color, intensity, progress);
        break;
      case 'spiral':
        this.renderSpiral(color, intensity, progress, elapsed);
        break;
      case 'shake':
        this.renderShake(color, intensity, progress);
        break;
      default:
        // Default to pulse for unknown effects
        this.renderPulse(color, intensity, progress);
    }

    this.ctx.restore();
  }

  private renderPulse(color: string, intensity: number, progress: number) {
    const alpha = intensity * (1 - progress);
    const pulseRadius = this.radius * (0.3 + intensity * progress * 0.7);

    // Main pulse circle
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseRadius, 0, Math.PI * 2);

    // Create radial gradient
    const gradient = this.ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      pulseRadius
    );

    const colorWithAlpha = this.addAlpha(color, alpha);
    gradient.addColorStop(0, colorWithAlpha);
    gradient.addColorStop(0.7, this.addAlpha(color, alpha * 0.3));
    gradient.addColorStop(1, 'transparent');

    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Optional: Add a subtle stroke
    this.ctx.strokeStyle = this.addAlpha(color, alpha * 0.5);
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private renderWave(
    color: string,
    intensity: number,
    progress: number,
    _elapsed: number
  ) {
    const waveCount = 3;
    const maxRadius = this.radius * 1.2;

    for (let i = 0; i < waveCount; i++) {
      const waveProgress = (progress * 2 + i * 0.3) % 1;
      const waveRadius = maxRadius * waveProgress;
      const alpha = intensity * (1 - waveProgress) * 0.6;

      if (alpha > 0.01 && waveRadius < maxRadius) {
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, waveRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.addAlpha(color, alpha);
        this.ctx.lineWidth = 3 * (1 - waveProgress);
        this.ctx.stroke();
      }
    }
  }

  private renderFlash(color: string, intensity: number, progress: number) {
    // Sharp, quick flash that fades quickly
    const flashIntensity = intensity * Math.pow(1 - progress, 3); // Cubic fade-out

    if (flashIntensity > 0.01) {
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.addAlpha(color, flashIntensity * 0.8);
      this.ctx.fill();

      // Add bright center
      const gradient = this.ctx.createRadialGradient(
        this.centerX,
        this.centerY,
        0,
        this.centerX,
        this.centerY,
        this.radius * 0.5
      );
      gradient.addColorStop(0, this.addAlpha('#ffffff', flashIntensity));
      gradient.addColorStop(1, 'transparent');

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }

  private renderSpiral(
    color: string,
    intensity: number,
    progress: number,
    elapsed: number
  ) {
    const spiralTurns = 3;
    const points = 60;
    const rotationSpeed = elapsed * 0.002; // Rotate based on elapsed time

    this.ctx.strokeStyle = this.addAlpha(
      color,
      intensity * (1 - progress * 0.7)
    );
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();

    for (let i = 0; i < points; i++) {
      const t = i / points;
      const angle = t * spiralTurns * Math.PI * 2 + rotationSpeed;
      const radius = this.radius * t * (0.8 + intensity * 0.2);

      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    // Add particles along the spiral for extra effect
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const t = (elapsed * 0.001 + i / particleCount) % 1;
      const angle = t * spiralTurns * Math.PI * 2 + rotationSpeed;
      const radius = this.radius * t * (0.8 + intensity * 0.2);

      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 3 * intensity, 0, Math.PI * 2);
      this.ctx.fillStyle = this.addAlpha(color, intensity * 0.8);
      this.ctx.fill();
    }
  }

  private renderShake(color: string, intensity: number, progress: number) {
    // Create a shaking/glitch effect
    const shakeIntensity = intensity * (1 - progress);
    const shakeAmount = 10 * shakeIntensity;

    // Multiple offset circles to create a glitch effect
    const offsets = [
      {
        x: Math.random() * shakeAmount - shakeAmount / 2,
        y: Math.random() * shakeAmount - shakeAmount / 2,
      },
      {
        x: Math.random() * shakeAmount - shakeAmount / 2,
        y: Math.random() * shakeAmount - shakeAmount / 2,
      },
      {
        x: Math.random() * shakeAmount - shakeAmount / 2,
        y: Math.random() * shakeAmount - shakeAmount / 2,
      },
    ];

    const colors = [color, '#ff4444', '#ffffff'];

    offsets.forEach((offset, i) => {
      this.ctx.beginPath();
      this.ctx.arc(
        this.centerX + offset.x,
        this.centerY + offset.y,
        this.radius * 0.8,
        0,
        Math.PI * 2
      );
      this.ctx.strokeStyle = this.addAlpha(
        colors[i] ?? color,
        shakeIntensity * 0.3
      );
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  private addAlpha(color: string, alpha: number): string {
    // Convert hex color to rgba
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
    }

    // If already rgba, modify alpha
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/g, `${alpha})`);
    }

    // If rgb, convert to rgba
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }

    return color;
  }

  dispose() {
    this.effects = [];
  }
}
