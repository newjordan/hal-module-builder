import { DistortionProcessor } from '../DistortionProcessor';
import { FilterProcessor } from '../FilterProcessor';
import { NoiseProcessor } from '../NoiseProcessor';
import { WaveformProcessor } from '../WaveformProcessor';

describe('Processor nullish coalescing branches', () => {
  it('covers DistortionProcessor nullish coalescing with custom data array', () => {
    const processor = new DistortionProcessor();
    const input = new ImageData(2, 2);

    const customData = new Uint8ClampedArray(16);
    customData.set([255, 255, 255, 255, 0, 0, 0, 0, 100, 100, 100, 100]);
    Object.defineProperty(input, 'data', { value: customData, writable: true });

    const result = processor.processWave(
      input,
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {
        direction: 'horizontal',
        amplitude: 10,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers FilterProcessor nullish coalescing with sparse data array', () => {
    const processor = new FilterProcessor();
    const input = new ImageData(2, 2);

    const customData = new Uint8ClampedArray(10);
    customData.fill(255);
    Object.defineProperty(input, 'data', { value: customData, writable: true });

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
        amplitude: 5,
        intensity: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers NoiseProcessor nullish coalescing with truncated data array', () => {
    const processor = new NoiseProcessor();
    const input = new ImageData(2, 2);

    const customData = new Uint8ClampedArray(12);
    customData.fill(128);
    Object.defineProperty(input, 'data', { value: customData, writable: true });

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
        twist: 2,
        intensity: 1,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers WaveformProcessor nullish coalescing with partial data array', () => {
    const processor = new WaveformProcessor();
    const input = new ImageData(2, 2);

    const customData = new Uint8ClampedArray(8);
    customData.fill(200);
    Object.defineProperty(input, 'data', { value: customData, writable: true });

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
        amplitude: 5,
        frequency: 0.1,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers cache initialization branches by testing fresh processor instances', () => {
    [
      () =>
        new DistortionProcessor().processWave(
          new ImageData(1, 1),
          { width: 1, height: 1 },
          {}
        ),
      () =>
        new FilterProcessor().processBulge(
          new ImageData(1, 1),
          { width: 1, height: 1 },
          {}
        ),
      () =>
        new FilterProcessor().processPinch(
          new ImageData(1, 1),
          { width: 1, height: 1 },
          {}
        ),
      () =>
        new NoiseProcessor().processTwist(
          new ImageData(1, 1),
          { width: 1, height: 1 },
          {}
        ),
      () =>
        new NoiseProcessor().processSwirl(
          new ImageData(1, 1),
          { width: 1, height: 1 },
          {}
        ),
      () =>
        new WaveformProcessor().processRipple(
          new ImageData(1, 1),
          { width: 1, height: 1 },
          {}
        ),
    ].forEach((fn, i) => {
      const result = fn();
      expect(result).toBeInstanceOf(ImageData);
    });
  });

  it('covers out-of-bounds pixel access scenarios', () => {
    const distortionProcessor = new DistortionProcessor();
    const filterProcessor = new FilterProcessor();
    const noiseProcessor = new NoiseProcessor();
    const waveformProcessor = new WaveformProcessor();

    const input = new ImageData(3, 3);

    [
      () =>
        distortionProcessor.processWave(
          input,
          { width: 3, height: 3 },
          {
            direction: 'horizontal',
            amplitude: 100,
          }
        ),
      () =>
        filterProcessor.processBulge(
          input,
          { width: 3, height: 3 },
          {
            centerX: 0,
            centerY: 0,
            radius: 20,
            amplitude: 100,
            intensity: 2,
          }
        ),
      () =>
        filterProcessor.processPinch(
          input,
          { width: 3, height: 3 },
          {
            centerX: 1,
            centerY: 1,
            radius: 20,
            amplitude: 100,
            intensity: 2,
          }
        ),
      () =>
        noiseProcessor.processTwist(
          input,
          { width: 3, height: 3 },
          {
            centerX: 0,
            centerY: 0,
            radius: 20,
            twist: 10,
            intensity: 2,
          }
        ),
      () =>
        noiseProcessor.processSwirl(
          input,
          { width: 3, height: 3 },
          {
            centerX: 1,
            centerY: 1,
            radius: 20,
            twist: 10,
            intensity: 2,
          }
        ),
      () =>
        waveformProcessor.processRipple(
          input,
          { width: 3, height: 3 },
          {
            centerX: 0,
            centerY: 0,
            radius: 20,
            amplitude: 100,
            frequency: 1,
          }
        ),
    ].forEach((fn, i) => {
      const result = fn();
      expect(result).toBeInstanceOf(ImageData);
    });
  });
});
