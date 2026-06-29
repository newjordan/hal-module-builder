import ValidationMetrics from '../ValidationMetrics';

describe('ValidationMetrics', () => {
  it('records timings for operations', async () => {
    const m = new ValidationMetrics();
    const t = m.begin('op1');
    // simulate small delay
    await new Promise(r => setTimeout(r, 5));
    const d = t.end();

    expect(typeof d).toBe('number');
    const all = m.getAll();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('op1');
    expect(all[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('can clear collected records', () => {
    const m = new ValidationMetrics();
    m.begin('op').end();
    expect(m.getAll().length).toBe(1);
    m.clear();
    expect(m.getAll().length).toBe(0);
  });
});
