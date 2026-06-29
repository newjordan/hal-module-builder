import { AudioValidationService } from '../AudioValidationService';
import { validateAudioData as utilsValidate } from '../../../utils/audio/audioProcessing';

describe('AudioValidationService.validateAudioData (parity with utils)', () => {
  const svc = new AudioValidationService();

  it('matches utils behavior across samples', () => {
    const cases: number[][] = [
      [0, 1, 2, 3],
      [255, 128, 0],
      [], // invalid
      [1, -1, 2], // invalid negative
      [NaN as any, 0], // invalid NaN
    ];

    for (const c of cases) {
      expect(svc.validateAudioData(c as any)).toBe(utilsValidate(c as any));
    }
  });
});
