import { audioValidators } from '../validators/audioValidators';

/**
 * AudioValidationService: Handles audio parameter validation with domain-specific expertise.
 * Provides audio format validation, frequency range validation, and parameter mapping.
 */
export class AudioValidationService {
  /**
   * Validates audio data array for proper format and values
   * @param data Array of audio samples to validate
   * @returns boolean indicating if audio data is valid
   */
  validateAudioData(data: number[]): boolean {
    return audioValidators.validateAudioData(data);
  }
}

export default AudioValidationService;
