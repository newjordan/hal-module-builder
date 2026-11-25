import {
  ensureUniqueId,
  generateIdFromName,
  generateLayerId,
  generateUniqueId,
  isValidId,
  sanitizeForId,
} from '../id-utils';

describe('id-utils', () => {
  it('builds prefixed ids without whitespace', () => {
    const id = generateUniqueId('layer');
    expect(id.startsWith('layer_')).toBe(true);
    expect(isValidId(id)).toBe(true);
    expect(generateLayerId().startsWith('layer_')).toBe(true);
  });

  it('rejects blank or padded ids', () => {
    expect(isValidId('')).toBe(false);
    expect(isValidId(' has space')).toBe(false);
    expect(isValidId('clean-id')).toBe(true);
  });

  it('sanitizes display names into id fragments', () => {
    expect(sanitizeForId('HAL Eye 01!')).toBe('hal_eye_01');
    expect(sanitizeForId('---')).toBe('');
  });

  it('keeps generated names unique inside a collection', () => {
    const collection = [{ id: 'preset_hal_eye' }];
    const first = ensureUniqueId(collection, 'preset_hal_eye', 'preset');
    expect(first).not.toBe('preset_hal_eye');
    expect(isValidId(first)).toBe(true);

    const named = generateIdFromName([], 'Radial Rings', 'preset');
    expect(named).toBe('preset_radial_rings');
    const again = generateIdFromName([{ id: named }], 'Radial Rings', 'preset');
    expect(again).not.toBe(named);
  });
});
