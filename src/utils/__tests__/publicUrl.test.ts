import { publicUrl } from '../publicUrl';

describe('publicUrl', () => {
  it('roots public files when no deploy base is injected', () => {
    expect(publicUrl('hal_lens_1.png')).toBe('/hal_lens_1.png');
    expect(publicUrl('/studio')).toBe('/studio');
    expect(publicUrl('')).toBe('/');
  });
});
