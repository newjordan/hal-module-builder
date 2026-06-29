/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { AudioVisualizer } from '../AudioVisualizer';
import { Layer } from '../../../types/layer-types';

// Mock the audio context
const mockAudioContext = {
  createMediaStreamSource: jest.fn(),
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 128,
    connect: jest.fn(),
    getByteFrequencyData: jest.fn(),
    frequencyBinCount: 64,
  }),
  suspend: jest.fn(),
  resume: jest.fn(),
  close: jest.fn(),
  state: 'suspended',
};

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
    addEventListener: jest.fn(),
  },
});

// Mock AudioContext
(global as any).AudioContext = jest.fn(() => mockAudioContext);

describe('AudioVisualizer', () => {
  const mockLayers: Layer[] = [
    {
      id: 'test-layer',
      name: 'Test Layer',
      type: 'effect',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      equalizerSettings: {
        barCount: 32,
        barStyle: 'line',
        barWidth: 2,
        barSpacing: 1,
        barRotation: 0,
        innerRadius: 120,
        maxHeight: 30,
        responseSpeed: 0.7,
        frequencyRange: 'full',
        colorMode: 'gradient',
        primaryColor: '#00ff00',
        secondaryColor: '#0000ff',
        glowIntensity: 0.3,
        glowColor: '#00ff00',
        symmetry: 'none',
        pulseMode: 'subtle',
        positionX: 0,
        positionY: 0,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AudioVisualizer layers={mockLayers} />);
    expect(
      screen.getByRole('button', { name: /start audio visualization/i })
    ).toBeInTheDocument();
  });

  it('displays start button when inactive', () => {
    render(<AudioVisualizer layers={mockLayers} />);
    expect(screen.getByText(/start/i)).toBeInTheDocument();
  });

  it('accepts custom configuration', () => {
    const config = {
      fftSize: 256,
      defaultResponseSpeed: 0.9,
      autoCleanup: false,
    };

    render(<AudioVisualizer layers={mockLayers} config={config} />);
    expect(
      screen.getByRole('button', { name: /start audio visualization/i })
    ).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    // Mock getUserMedia to fail
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      new Error('Microphone access denied')
    );

    render(<AudioVisualizer layers={mockLayers} />);
    expect(
      screen.getByRole('button', { name: /start audio visualization/i })
    ).toBeInTheDocument();
  });
});
