import { validateAudioData as utilsValidateAudioData } from '../../utils/audio/audioProcessing';

/**
 * Audio validators: Pure validation functions for audio parameters, formats, and frequency ranges.
 * Maintains parity with existing audio processing utilities while providing domain-specific validation.
 */
export const audioValidators = {
  /**
   * Validates audio data array for proper format, range, and consistency
   * Ensures audio samples are within valid ranges and properly formatted
   * @param data Array of audio samples to validate
   * @returns boolean indicating if audio data is valid
   */
  validateAudioData(data: number[]): boolean {
    return utilsValidateAudioData(data);
  },
};

export default audioValidators;
