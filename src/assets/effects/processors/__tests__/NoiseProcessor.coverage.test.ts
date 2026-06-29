import { NoiseProcessor } from '../NoiseProcessor';

describe('NoiseProcessor coverage tests', () => {
  let processor: NoiseProcessor;

  beforeEach(() => {
    processor = new NoiseProcessor();
  });

  it('covers all default parameter branches for twist', () => {
    const input = new ImageData(5, 5);
    const result = processor.processTwist(
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

  it('covers all default parameter branches for swirl', () => {
    const input = new ImageData(5, 5);
    const result = processor.processSwirl(
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

  it('covers undefined image data fallback branches in twist', () => {
    const input = new ImageData(2, 2);

    const result = processor.processTwist(
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
        twist: 10,
        intensity: 1,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers undefined image data fallback branches in swirl', () => {
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

    const result = processor.processSwirl(
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
        twist: 2.5,
        intensity: 1,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers centerX undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processTwist(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerY: 0.3,
        radius: 50,
        twist: 1.2,
        intensity: 0.8,
        speed: 1.5,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers centerY undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processSwirl(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerX: 0.7,
        radius: 75,
        twist: 2.1,
        intensity: 1.2,
        speed: 0.8,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers radius undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processTwist(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        twist: 1.8,
        intensity: 0.9,
        speed: 1.3,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers twist undefined branch', () => {
    const input = new ImageData(3, 3);
    const result = processor.processSwirl(
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
        speed: 0.9,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers intensity undefined branch in computeAnimatedTwist', () => {
    const input = new ImageData(3, 3);
    const result = processor.processTwist(
      input,
      {
        width: 3,
        height: 3,
        time: 100,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 150,
        twist: 1.5,
        speed: 1.2,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers speed undefined branch in computeAnimatedTwist', () => {
    const input = new ImageData(3, 3);
    const result = processor.processSwirl(
      input,
      {
        width: 3,
        height: 3,
        time: 100,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 120,
        twist: 2.0,
        intensity: 0.7,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers time undefined branch in computeAnimatedTwist', () => {
    const input = new ImageData(3, 3);
    const result = processor.processTwist(
      input,
      {
        width: 3,
        height: 3,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 180,
        twist: 1.3,
        intensity: 1.0,
        speed: 1.1,
      }
    );
    expect(result).toBeInstanceOf(ImageData);
  });
});
