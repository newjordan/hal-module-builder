import { DistortionProcessor, WaveAlgorithms } from '../DistortionProcessor';

function makeInput(w: number, h: number) {
  const data = new ImageData(w, h);
  // encode coords into color for easy assertions
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      data.data[idx] = x; // R
      data.data[idx + 1] = y; // G
      data.data[idx + 2] = 0; // B
      data.data[idx + 3] = 255; // A
    }
  }
  return data;
}

describe('DistortionProcessor DI branch', () => {
  it('uses injected algorithms when provided', () => {
    const width = 4,
      height = 3;
    const input = makeInput(width, height);

    // Algorithm: always sample top-left (0,0)
    const sample00 = () => ({ sourceX: 0, sourceY: 0 });
    const algos: Partial<WaveAlgorithms> = {
      horizontal: sample00,
      vertical: sample00,
      diagonal: sample00,
      radial: sample00,
    };

    const proc = new DistortionProcessor(algos);
    const params: any = {
      amplitude: 10,
      frequency: 0.1,
      speed: 1,
      phase: 0,
      direction: 'vertical',
    };
    const out = proc.processWave(input, { width, height, time: 0 }, params);

    // All pixels should equal input pixel (0,0) => R=0, G=0
    for (let i = 0; i < out.data.length; i += 4) {
      expect(out.data[i]).toBe(0);
      expect(out.data[i + 1]).toBe(0);
      expect(out.data[i + 2]).toBe(0);
      expect(out.data[i + 3]).toBe(255);
    }
  });
});
