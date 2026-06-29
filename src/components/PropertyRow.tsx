import React, { memo, useId } from 'react';

interface PropertyRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  description?: string | undefined;
}

const PropertyRow = memo<PropertyRowProps>(
  ({ label, children, fullWidth = false, className = '', description }) => {
    const rowClassName =
      `property-row ${fullWidth ? 'property-row-full' : ''} ${className}`.trim();
    const controlId = useId();
    const descriptionId = useId();

    // Clone children to add accessibility attributes
    const enhancedChildren = React.Children.map(children, child => {
      if (
        React.isValidElement(child) &&
        (child.type === 'input' || child.type === 'select')
      ) {
        return React.cloneElement(child as any, {
          id: child.props.id || controlId,
          'aria-labelledby': `label-${controlId}`,
          'aria-describedby': description ? `desc-${descriptionId}` : undefined,
          ...child.props,
        });
      }
      return child;
    });

    return (
      <div
        className={rowClassName}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '32px',
        }}
        role='group'
        aria-labelledby={`label-${controlId}`}
      >
        <label
          id={`label-${controlId}`}
          htmlFor={controlId}
          className='property-label'
          style={{
            flexShrink: 0,
            minWidth: 'fit-content',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {label}
        </label>
        <div
          className='property-control'
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {enhancedChildren}
          {description && (
            <div
              id={`desc-${descriptionId}`}
              className='property-description'
              style={{
                fontSize: '12px',
                color: 'inherit',
                opacity: 0.7,
                marginTop: '2px',
              }}
              aria-live='polite'
            >
              {description}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PropertyRow.displayName = 'PropertyRow';

export default PropertyRow;
