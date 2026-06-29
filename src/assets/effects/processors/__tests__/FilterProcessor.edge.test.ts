import { FilterProcessor } from '../FilterProcessor';

function makeInput(w: number, h: number) {
  const data = new ImageData(w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 1;
    data.data[i + 1] = 2;
    data.data[i + 2] = 3;
    data.data[i + 3] = 255;
  }
  return data;
}

describe('FilterProcessor edge cases', () => {
  it('processBulge with radius=0 uses copy path for all pixels', () => {
    const width = 4,
      height = 4;
    const input = makeInput(width, height);
    const proc = new FilterProcessor();

    const out = proc.processBulge(input, { width, height, time: undefined }, {
      radius: 0,
      amplitude: 10,
      intensity: 1,
    } as any);

    for (let i = 0; i < out.data.length; i += 4) {
      expect(out.data[i]).toBe(1);
      expect(out.data[i + 1]).toBe(2);
      expect(out.data[i + 2]).toBe(3);
      expect(out.data[i + 3]).toBe(255);
    }
  });

  it('processPinch with radius=0 uses copy path for all pixels', () => {
    const width = 4,
      height = 4;
    const input = makeInput(width, height);
    const proc = new FilterProcessor();

    const out = proc.processPinch(input, { width, height, time: undefined }, {
      radius: 0,
      amplitude: 10,
      intensity: 1,
    } as any);

    for (let i = 0; i < out.data.length; i += 4) {
      expect(out.data[i]).toBe(1);
      expect(out.data[i + 1]).toBe(2);
      expect(out.data[i + 2]).toBe(3);
      expect(out.data[i + 3]).toBe(255);
    }
  });
});
