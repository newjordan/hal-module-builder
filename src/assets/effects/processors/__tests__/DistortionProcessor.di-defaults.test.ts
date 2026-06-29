import { DistortionProcessor, WaveAlgorithms } from '../DistortionProcessor';

function makeInput(w: number, h: number) {
  const data = new ImageData(w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 100;
    data.data[i + 1] = 50;
    data.data[i + 2] = 25;
    data.data[i + 3] = 255;
  }
  return data;
}

describe('DistortionProcessor DI defaults (merge with provided)', () => {
  it('uses default algorithms for directions not provided in Partial<WaveAlgorithms>', () => {
    const width = 3,
      height = 3;
    const input = makeInput(width, height);

    // Provide only a custom horizontal algo; others should fall back to defaults
    const customHorizontal: WaveAlgorithms['horizontal'] = (x, y) => ({
      sourceX: x,
      sourceY: y,
    });

    const proc = new DistortionProcessor({ horizontal: customHorizontal });

    // vertical default
    const outV = proc.processWave(input, { width, height, time: 0 }, {
      direction: 'vertical',
      amplitude: 1,
      frequency: 0.1,
      speed: 0,
      phase: 0,
    } as any);
    expect(outV.width).toBe(width);
    expect(outV.height).toBe(height);

    // diagonal default
    const outD = proc.processWave(input, { width, height, time: 0 }, {
      direction: 'diagonal',
      amplitude: 1,
      frequency: 0.1,
      speed: 0,
      phase: 0,
    } as any);
    expect(outD.width).toBe(width);

    // radial default
    const outR = proc.processWave(input, { width, height, time: 0 }, {
      direction: 'radial',
      amplitude: 1,
      frequency: 0.1,
      speed: 0,
      phase: 0,
      centerX: 0.5,
      centerY: 0.5,
    } as any);
    expect(outR.width).toBe(width);
  });
});
