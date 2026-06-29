import { DistortionProcessor } from '../DistortionProcessor';
import { FilterProcessor } from '../FilterProcessor';
import { NoiseProcessor } from '../NoiseProcessor';
import { WaveformProcessor } from '../WaveformProcessor';

describe('Processor fallback branches', () => {
  it('covers DistortionProcessor fallback pixel data access', () => {
    const processor = new DistortionProcessor();
    const input = new ImageData(3, 3);

    const result = processor.processWave(
      input,
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {
        direction: 'horizontal',
        amplitude: 50,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers FilterProcessor fallback pixel data access in bulge', () => {
    const processor = new FilterProcessor();
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
        radius: 50,
        amplitude: 50,
        intensity: 2,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers FilterProcessor fallback pixel data access in pinch', () => {
    const processor = new FilterProcessor();
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
        radius: 50,
        amplitude: 50,
        intensity: 2,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers NoiseProcessor fallback pixel data access in twist', () => {
    const processor = new NoiseProcessor();
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
        radius: 50,
        twist: 5,
        intensity: 2,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers NoiseProcessor fallback pixel data access in swirl', () => {
    const processor = new NoiseProcessor();
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
        radius: 50,
        twist: 5,
        intensity: 2,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers WaveformProcessor fallback pixel data access', () => {
    const processor = new WaveformProcessor();
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
        radius: 50,
        amplitude: 50,
        frequency: 0.2,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers edge case where filtering operations access out-of-bounds pixels', () => {
    const filterProcessor = new FilterProcessor();
    const input = new ImageData(2, 2);

    const result = filterProcessor.processBulge(
      input,
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {
        centerX: 0,
        centerY: 0,
        radius: 1,
        amplitude: 100,
        intensity: 5,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers edge case where waveform operations access out-of-bounds pixels', () => {
    const waveformProcessor = new WaveformProcessor();
    const input = new ImageData(2, 2);

    const result = waveformProcessor.processRipple(
      input,
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {
        centerX: 0,
        centerY: 0,
        radius: 1,
        amplitude: 100,
        frequency: 2,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers edge case where noise operations access out-of-bounds pixels', () => {
    const noiseProcessor = new NoiseProcessor();
    const input = new ImageData(2, 2);

    const result = noiseProcessor.processTwist(
      input,
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {
        centerX: 0,
        centerY: 0,
        radius: 1,
        twist: 10,
        intensity: 5,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });
});
