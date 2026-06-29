import { DistortionProcessor } from '../DistortionProcessor';

describe('DistortionProcessor coverage tests', () => {
  let processor: DistortionProcessor;

  beforeEach(() => {
    processor = new DistortionProcessor();
  });

  it('covers centerX/centerY undefined branches in radial algorithm', () => {
    const input = new ImageData(10, 10);
    const result = processor.processWave(
      input,
      {
        width: 10,
        height: 10,
        time: 100,
      },
      {
        direction: 'radial',
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers all default parameter branches', () => {
    const input = new ImageData(5, 5);
    const result = processor.processWave(
      input,
      {
        width: 5,
        height: 5,
      },
      {}
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers undefined image data fallback branches', () => {
    const input = new ImageData(2, 2);

    const result = processor.processWave(
      input,
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {
        direction: 'horizontal',
        amplitude: 100,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers amplitude undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processWave(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        direction: 'vertical',
        intensity: 0.5,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers frequency undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processWave(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        direction: 'diagonal',
        amplitude: 10,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers speed undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processWave(
      input,
      {
        width: 3,
        height: 3,
      },
      {
        direction: 'horizontal',
        amplitude: 10,
        frequency: 0.1,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers phase undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processWave(
      input,
      {
        width: 3,
        height: 3,
        time: undefined,
      },
      {
        direction: 'radial',
        amplitude: 10,
        frequency: 0.1,
        speed: 2,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers intensity undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processWave(
      input,
      {
        width: 3,
        height: 3,
        time: 100,
      },
      {
        direction: 'horizontal',
        amplitude: 10,
        frequency: 0.1,
        speed: 2,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });
});
