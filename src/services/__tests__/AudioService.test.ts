/**
 * AudioService Tests
 * Covers current singleton/object API surface.
 */
import { AudioService } from '../AudioService';

const mockTrackStop = jest.fn();
const mockGetTracks = jest.fn(() => [{ stop: mockTrackStop }]);
const mockStream = { getTracks: mockGetTracks } as unknown as MediaStream;

const mockGetByteFrequencyData = jest.fn((buffer: Uint8Array) => {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.min(255, i * 8);
  }
});

const mockSourceNode = {
  buffer: null as AudioBuffer | null,
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  onended: null as (() => void) | null,
} as unknown as AudioBufferSourceNode;

const mockAnalyserNode = {
  fftSize: 0,
  frequencyBinCount: 16,
  getByteFrequencyData: mockGetByteFrequencyData,
} as unknown as AnalyserNode;

const mockMediaStreamSource = {
  connect: jest.fn(),
} as unknown as MediaStreamAudioSourceNode;

const mockDecodeAudioData = jest.fn(async () => ({}) as AudioBuffer);
const mockCreateBufferSource = jest.fn(
  () => ({ ...mockSourceNode }) as AudioBufferSourceNode
);
const mockClose = jest.fn();

const mockAudioContext = {
  state: 'running',
  destination: {} as AudioNode,
  decodeAudioData: mockDecodeAudioData,
  createBufferSource: mockCreateBufferSource,
  createMediaStreamSource: jest.fn(() => mockMediaStreamSource),
  createAnalyser: jest.fn(() => mockAnalyserNode),
  close: mockClose,
} as unknown as AudioContext;

describe('AudioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (global as any).AudioContext = jest.fn(() => mockAudioContext);
    (global as any).requestAnimationFrame = jest.fn(() => 1);
    (global as any).navigator = global.navigator || {};
    (global.navigator as any).mediaDevices = {
      getUserMedia: jest.fn(async () => mockStream),
    };
  });

  afterEach(() => {
    AudioService.dispose();
  });

  it('starts visualizer and emits normalized data', async () => {
    const onData = jest.fn();

    await AudioService.startVisualizer(onData);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });
    expect(onData).toHaveBeenCalled();
    const emitted = onData.mock.calls[0]?.[0] as number[];
    expect(Array.isArray(emitted)).toBe(true);
    expect(emitted.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('stops visualizer tracks', async () => {
    await AudioService.startVisualizer(() => {});

    AudioService.stopVisualizer();

    expect(mockGetTracks).toHaveBeenCalled();
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it('plays decoded audio and stops prior layer playback', async () => {
    const audioData = new ArrayBuffer(8);

    await AudioService.playAudio(audioData, 'layer-1');
    const firstSource = mockCreateBufferSource.mock.results[0]
      ?.value as AudioBufferSourceNode;
    expect(mockDecodeAudioData).toHaveBeenCalledWith(audioData);
    expect(firstSource.start).toHaveBeenCalledWith(0);

    await AudioService.playAudio(audioData, 'layer-1');
    expect(firstSource.stop).toHaveBeenCalled();
  });

  it('stops specific layer audio and disposes resources', async () => {
    const audioData = new ArrayBuffer(8);
    await AudioService.playAudio(audioData, 'layer-2');

    AudioService.stopAudio('layer-2');
    AudioService.dispose();

    const source = mockCreateBufferSource.mock.results[0]
      ?.value as AudioBufferSourceNode;
    expect(source.stop).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
