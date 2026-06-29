import { WaveformProcessor } from '../WaveformProcessor';

describe('WaveformProcessor coverage tests', () => {
  let processor: WaveformProcessor;

  beforeEach(() => {
    processor = new WaveformProcessor();
  });

  it('covers all default parameter branches', () => {
    const input = new ImageData(5, 5);
    const result = processor.processRipple(
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

  it('covers undefined image data fallback branches', () => {
    const input = new ImageData(2, 2);

    const result = processor.processRipple(
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
        frequency: 1,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers centerX undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processRipple(
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
        frequency: 0.08,
        speed: 1.5,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers centerY undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processRipple(
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
        frequency: 0.12,
        speed: 0.8,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers radius undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processRipple(
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
        frequency: 0.06,
        speed: 1.3,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers amplitude undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processRipple(
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
        frequency: 0.09,
        speed: 1.1,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers frequency undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processRipple(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 120,
        amplitude: 25,
        speed: 0.9,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers speed undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processRipple(
      input,
      {
        width: 3,
        height: 3,
        time: 100,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 80,
        amplitude: 12,
        frequency: 0.07,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers time undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processRipple(
      input,
      {
        width: 3,
        height: 3,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 90,
        amplitude: 18,
        frequency: 0.11,
        speed: 1.4,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });
});
