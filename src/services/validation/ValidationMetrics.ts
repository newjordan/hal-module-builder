/**
 * ValidationMetrics
 * Lightweight timing utility for validation operations.
 * Designed to be optional and non-invasive; no global side effects.
 */
export type TimingRecord = { name: string; durationMs: number };

export class ValidationMetrics {
  private records: TimingRecord[] = [];

  begin(name: string): { end: () => number } {
    const start = Date.now();
    return {
      end: () => {
        const durationMs = Date.now() - start;
        this.records.push({ name, durationMs });
        return durationMs;
      },
    };
  }

  getAll(): TimingRecord[] {
    return [...this.records];
  }

  clear(): void {
    this.records = [];
  }
}

export default ValidationMetrics;
