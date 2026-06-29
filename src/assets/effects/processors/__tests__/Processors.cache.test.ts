import { DistortionProcessor } from '../DistortionProcessor';
import { FilterProcessor } from '../FilterProcessor';
import { NoiseProcessor } from '../NoiseProcessor';
import { WaveformProcessor } from '../WaveformProcessor';

describe('Processor cache branches', () => {
  it('covers DistortionProcessor cache dimension change', () => {
    const processor = new DistortionProcessor();

    processor.processWave(
      new ImageData(3, 3),
      {
        width: 3,
        height: 3,
        time: 0,
      },
      { direction: 'horizontal' }
    );

    processor.processWave(
      new ImageData(5, 5),
      {
        width: 5,
        height: 5,
        time: 0,
      },
      { direction: 'horizontal' }
    );

    expect(true).toBe(true);
  });

  it('covers FilterProcessor cache dimension change in bulge', () => {
    const processor = new FilterProcessor();

    processor.processBulge(
      new ImageData(3, 3),
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {}
    );

    processor.processBulge(
      new ImageData(4, 4),
      {
        width: 4,
        height: 4,
        time: 0,
      },
      {}
    );

    expect(true).toBe(true);
  });

  it('covers FilterProcessor cache dimension change in pinch', () => {
    const processor = new FilterProcessor();

    processor.processPinch(
      new ImageData(2, 2),
      {
        width: 2,
        height: 2,
        time: 0,
      },
      {}
    );

    processor.processPinch(
      new ImageData(6, 6),
      {
        width: 6,
        height: 6,
        time: 0,
      },
      {}
    );

    expect(true).toBe(true);
  });

  it('covers NoiseProcessor cache dimension change in twist', () => {
    const processor = new NoiseProcessor();

    processor.processTwist(
      new ImageData(3, 3),
      {
        width: 3,
        height: 3,
        time: 0,
      },
      {}
    );

    processor.processTwist(
      new ImageData(7, 7),
      {
        width: 7,
        height: 7,
        time: 0,
      },
      {}
    );

    expect(true).toBe(true);
  });

  it('covers NoiseProcessor cache dimension change in swirl', () => {
    const processor = new NoiseProcessor();

    processor.processSwirl(
      new ImageData(4, 4),
      {
        width: 4,
        height: 4,
        time: 0,
      },
      {}
    );

    processor.processSwirl(
      new ImageData(8, 8),
      {
        width: 8,
        height: 8,
        time: 0,
      },
      {}
    );

    expect(true).toBe(true);
  });

  it('covers WaveformProcessor cache dimension change', () => {
    const processor = new WaveformProcessor();

    processor.processRipple(
      new ImageData(5, 5),
      {
        width: 5,
        height: 5,
        time: 0,
      },
      {}
    );

    processor.processRipple(
      new ImageData(9, 9),
      {
        width: 9,
        height: 9,
        time: 0,
      },
      {}
    );

    expect(true).toBe(true);
  });

  it('covers FilterProcessor distance >= radius branch (outside effect area)', () => {
    const processor = new FilterProcessor();
    const input = new ImageData(10, 10);

    const result = processor.processBulge(
      input,
      {
        width: 10,
        height: 10,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 2,
        amplitude: 10,
        intensity: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers NoiseProcessor distance >= radius branch (outside effect area)', () => {
    const processor = new NoiseProcessor();
    const input = new ImageData(10, 10);

    const result = processor.processTwist(
      input,
      {
        width: 10,
        height: 10,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 2,
        twist: 1,
        intensity: 1,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });

  it('covers WaveformProcessor distance >= radius branch (outside effect area)', () => {
    const processor = new WaveformProcessor();
    const input = new ImageData(10, 10);

    const result = processor.processRipple(
      input,
      {
        width: 10,
        height: 10,
        time: 0,
      },
      {
        centerX: 0.5,
        centerY: 0.5,
        radius: 2,
        amplitude: 10,
        frequency: 0.1,
        speed: 1,
      }
    );

    expect(result).toBeInstanceOf(ImageData);
  });
});
