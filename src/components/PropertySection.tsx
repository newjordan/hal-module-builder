import React, { memo, useState } from 'react';

export interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  theme?: string;
  className?: string;
  onToggle?: (expanded: boolean) => void;
}

const PropertySection = memo<PropertySectionProps>(
  ({
    title,
    children,
    collapsible = false,
    defaultExpanded = true,
    theme = 'frost_light',
    className = '',
    onToggle,
  }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const handleToggle = () => {
      if (collapsible) {
        const newExpanded = !expanded;
        setExpanded(newExpanded);
        onToggle?.(newExpanded);
      }
    };

    return (
      <div
        className={`property-section ${className}`.trim()}
        style={{
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '8px',
        }}
      >
        <div
          className='property-section-header'
          onClick={handleToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: collapsible ? 'pointer' : 'default',
            marginBottom: expanded ? '12px' : '0',
          }}
        >
          <h3
            className={
              theme === 'frost_light'
                ? 'frostlight-text-secondary'
                : 'frostdark-text-secondary'
            }
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.025em',
            }}
          >
            {title}
          </h3>
          {collapsible && (
            <span
              className={`section-toggle ${expanded ? 'expanded' : 'collapsed'}`}
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                transition: 'transform 0.2s ease-out',
                transform: expanded ? 'rotate(0deg)' : 'rotate(45deg)',
              }}
            >
              {expanded ? '−' : '+'}
            </span>
          )}
        </div>
        {expanded && (
          <div
            className='property-section-content'
            style={{
              animation: 'propertyRowFadeIn 0.3s ease-out',
            }}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

PropertySection.displayName = 'PropertySection';

export default PropertySection;
