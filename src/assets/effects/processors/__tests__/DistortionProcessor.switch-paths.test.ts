import { DistortionProcessor } from '../DistortionProcessor';

function makeLabeledInput(w: number, h: number) {
  const img = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const label = y * 10 + x; // unique small label per pixel
      img.data[idx] = label; // R
      img.data[idx + 1] = 0; // G
      img.data[idx + 2] = 0; // B
      img.data[idx + 3] = 255; // A
    }
  }
  return img;
}

function readLabelAt(img: ImageData, w: number, x: number, y: number): number {
  const idx = (y * w + x) * 4;
  return img.data[idx];
}

describe('DistortionProcessor switch paths (no DI)', () => {
  it('horizontal path clamps to right edge for large positive offset', () => {
    const width = 3,
      height = 3;
    const input = makeLabeledInput(width, height);
    const proc = new DistortionProcessor();

    const params: any = {
      amplitude: 10,
      frequency: 1,
      speed: 0,
      phase: 0,
      direction: 'horizontal',
    };

    // Check output at (x=0,y=1)
    const out = proc.processWave(input, { width, height, time: 0 }, params);
    // Expected sourceX = 0 + sin(1*1+0)*10 ~= 8.41 -> round 8 -> clamp to 2; sourceY=1
    const expectedLabel = 1 * 10 + 2; // (2,1)
    const actualLabel = readLabelAt(out, width, 0, 1);
    expect(actualLabel).toBe(expectedLabel);
  });

  it('radial path with center at (0.5,0.5) moves (1,1) toward top-left and clamps', () => {
    const width = 3,
      height = 3;
    const input = makeLabeledInput(width, height);
    const proc = new DistortionProcessor();

    const params: any = {
      amplitude: 10,
      frequency: 1,
      speed: 0,
      phase: 0,
      direction: 'radial',
      centerX: 0.5,
      centerY: 0.5,
    };

    const out = proc.processWave(input, { width, height, time: 0 }, params);
    // For (1,1) relative to center (1.5,1.5): angle points to -135deg; large negative offset pushes to (-, -) -> clamps to (0,0)
    const actualLabel = readLabelAt(out, width, 1, 1);
    const expectedLabel = 0 * 10 + 0;
    expect(actualLabel).toBe(expectedLabel);
  });
});
