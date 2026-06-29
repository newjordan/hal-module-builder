import { DistortionProcessor } from '../DistortionProcessor';

function makeLabeledInput(w: number, h: number) {
  const img = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const label = y * 10 + x;
      img.data[idx] = label;
      img.data[idx + 1] = 0;
      img.data[idx + 2] = 0;
      img.data[idx + 3] = 255;
    }
  }
  return img;
}

function equalImageData(a: ImageData, b: ImageData): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  const da = a.data,
    db = b.data;
  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) return false;
  }
  return true;
}

describe('DistortionProcessor DI defaults (horizontal uses default algo when not provided)', () => {
  it('uses default DI horizontal algorithm when only vertical is provided', () => {
    const width = 5,
      height = 5;
    const input = makeLabeledInput(width, height);

    // Provide only vertical; horizontal should come from defaultWaveAlgorithms via merge
    const procDi = new DistortionProcessor({
      vertical: (x, y, _w, _h, _p, amplitude, frequency, phase) => ({
        sourceX: x,
        sourceY: y + Math.sin(x * frequency + phase) * amplitude,
      }),
    });

    const procSwitch = new DistortionProcessor(); // no DI -> switch path

    const params: any = {
      amplitude: 6,
      frequency: 0.6,
      speed: 0,
      phase: 0.25,
      direction: 'horizontal',
    };

    const outDi = procDi.processWave(input, { width, height, time: 0 }, params);
    const outSwitch = procSwitch.processWave(
      input,
      { width, height, time: 0 },
      params
    );
    expect(equalImageData(outDi, outSwitch)).toBe(true);
  });
});
