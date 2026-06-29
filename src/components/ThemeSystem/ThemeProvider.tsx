import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export type ThemeType = 'frost_light' | 'frost_dark';

interface ThemeContextValue {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  themeClasses: {
    appCardTitle: string;
    buttonAction: string;
    buttonDanger: string;
    inputField: string;
    selectField: string;
    standardCard: string;
    contentCard: string;
    inputContainer: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeType;
  onThemeChange?: (theme: ThemeType) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'frost_dark',
  onThemeChange,
}) => {
  const [theme, setThemeState] = useState<ThemeType>(initialTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeType;
    if (
      savedTheme &&
      (savedTheme === 'frost_light' || savedTheme === 'frost_dark')
    ) {
      setThemeState(savedTheme);
    }
  }, []);

  // Save theme to localStorage and call onChange callback
  const setTheme = React.useCallback(
    (newTheme: ThemeType) => {
      setThemeState(newTheme);
      localStorage.setItem('app-theme', newTheme);
      onThemeChange?.(newTheme);
    },
    [onThemeChange]
  );

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === 'frost_light' ? 'frost_dark' : 'frost_light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Generate theme-specific class names
  const themeClasses = React.useMemo(
    () => ({
      appCardTitle:
        theme === 'frost_light'
          ? 'frostlight-app-card-title'
          : 'frostdark-app-card-title',
      buttonAction:
        theme === 'frost_light'
          ? 'frostlight-button-action'
          : 'frostdark-button-action',
      buttonDanger:
        theme === 'frost_light'
          ? 'frostlight-button-action-danger'
          : 'frostdark-button-action-danger',
      inputField:
        theme === 'frost_light'
          ? 'frostlight-input-field'
          : 'frostdark-input-field',
      selectField:
        theme === 'frost_light'
          ? 'frostlight-select-field'
          : 'frostdark-select-field',
      standardCard:
        theme === 'frost_light'
          ? 'frostlight-standard-glass-card'
          : 'frostdark-standard-glass-card',
      contentCard:
        theme === 'frost_light'
          ? 'frostlight-app-content-card'
          : 'frostdark-app-content-card',
      inputContainer:
        theme === 'frost_light'
          ? 'frostlight-input-container'
          : 'frostdark-input-container',
    }),
    [theme]
  );

  const value = React.useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      themeClasses,
    }),
    [theme, toggleTheme, setTheme, themeClasses]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
