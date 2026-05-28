// ═══════════════════════════════════════════════════════════════
//  auto-save.test.ts — Tests unitaires de AutoSave
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoSave } from '$shared/store/auto-save.js';

describe('AutoSave', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(()  => { vi.useRealTimers(); });

  it('calls onSave after the delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const as = new AutoSave(onSave, 800);
    as.schedule();
    expect(onSave).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('debounces multiple rapid schedule() calls', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const as = new AutoSave(onSave, 800);
    as.schedule();
    as.schedule();
    as.schedule();
    await vi.runAllTimersAsync();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on each schedule() call', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const as = new AutoSave(onSave, 800);
    as.schedule();
    vi.advanceTimersByTime(600);
    expect(onSave).not.toHaveBeenCalled();
    as.schedule();                    // resets the 800ms window
    vi.advanceTimersByTime(600);
    expect(onSave).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('cancel() prevents the pending save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const as = new AutoSave(onSave, 800);
    as.schedule();
    as.cancel();
    await vi.runAllTimersAsync();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('cancel() is safe when no timer is pending', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const as = new AutoSave(onSave, 800);
    expect(() => as.cancel()).not.toThrow();
  });

  it('flush() saves immediately and cancels the timer', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const as = new AutoSave(onSave, 800);
    as.schedule();
    await as.flush();
    expect(onSave).toHaveBeenCalledTimes(1);
    // Timer was cancelled — onSave should NOT fire again
    await vi.runAllTimersAsync();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('flush() works even without a prior schedule()', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const as = new AutoSave(onSave, 800);
    await as.flush();
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
