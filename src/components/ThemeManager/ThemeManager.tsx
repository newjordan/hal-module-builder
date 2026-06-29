/**
 * ThemeManager Component - Theme switching and management
 * Extracted from HalModuleBuilder.tsx for better organization
 */
import React, { useState, useEffect } from 'react';
import { getStorageService } from '../../services/StorageService';

export interface ThemeManagerProps {
  theme: 'frost_light' | 'frost_dark';
  onThemeToggle: () => void;
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
  showPreview?: boolean;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({
  theme,
  onThemeToggle,
  className = '',
  compact = false,
  showLabel = true,
  showPreview = false,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const storageService = getStorageService();

  // Auto-save theme preference
  useEffect(() => {
    if (autoSaveEnabled) {
      storageService.saveTheme(theme);
    }
  }, [theme, autoSaveEnabled, storageService]);

  const handleThemeToggle = async () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Add a small delay for visual feedback
    setTimeout(() => {
      onThemeToggle();
      setIsTransitioning(false);
    }, 150);
  };

  const buttonClasses = `
    frost-transition frost-duration-200
    ${
      compact
        ? theme === 'frost_light'
          ? 'frostlight-button-action-sm'
          : 'frostdark-button-action-sm'
        : theme === 'frost_light'
          ? 'frostlight-button-action'
          : 'frostdark-button-action'
    }
    ${isTransitioning ? 'frost-scale-95 frost-opacity-75' : 'hover:frost-scale-105'}
  `;

  const iconSize = compact ? 'frost-text-base' : 'frost-text-lg';
  const themeIcon = theme === 'frost_light' ? '🌙' : '☀️';
  const themeLabel = theme === 'frost_light' ? 'Dark Mode' : 'Light Mode';

  return (
    <div className={`theme-manager ${className}`}>
      <div className='frost-flex frost-items-center frost-gap-2'>
        <button
          onClick={handleThemeToggle}
          disabled={isTransitioning}
          className={buttonClasses}
          title={`Switch to ${themeLabel.toLowerCase()}`}
          aria-label={`Switch to ${themeLabel.toLowerCase()}`}
        >
          <span
            className={`frost-flex frost-items-center frost-gap-2 ${iconSize}`}
          >
            <span className={isTransitioning ? 'frost-animate-spin' : ''}>
              {themeIcon}
            </span>
            {showLabel && !compact && (
              <span className='frost-text-sm'>{themeLabel}</span>
            )}
          </span>
        </button>

        {/* Theme Preview */}
        {showPreview && !compact && (
          <div className='frost-flex frost-items-center frost-gap-1 frost-ml-2'>
            <div
              className={`
                frost-w-4 frost-h-4 frost-rounded frost-border-2 frost-transition
                ${
                  theme === 'frost_light'
                    ? 'frost-bg-white frost-border-gray-300'
                    : 'frost-bg-gray-800 frost-border-gray-600'
                }
              `}
              title='Current theme preview'
            />
            <span
              className={`
                frost-text-xs frost-font-medium
                ${theme === 'frost_light' ? 'frost-text-gray-600' : 'frost-text-gray-300'}
              `}
            >
              {theme === 'frost_light' ? 'Light' : 'Dark'}
            </span>
          </div>
        )}
      </div>

      {/* Theme Settings (expandable) */}
      {!compact && (
        <div
          className={`
            frost-mt-2 frost-text-xs
            ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
          `}
        >
          <label className='frost-flex frost-items-center frost-gap-1'>
            <input
              type='checkbox'
              checked={autoSaveEnabled}
              onChange={e => setAutoSaveEnabled(e.target.checked)}
              className='frost-w-3 frost-h-3'
            />
            <span>Remember theme preference</span>
          </label>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for theme management with persistence
 */
export const useThemeManager = () => {
  const [theme, setTheme] = useState<'frost_light' | 'frost_dark'>(
    'frost_light'
  );
  const [isSystemTheme, setIsSystemTheme] = useState(false);

  const storageService = getStorageService();

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = storageService.loadTheme();
    setTheme(savedTheme);
  }, [storageService]);

  // Listen for system theme changes
  useEffect(() => {
    if (!isSystemTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'frost_dark' : 'frost_light');
    };

    mediaQuery.addListener(handleChange);

    // Set initial system theme
    setTheme(mediaQuery.matches ? 'frost_dark' : 'frost_light');

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, [isSystemTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'frost_light' ? 'frost_dark' : 'frost_light';
    setTheme(newTheme);
    setIsSystemTheme(false); // Disable system theme when manually toggling
  };

  const setSystemTheme = (enabled: boolean) => {
    setIsSystemTheme(enabled);
    if (enabled) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(mediaQuery.matches ? 'frost_dark' : 'frost_light');
    }
  };

  const setSpecificTheme = (newTheme: 'frost_light' | 'frost_dark') => {
    setTheme(newTheme);
    setIsSystemTheme(false);
  };

  return {
    theme,
    isSystemTheme,
    toggleTheme,
    setSystemTheme,
    setSpecificTheme,
  };
};

export default ThemeManager;
