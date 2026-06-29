// Performance monitoring component for development and refactoring

import React, { useState, useEffect } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import type { PerformanceAlert } from '../../hooks/usePerformance';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onToggle?: (visible: boolean) => void;
  layerCount?: number;
  activeAnimations?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = true,
  position = 'top-right',
  onToggle,
  layerCount = 0,
  activeAnimations = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAlert = (alert: PerformanceAlert) => {
    console.warn('Performance Alert:', alert);
  };

  const {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
  } = usePerformance({
    autoStart: true,
    updateInterval: 1000,
    onAlert: handleAlert,
    thresholds: {
      minFPS: 50,
      criticalFPS: 30,
      maxRenderTime: 33.33,
      maxMemoryUsage: 80,
    },
  });

  useEffect(() => {
    if (isVisible && !isMonitoring) {
      startMonitoring();
    } else if (!isVisible && isMonitoring) {
      stopMonitoring();
    }
  }, [isVisible, isMonitoring, startMonitoring, stopMonitoring]);

  const handleToggleVisibility = () => {
    onToggle?.(!isVisible);
  };

  const getStatusColor = (value: number, good: number, warning: number) => {
    if (value >= good) return 'frostlight-text-success frostdark-text-success';
    if (value >= warning)
      return 'frostlight-text-warning frostdark-text-warning';
    return 'frostlight-text-danger frostdark-text-danger';
  };

  const getMemoryStatusColor = (value: number) => {
    if (value < 60) return 'frostlight-text-success frostdark-text-success';
    if (value < 80) return 'frostlight-text-warning frostdark-text-warning';
    return 'frostlight-text-danger frostdark-text-danger';
  };

  if (!isVisible) {
    return (
      <button
        onClick={handleToggleVisibility}
        className='frostlight-button-secondary frostdark-button-secondary fixed top-4 right-4 z-50 px-3 py-2 text-sm'
        title='Show Performance Monitor'
      >
        📊
      </button>
    );
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const recentAlerts = alerts.slice(-3);

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 frostlight-panel-secondary frostdark-panel-secondary rounded-lg shadow-lg min-w-[250px]`}
      data-testid='performance-monitor'
    >
      <div className='p-3'>
        {/* Header */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-semibold frostlight-text-primary frostdark-text-primary'>
              Performance Monitor
            </span>
            <div
              className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
          <div className='flex items-center space-x-1'>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='frostlight-button-ghost frostdark-button-ghost p-1'
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '−' : '+'}
            </button>
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className='frostlight-button-ghost frostdark-button-ghost p-1'
              title={isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            >
              {isMonitoring ? '⏸️' : '▶️'}
            </button>
            <button
              onClick={handleToggleVisibility}
              className='frostlight-button-ghost frostdark-button-ghost p-1'
              title='Hide Performance Monitor'
            >
              ✕
            </button>
          </div>
        </div>

        {/* Compact View */}
        {!isExpanded && (
          <div className='space-y-1'>
            <div className='flex justify-between items-center'>
              <span className='text-xs frostlight-text-secondary frostdark-text-secondary'>
                FPS:
              </span>
              <span
                className={`text-xs font-mono ${getStatusColor(metrics.fps, 50, 30)}`}
              >
                {metrics.fps}
              </span>
            </div>
            {metrics.memoryUsage && (
              <div className='flex justify-between items-center'>
                <span className='text-xs frostlight-text-secondary frostdark-text-secondary'>
                  Memory:
                </span>
                <span
                  className={`text-xs font-mono ${getMemoryStatusColor(metrics.memoryUsage)}`}
                >
                  {metrics.memoryUsage.toFixed(1)}MB
                </span>
              </div>
            )}
            <div className='flex justify-between items-center'>
              <span className='text-xs frostlight-text-secondary frostdark-text-secondary'>
                Layers:
              </span>
              <span className='text-xs font-mono frostlight-text-primary frostdark-text-primary'>
                {layerCount}
              </span>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className='space-y-3'>
            {/* Core Metrics */}
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm frostlight-text-secondary frostdark-text-secondary'>
                  FPS:
                </span>
                <div className='text-right'>
                  <span
                    className={`text-lg font-mono ${getStatusColor(metrics.fps, 50, 30)}`}
                  >
                    {metrics.fps}
                  </span>
                  <div className='text-xs frostlight-text-tertiary frostdark-text-tertiary'>
                    Avg: {metrics.averageFPS.toFixed(1)} | Min:{' '}
                    {metrics.minFPS === Infinity ? 0 : metrics.minFPS}
                  </div>
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-sm frostlight-text-secondary frostdark-text-secondary'>
                  Frame Time:
                </span>
                <span className='text-sm font-mono frostlight-text-primary frostdark-text-primary'>
                  {metrics.frameTime.toFixed(2)}ms
                </span>
              </div>

              {metrics.memoryUsage && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm frostlight-text-secondary frostdark-text-secondary'>
                    Memory:
                  </span>
                  <span
                    className={`text-sm font-mono ${getMemoryStatusColor(metrics.memoryUsage)}`}
                  >
                    {metrics.memoryUsage.toFixed(1)} MB
                  </span>
                </div>
              )}

              <div className='flex justify-between items-center'>
                <span className='text-sm frostlight-text-secondary frostdark-text-secondary'>
                  Layers:
                </span>
                <span className='text-sm font-mono frostlight-text-primary frostdark-text-primary'>
                  {layerCount}
                </span>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-sm frostlight-text-secondary frostdark-text-secondary'>
                  Animations:
                </span>
                <span className='text-sm font-mono frostlight-text-primary frostdark-text-primary'>
                  {activeAnimations}
                </span>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-sm frostlight-text-secondary frostdark-text-secondary'>
                  Renders:
                </span>
                <span className='text-sm font-mono frostlight-text-primary frostdark-text-primary'>
                  {metrics.totalRenders.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Alerts Section */}
            {recentAlerts.length > 0 && (
              <div className='border-t frostlight-border-subtle frostdark-border-subtle pt-2'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-xs font-semibold frostlight-text-secondary frostdark-text-secondary'>
                    Recent Alerts ({alerts.length})
                  </span>
                  <button
                    onClick={clearAlerts}
                    className='text-xs frostlight-button-ghost frostdark-button-ghost px-1'
                  >
                    Clear
                  </button>
                </div>
                <div className='space-y-1 max-h-24 overflow-y-auto'>
                  {recentAlerts.map((alert, index) => (
                    <div
                      key={`${alert.timestamp}-${index}`}
                      className={`text-xs p-2 rounded ${
                        alert.severity === 'critical'
                          ? 'frostlight-alert-error frostdark-alert-error'
                          : 'frostlight-alert-warning frostdark-alert-warning'
                      }`}
                    >
                      <div className='font-medium'>{alert.message}</div>
                      <div className='text-xs opacity-75'>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Status */}
            <div className='border-t frostlight-border-subtle frostdark-border-subtle pt-2'>
              <div className='flex justify-between items-center'>
                <span className='text-xs frostlight-text-secondary frostdark-text-secondary'>
                  Status:
                </span>
                <span
                  className={`text-xs font-medium ${
                    metrics.fps >= 50 && (metrics.memoryUsage || 0) < 60
                      ? 'frostlight-text-success frostdark-text-success'
                      : metrics.fps >= 30 && (metrics.memoryUsage || 0) < 80
                        ? 'frostlight-text-warning frostdark-text-warning'
                        : 'frostlight-text-danger frostdark-text-danger'
                  }`}
                >
                  {metrics.fps >= 50 && (metrics.memoryUsage || 0) < 60
                    ? 'Optimal'
                    : metrics.fps >= 30 && (metrics.memoryUsage || 0) < 80
                      ? 'Moderate'
                      : 'Poor'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
