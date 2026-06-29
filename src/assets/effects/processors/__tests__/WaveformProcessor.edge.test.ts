import { WaveformProcessor } from '../WaveformProcessor';

function makeInput(w: number, h: number) {
  const data = new ImageData(w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 10;
    data.data[i + 1] = 20;
    data.data[i + 2] = 30;
    data.data[i + 3] = 255;
  }
  return data;
}

describe('WaveformProcessor edge cases', () => {
  it('handles undefined time (phase uses 0) and radius=0 (falls back to copy)', () => {
    const width = 5,
      height = 4;
    const input = makeInput(width, height);
    const proc = new WaveformProcessor();

    const out = proc.processRipple(input, { width, height, time: undefined }, {
      radius: 0,
      amplitude: 10,
      frequency: 0.1,
      speed: 2,
    } as any);

    // With radius 0, all pixels come from else branch (copy)
    expect(out.width).toBe(width);
    expect(out.height).toBe(height);
    for (let i = 0; i < out.data.length; i += 4) {
      expect(out.data[i]).toBe(10);
      expect(out.data[i + 1]).toBe(20);
      expect(out.data[i + 2]).toBe(30);
      expect(out.data[i + 3]).toBe(255);
    }
  });
});
