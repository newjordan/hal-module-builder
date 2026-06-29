import { NoiseProcessor } from '../NoiseProcessor';

function makeInput(w: number, h: number) {
  const data = new ImageData(w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 5;
    data.data[i + 1] = 6;
    data.data[i + 2] = 7;
    data.data[i + 3] = 255;
  }
  return data;
}

describe('NoiseProcessor edge cases', () => {
  it('handles defaults for intensity/speed/time and radius=0 (copy path)', () => {
    const width = 6,
      height = 3;
    const input = makeInput(width, height);
    const proc = new NoiseProcessor();

    const outTwist = proc.processTwist(
      input,
      { width, height, time: undefined },
      {
        radius: 0,
        twist: undefined,
        intensity: undefined,
        speed: undefined,
      } as any
    );

    // copy path across image
    for (let i = 0; i < outTwist.data.length; i += 4) {
      expect(outTwist.data[i]).toBe(5);
      expect(outTwist.data[i + 1]).toBe(6);
      expect(outTwist.data[i + 2]).toBe(7);
      expect(outTwist.data[i + 3]).toBe(255);
    }

    const outSwirl = proc.processSwirl(
      input,
      { width, height, time: undefined },
      {
        radius: 0,
        twist: undefined,
        intensity: undefined,
        speed: undefined,
      } as any
    );

    for (let i = 0; i < outSwirl.data.length; i += 4) {
      expect(outSwirl.data[i]).toBe(5);
      expect(outSwirl.data[i + 1]).toBe(6);
      expect(outSwirl.data[i + 2]).toBe(7);
      expect(outSwirl.data[i + 3]).toBe(255);
    }
  });
});
