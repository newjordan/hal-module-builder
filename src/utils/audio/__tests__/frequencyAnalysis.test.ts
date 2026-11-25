import {
  FFT_SIZES,
  FREQUENCY_RANGES,
  FrequencyProcessor,
  binIndexToFrequency,
  calculateRMSEnergy,
  createAnalyser,
  detectOnset,
  extractFrequencyRange,
  frequencyToBinIndex,
  getDominantFrequency,
  getSpectralCentroid,
} from '../frequencyAnalysis';

describe('frequencyAnalysis', () => {
  const sampleRate = 44100;
  const fftSize = FFT_SIZES.low;

  it('converts between bin indexes and frequencies', () => {
    expect(binIndexToFrequency(0, sampleRate, fftSize)).toBe(0);
    expect(binIndexToFrequency(1, sampleRate, fftSize)).toBeCloseTo(
      sampleRate / fftSize
    );
    expect(frequencyToBinIndex(sampleRate / fftSize, sampleRate, fftSize)).toBe(
      1
    );
    expect(
      frequencyToBinIndex(FREQUENCY_RANGES.bass.min, sampleRate, fftSize)
    ).toBe(0);
  });

  it('extracts a named frequency range and ignores empty input safely', () => {
    const data = Uint8Array.from({ length: 64 }, (_, index) => index);

    const bass = extractFrequencyRange(data, 'bass', sampleRate, fftSize);
    const treble = extractFrequencyRange(data, 'treble', sampleRate, fftSize);

    expect(bass.length).toBeGreaterThan(0);
    expect(bass[0]).toBe(0);
    expect(treble.length).toBeGreaterThan(0);
    expect(
      extractFrequencyRange(new Uint8Array(), 'mid', sampleRate, fftSize)
    ).toEqual(new Uint8Array());
  });

  it('finds the dominant frequency and spectral centroid', () => {
    const data = new Uint8Array(8);
    data[3] = 200;
    data[4] = 50;

    expect(getDominantFrequency(data, sampleRate, fftSize)).toBeCloseTo(
      binIndexToFrequency(3, sampleRate, fftSize)
    );

    const centroid = getSpectralCentroid(data, sampleRate, fftSize);
    const low = binIndexToFrequency(3, sampleRate, fftSize);
    const high = binIndexToFrequency(4, sampleRate, fftSize);
    expect(centroid).toBeGreaterThan(low);
    expect(centroid).toBeLessThan(high);
    expect(getSpectralCentroid(new Uint8Array(4), sampleRate, fftSize)).toBe(0);
  });

  it('detects onsets from rising energy and rejects mismatched frames', () => {
    const quiet = new Uint8Array(4);
    const loud = Uint8Array.from([255, 255, 255, 255]);

    expect(detectOnset(quiet, loud, 0.3)).toBe(true);
    expect(detectOnset(loud, quiet, 0.3)).toBe(false);
    expect(detectOnset(quiet, new Uint8Array(3))).toBe(false);
  });

  it('calculates normalized RMS energy', () => {
    expect(calculateRMSEnergy(new Uint8Array())).toBe(0);
    expect(calculateRMSEnergy(Uint8Array.from([0, 0, 0, 0]))).toBe(0);
    expect(calculateRMSEnergy(Uint8Array.from([255, 255]))).toBeCloseTo(1);
    expect(calculateRMSEnergy(Uint8Array.from([0, 255]))).toBeCloseTo(
      Math.sqrt(0.5)
    );
  });

  it('configures an analyser and smooths a frame', () => {
    const analyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 4,
      getByteFrequencyData: (target: Uint8Array) => {
        target.set([0, 255, 128, 0]);
      },
    };
    const context = {
      createAnalyser: () => analyser,
    } as unknown as AudioContext;

    const created = createAnalyser(context, 256, 0.4);
    expect(created.fftSize).toBe(256);
    expect(created.smoothingTimeConstant).toBe(0.4);

    const processor = new FrequencyProcessor(8);
    const first = processor.processFrame(
      analyser as unknown as AnalyserNode,
      1
    );
    expect(first).not.toBeNull();
    expect(first?.[1]).toBeCloseTo(1);
    expect(first?.[2]).toBeCloseTo(128 / 255);

    const second = processor.processFrame(
      analyser as unknown as AnalyserNode,
      1
    );
    expect(second).toBeNull();

    processor.reset();
    expect(processor.getCurrentData().every(value => value === 0)).toBe(true);
  });
});
