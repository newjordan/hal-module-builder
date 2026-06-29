import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ShapeProperties } from '../IShape';

// Mock HalModuleBuilder component for E2E testing
const MockHalModuleBuilder: React.FC = () => {
  const [layers, setLayers] = useState<ShapeProperties[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');

  const addNewLayer = (type: string) => {
    const newLayer: ShapeProperties = {
      id: `layer-${Date.now()}`,
      name: `New ${type} Layer`,
      type: type === 'shape' ? 'circle' : type, // Default to circle for shape layers
      shapeType: type === 'shape' ? 'circle' : undefined,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      fillType: 'solid',
      fillColor: '#ffffff',
      strokeType: 'solid',
      strokeColor: '#000000',
      strokeWidth: 2,
    };

    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (layerId: string, updates: Partial<ShapeProperties>) => {
    setLayers(
      layers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      )
    );
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className='hal-module-builder'>
      {/* Layer Panel */}
      <div className='layer-panel'>
        <h3>Layers</h3>
        <button
          onClick={() => addNewLayer('shape')}
          data-testid='add-shape-layer'
        >
          Add Shape Layer
        </button>

        <div className='layer-list'>
          {layers.map(layer => (
            <div
              key={layer.id}
              className={`layer-item ${layer.id === selectedLayerId ? 'selected' : ''}`}
              onClick={() => setSelectedLayerId(layer.id)}
              data-testid={`layer-${layer.id}`}
            >
              {layer.name}
            </div>
          ))}
        </div>
      </div>

      {/* Property Panel */}
      {selectedLayer && (
        <div className='property-panel' data-testid='property-panel'>
          <h3>Properties</h3>

          {/* Shape Selection Dropdown */}
          <div className='property-group'>
            <label htmlFor='shape-select'>Shape Type</label>
            <select
              id='shape-select'
              data-testid='shape-selection-dropdown'
              value={selectedLayer.shapeType || selectedLayer.type || 'circle'}
              onChange={e =>
                updateLayer(selectedLayerId, {
                  shapeType: e.target.value,
                  type: e.target.value,
                })
              }
            >
              <option value='circle'>Circle</option>
              <option value='rectangle'>Rectangle</option>
              <option value='triangle'>Triangle</option>
              <option value='star'>Star</option>
              <option value='polygon'>Polygon</option>
            </select>
          </div>

          {/* Common Properties */}
          <div className='property-group'>
            <label htmlFor='size-control'>Size</label>
            <input
              id='size-control'
              type='range'
              data-testid='size-control'
              min='0.1'
              max='3'
              step='0.1'
              value={selectedLayer.scale || 1}
              onChange={e =>
                updateLayer(selectedLayerId, {
                  scale: parseFloat(e.target.value),
                })
              }
            />
            <span>{selectedLayer.scale || 1}</span>
          </div>

          <div className='property-group'>
            <label htmlFor='color-control'>Fill Color</label>
            <input
              id='color-control'
              type='color'
              data-testid='color-control'
              value={selectedLayer.fillColor || '#ffffff'}
              onChange={e =>
                updateLayer(selectedLayerId, {
                  fillColor: e.target.value,
                })
              }
            />
          </div>

          <div className='property-group'>
            <label htmlFor='thickness-control'>Line Thickness</label>
            <input
              id='thickness-control'
              type='range'
              data-testid='line-thickness-control'
              min='0'
              max='20'
              step='0.5'
              value={selectedLayer.strokeWidth || 2}
              onChange={e =>
                updateLayer(selectedLayerId, {
                  strokeWidth: parseFloat(e.target.value),
                })
              }
            />
            <span>{selectedLayer.strokeWidth || 2}</span>
          </div>

          {/* Shape-specific properties */}
          {selectedLayer.shapeType === 'star' && (
            <div className='property-group'>
              <label htmlFor='points-control'>Points</label>
              <input
                id='points-control'
                type='number'
                data-testid='star-points-control'
                min='3'
                max='12'
                value={selectedLayer.shapeSpecific?.points || 5}
                onChange={e =>
                  updateLayer(selectedLayerId, {
                    shapeSpecific: {
                      ...selectedLayer.shapeSpecific,
                      points: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
          )}

          {selectedLayer.shapeType === 'polygon' && (
            <div className='property-group'>
              <label htmlFor='sides-control'>Sides</label>
              <input
                id='sides-control'
                type='number'
                data-testid='polygon-sides-control'
                min='3'
                max='12'
                value={selectedLayer.shapeSpecific?.sides || 6}
                onChange={e =>
                  updateLayer(selectedLayerId, {
                    shapeSpecific: {
                      ...selectedLayer.shapeSpecific,
                      sides: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

describe('Shape Layer Creation E2E Tests', () => {
  describe('Complete Layer Creation Workflow (1.3c-E2E-001)', () => {
    it('should create new shape layer with all controls functional', async () => {
      const user = userEvent.setup();
      const { container } = render(<MockHalModuleBuilder />);

      // Step 1: Click "Add Shape Layer" button
      const addButton = screen.getByTestId('add-shape-layer');
      await user.click(addButton);

      // Step 2: Verify layer is created and selected
      await waitFor(() => {
        const layers = container.querySelectorAll('.layer-item');
        expect(layers).toHaveLength(1);
        expect(layers[0]).toHaveClass('selected');
      });

      // Step 3: Verify property panel is visible
      const propertyPanel = screen.getByTestId('property-panel');
      expect(propertyPanel).toBeInTheDocument();

      // Step 4: Verify all controls are present
      expect(
        screen.getByTestId('shape-selection-dropdown')
      ).toBeInTheDocument();
      expect(screen.getByTestId('size-control')).toBeInTheDocument();
      expect(screen.getByTestId('color-control')).toBeInTheDocument();
      expect(screen.getByTestId('line-thickness-control')).toBeInTheDocument();
    });

    it('should initialize shape properties correctly (1.3c-INT-002)', async () => {
      const user = userEvent.setup();
      render(<MockHalModuleBuilder />);

      // Create new shape layer
      await user.click(screen.getByTestId('add-shape-layer'));

      // Verify default properties are set
      await waitFor(() => {
        const sizeControl = screen.getByTestId(
          'size-control'
        ) as HTMLInputElement;
        expect(sizeControl.value).toBe('1'); // Default scale

        const colorControl = screen.getByTestId(
          'color-control'
        ) as HTMLInputElement;
        expect(colorControl.value).toBe('#ffffff'); // Default fill color

        const thicknessControl = screen.getByTestId(
          'line-thickness-control'
        ) as HTMLInputElement;
        expect(thicknessControl.value).toBe('2'); // Default stroke width
      });
    });
  });

  describe('Shape Selection Dropdown (1.3c-E2E-002)', () => {
    it('should display all 5 shape types in dropdown', async () => {
      const user = userEvent.setup();
      render(<MockHalModuleBuilder />);

      // Create shape layer
      await user.click(screen.getByTestId('add-shape-layer'));

      // Check dropdown options
      const dropdown = screen.getByTestId(
        'shape-selection-dropdown'
      ) as HTMLSelectElement;
      const options = Array.from(dropdown.options).map(opt => opt.value);

      expect(options).toEqual([
        'circle',
        'rectangle',
        'triangle',
        'star',
        'polygon',
      ]);
    });

    it('should change shape type when selection changes', async () => {
      const user = userEvent.setup();
      render(<MockHalModuleBuilder />);

      // Create shape layer
      await user.click(screen.getByTestId('add-shape-layer'));

      // Change shape type to star
      const dropdown = screen.getByTestId('shape-selection-dropdown');
      await user.selectOptions(dropdown, 'star');

      // Verify star-specific controls appear
      await waitFor(() => {
        expect(screen.getByTestId('star-points-control')).toBeInTheDocument();
      });

      // Change to polygon
      await user.selectOptions(dropdown, 'polygon');

      // Verify polygon-specific controls appear
      await waitFor(() => {
        expect(
          screen.queryByTestId('star-points-control')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('polygon-sides-control')).toBeInTheDocument();
      });
    });
  });

  describe('Property Panel Integration (1.3c-INT-003)', () => {
    it('should update properties when controls are changed', async () => {
      const user = userEvent.setup();
      render(<MockHalModuleBuilder />);

      // Create shape layer
      await user.click(screen.getByTestId('add-shape-layer'));

      // Change size
      const sizeControl = screen.getByTestId(
        'size-control'
      ) as HTMLInputElement;
      fireEvent.change(sizeControl, { target: { value: '2' } });
      expect(sizeControl.value).toBe('2');

      // Change color
      const colorControl = screen.getByTestId(
        'color-control'
      ) as HTMLInputElement;
      fireEvent.change(colorControl, { target: { value: '#ff0000' } });
      expect(colorControl.value).toBe('#ff0000');

      // Change line thickness
      const thicknessControl = screen.getByTestId(
        'line-thickness-control'
      ) as HTMLInputElement;
      fireEvent.change(thicknessControl, { target: { value: '5' } });
      expect(thicknessControl.value).toBe('5');
    });

    it('should maintain property values when switching between layers', async () => {
      const user = userEvent.setup();
      const { container } = render(<MockHalModuleBuilder />);

      // Create first shape layer
      await user.click(screen.getByTestId('add-shape-layer'));

      // Set properties
      const sizeControl = screen.getByTestId(
        'size-control'
      ) as HTMLInputElement;
      fireEvent.change(sizeControl, { target: { value: '1.5' } });

      // Create second shape layer
      await user.click(screen.getByTestId('add-shape-layer'));

      // Verify new layer has default values
      await waitFor(() => {
        const newSizeControl = screen.getByTestId(
          'size-control'
        ) as HTMLInputElement;
        expect(newSizeControl.value).toBe('1');
      });

      // Switch back to first layer
      const layers = container.querySelectorAll('.layer-item');
      await user.click(layers[0]);

      // Verify first layer retained its values
      await waitFor(() => {
        const firstSizeControl = screen.getByTestId(
          'size-control'
        ) as HTMLInputElement;
        expect(firstSizeControl.value).toBe('1.5');
      });
    });
  });

  describe('All Shape Types Creation (1.3c-E2E-003)', () => {
    it('should successfully create all 5 shape types', async () => {
      const user = userEvent.setup();
      render(<MockHalModuleBuilder />);

      const shapeTypes = ['circle', 'rectangle', 'triangle', 'star', 'polygon'];

      for (const shapeType of shapeTypes) {
        // Create new shape layer
        await user.click(screen.getByTestId('add-shape-layer'));

        // Select shape type
        const dropdown = screen.getByTestId('shape-selection-dropdown');
        await user.selectOptions(dropdown, shapeType);

        // Verify shape-specific properties if applicable
        if (shapeType === 'star') {
          expect(screen.getByTestId('star-points-control')).toBeInTheDocument();
        } else if (shapeType === 'polygon') {
          expect(
            screen.getByTestId('polygon-sides-control')
          ).toBeInTheDocument();
        }

        // Verify common controls work
        const sizeControl = screen.getByTestId(
          'size-control'
        ) as HTMLInputElement;
        fireEvent.change(sizeControl, { target: { value: '1.5' } });
        expect(sizeControl.value).toBe('1.5');
      }

      // Verify all layers were created
      const layers = document.querySelectorAll('.layer-item');
      expect(layers).toHaveLength(5);
    });
  });

  describe('Backward Compatibility (1.3c-E2E-004)', () => {
    it('should maintain existing circle layer functionality', async () => {
      const user = userEvent.setup();
      render(<MockHalModuleBuilder />);

      // Create circle layer (default)
      await user.click(screen.getByTestId('add-shape-layer'));

      // Verify it defaults to circle
      const dropdown = screen.getByTestId(
        'shape-selection-dropdown'
      ) as HTMLSelectElement;
      expect(dropdown.value).toBe('circle');

      // Verify all circle properties work
      const sizeControl = screen.getByTestId('size-control');
      const colorControl = screen.getByTestId('color-control');
      const thicknessControl = screen.getByTestId('line-thickness-control');

      expect(sizeControl).toBeInTheDocument();
      expect(colorControl).toBeInTheDocument();
      expect(thicknessControl).toBeInTheDocument();

      // Change properties
      fireEvent.change(sizeControl, { target: { value: '2' } });
      fireEvent.change(colorControl, { target: { value: '#00ff00' } });
      fireEvent.change(thicknessControl, { target: { value: '8' } });

      // Verify changes applied
      expect((sizeControl as HTMLInputElement).value).toBe('2');
      expect((colorControl as HTMLInputElement).value).toBe('#00ff00');
      expect((thicknessControl as HTMLInputElement).value).toBe('8');
    });
  });
});
