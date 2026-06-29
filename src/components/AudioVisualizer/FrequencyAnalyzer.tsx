/**
 * FrequencyAnalyzer Component - Audio frequency analysis and data processing
 *
 * Extracted from HalModuleBuilder.tsx to provide modular frequency analysis functionality.
 * Handles Web Audio API frequency data processing, smoothing, and visualization updates.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { FrequencyAnalyzerProps } from './AudioVisualizer.types';

export const FrequencyAnalyzer: React.FC<FrequencyAnalyzerProps> = ({
  audioData,
  showDebug = false,
  className = '',
}) => {
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const debugAnimationFrameRef = useRef<number>();

  // Debug visualization of frequency data
  const drawDebugVisualization = useCallback(() => {
    if (!showDebug || !debugCanvasRef.current) return;

    const canvas = debugCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = 300;
    const height = 150;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // Draw frequency bars
    const barWidth = width / audioData.length;
    ctx.fillStyle = '#00ff00';

    audioData.forEach((value, index) => {
      const barHeight = value * height;
      const x = index * barWidth;
      const y = height - barHeight;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText('Frequency Analysis (Debug)', 5, 15);
    ctx.fillText(`Bars: ${audioData.length}`, 5, height - 20);

    // Show peak value
    const maxValue = Math.max(...audioData);
    ctx.fillText(`Peak: ${(maxValue * 100).toFixed(1)}%`, 5, height - 5);
  }, [audioData, showDebug]);

  // Update debug visualization
  useEffect(() => {
    if (showDebug) {
      drawDebugVisualization();
    }
  }, [audioData, showDebug, drawDebugVisualization]);

  // Cleanup debug animation frame
  useEffect(() => {
    return () => {
      if (debugAnimationFrameRef.current) {
        cancelAnimationFrame(debugAnimationFrameRef.current);
      }
    };
  }, []);

  // Get frequency range description for debugging
  const getFrequencyRangeInfo = () => {
    const totalBars = audioData.length;
    const bassRange = Math.floor(totalBars * 0.1); // First 10% - bass
    const midRange = Math.floor(totalBars * 0.6); // Next 60% - mid
    const trebleRange = totalBars - bassRange - midRange; // Last 30% - treble

    return {
      total: totalBars,
      bass: bassRange,
      mid: midRange,
      treble: trebleRange,
    };
  };

  // Calculate various frequency statistics
  const getFrequencyStats = () => {
    if (audioData.length === 0) return null;

    const sum = audioData.reduce((acc, val) => acc + val, 0);
    const average = sum / audioData.length;
    const max = Math.max(...audioData);
    const min = Math.min(...audioData);

    const rangeInfo = getFrequencyRangeInfo();

    // Calculate bass, mid, treble averages
    const bassData = audioData.slice(0, rangeInfo.bass);
    const midData = audioData.slice(
      rangeInfo.bass,
      rangeInfo.bass + rangeInfo.mid
    );
    const trebleData = audioData.slice(rangeInfo.bass + rangeInfo.mid);

    const bassAvg =
      bassData.length > 0
        ? bassData.reduce((acc, val) => acc + val, 0) / bassData.length
        : 0;
    const midAvg =
      midData.length > 0
        ? midData.reduce((acc, val) => acc + val, 0) / midData.length
        : 0;
    const trebleAvg =
      trebleData.length > 0
        ? trebleData.reduce((acc, val) => acc + val, 0) / trebleData.length
        : 0;

    return {
      average,
      max,
      min,
      range: max - min,
      bass: bassAvg,
      mid: midAvg,
      treble: trebleAvg,
      rangeInfo,
    };
  };

  if (!showDebug) {
    return null; // Component is invisible when not in debug mode
  }

  const stats = getFrequencyStats();

  return (
    <div className={`frequency-analyzer-debug ${className}`}>
      <div className='debug-panel frost-card-secondary frost-p-4 frost-m-2'>
        <h3 className='frost-text-primary frost-mb-2'>
          🔊 Frequency Analyzer Debug
        </h3>

        {/* Visual frequency display */}
        <canvas
          ref={debugCanvasRef}
          className='debug-canvas frost-border frost-rounded'
          style={{
            maxWidth: '100%',
            height: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />

        {/* Frequency statistics */}
        {stats && (
          <div className='debug-stats frost-mt-2 frost-text-sm frost-text-secondary'>
            <div className='frost-grid frost-grid-cols-2 frost-gap-2'>
              <div>
                <strong>Overall:</strong>
                <div>Avg: {(stats.average * 100).toFixed(1)}%</div>
                <div>Max: {(stats.max * 100).toFixed(1)}%</div>
                <div>Range: {(stats.range * 100).toFixed(1)}%</div>
              </div>
              <div>
                <strong>Frequency Bands:</strong>
                <div>Bass: {(stats.bass * 100).toFixed(1)}%</div>
                <div>Mid: {(stats.mid * 100).toFixed(1)}%</div>
                <div>Treble: {(stats.treble * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className='frost-mt-2 frost-text-xs'>
              <strong>Range Distribution:</strong>
              Bass({stats.rangeInfo.bass}) | Mid({stats.rangeInfo.mid}) |
              Treble({stats.rangeInfo.treble})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrequencyAnalyzer;
