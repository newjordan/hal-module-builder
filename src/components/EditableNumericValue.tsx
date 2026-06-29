import React, { useState, useRef, useEffect, useCallback } from 'react';

interface EditableNumericValueProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string; // e.g., '%', '°', 'px'
  precision?: number; // decimal places for display
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  theme?: 'frost_light' | 'frost_dark'; // Theme support
}

export const EditableNumericValue: React.FC<EditableNumericValueProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  suffix = '',
  precision = 0,
  className = '',
  style = {},
  disabled = false,
  theme = 'frost_light',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Format display value with precision and suffix
  const formatDisplayValue = useCallback(
    (val: number) => {
      const rounded =
        precision > 0 ? val.toFixed(precision) : Math.round(val).toString();
      return `${rounded}${suffix}`;
    },
    [precision, suffix]
  );

  // Enter edit mode on double-click
  const handleDoubleClick = useCallback(() => {
    if (disabled) return;

    setIsEditing(true);
    setEditValue(precision > 0 ? value.toFixed(precision) : value.toString());
  }, [disabled, value, precision]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    },
    []
  );

  // Validate and commit the value
  const commitValue = useCallback(() => {
    const numValue = parseFloat(editValue);

    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }

    setIsEditing(false);
  }, [editValue, min, max, onChange]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          commitValue();
          break;
        case 'Escape':
          e.preventDefault();
          cancelEdit();
          break;
        case 'Tab':
          // Allow tab to commit and move to next field
          commitValue();
          break;
      }
    },
    [commitValue, cancelEdit]
  );

  // Handle blur (clicking outside)
  const handleBlur = useCallback(() => {
    commitValue();
  }, [commitValue]);

  // Get frost theme classes
  const getThemeClasses = useCallback(() => {
    const inputFieldClass =
      theme === 'frost_light'
        ? 'frostlight-input-field'
        : 'frostdark-input-field';
    const inputContainerClass =
      theme === 'frost_light'
        ? 'frostlight-input-container'
        : 'frostdark-input-container';

    return { inputFieldClass, inputContainerClass };
  }, [theme]);

  const { inputFieldClass } = getThemeClasses();

  const baseStyle: React.CSSProperties = {
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
    padding: '2px 4px',
    borderRadius: 'var(--frost-radius-sm)',
    transition: 'all 0.15s ease',
    fontFamily: 'var(--current-font-family)',
    fontSize: '0.875rem',
    display: 'inline-block',
    lineHeight: '1.2',
    verticalAlign: 'baseline',
    height: 'auto',
    minHeight: 'auto',
    maxHeight: 'none',
    flex: 'none',
    alignSelf: 'auto',
    ...style,
  };

  const hoverStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: disabled
      ? 'transparent'
      : theme === 'frost_light'
        ? 'rgba(20, 184, 166, 0.08)'
        : 'rgba(6, 182, 212, 0.1)',
  };

  if (isEditing) {
    return (
      <div
        className={`${getThemeClasses().inputContainerClass} editable-numeric-edit`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minWidth: '60px',
          width: 'fit-content',
          margin: '0',
          padding: '0',
          height: 'auto',
          minHeight: '24px',
          maxHeight: '32px',
          verticalAlign: 'baseline',
        }}
      >
        <input
          ref={inputRef}
          type='text'
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`${inputFieldClass} ${className}`}
          style={{
            minWidth: '50px',
            width: 'fit-content',
            textAlign: 'center',
            padding: '2px 6px',
            height: '20px',
            lineHeight: '1.2',
            fontSize: '0.875rem',
            border: 'none',
            outline: 'none',
            background: 'transparent',
          }}
        />
      </div>
    );
  }

  return (
    <span
      className={`editable-numeric-value ${theme} ${className}`.trim()}
      style={baseStyle}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={e => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, baseStyle);
        }
      }}
      title={disabled ? undefined : 'Double-click to edit'}
    >
      {formatDisplayValue(value)}
    </span>
  );
};

export default EditableNumericValue;
