import { FilterProcessor } from '../FilterProcessor';

describe('FilterProcessor coverage tests', () => {
  let processor: FilterProcessor;

  beforeEach(() => {
    processor = new FilterProcessor();
  });

  it('covers all default parameter branches for bulge', () => {
    const input = new ImageData(5, 5);
    const result = processor.processBulge(
      input,
      {
        width: 5,
        height: 5,
        time: 100,
      },
      {}
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers all default parameter branches for pinch', () => {
    const input = new ImageData(5, 5);
    const result = processor.processPinch(
      input,
      {
        width: 5,
        height: 5,
        time: 100,
      },
      {}
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers undefined image data fallback branches in bulge', () => {
    const input = new ImageData(2, 2);

    const result = processor.processBulge(
      input,
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 10,
        amplitude: 100,
        intensity: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers undefined image data fallback branches in pinch', () => {
    const input = new ImageData(2, 2);
    Object.defineProperty(input.data, '4', {
      value: undefined,
      writable: true,
    });
    Object.defineProperty(input.data, '5', {
      value: undefined,
      writable: true,
    });
    Object.defineProperty(input.data, '6', {
      value: undefined,
      writable: true,
    });
    Object.defineProperty(input.data, '7', {
      value: undefined,
      writable: true,
    });

    const result = processor.processPinch(
      input,
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 100,
        amplitude: 5,
        intensity: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers centerX undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processBulge(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerY: 0.3,
        radius: 50,
        amplitude: 10,
        intensity: 0.8,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers centerY undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processPinch(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerX: 0.7,
        radius: 75,
        amplitude: 15,
        intensity: 1.2,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers radius undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processBulge(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        amplitude: 20,
        intensity: 0.9,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers amplitude undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processPinch(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 100,
        intensity: 1.1,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers intensity undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processBulge(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 150,
        amplitude: 25,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });
});
