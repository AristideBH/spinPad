// ═══════════════════════════════════════════════════════════════
//  history.test.ts — Tests unitaires de CommitHistory
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { CommitHistory } from '$shared/store/history.js';

describe('CommitHistory', () => {
  it('cannot undo/redo right after seed', () => {
    const h = new CommitHistory<number>(50);
    h.seed(0);
    expect(h.canUndo).toBe(false);
    expect(h.canRedo).toBe(false);
  });

  it('undo returns the previous snapshot', () => {
    const h = new CommitHistory<number>(50);
    h.seed(0);
    h.commit(1);
    h.commit(2);
    expect(h.canUndo).toBe(true);
    expect(h.undo()).toBe(1);
    expect(h.undo()).toBe(0);
    expect(h.canUndo).toBe(false);
    expect(h.undo()).toBeUndefined();
  });

  it('redo replays an undone snapshot', () => {
    const h = new CommitHistory<number>(50);
    h.seed(0);
    h.commit(1);
    h.commit(2);
    h.undo();
    expect(h.canRedo).toBe(true);
    expect(h.redo()).toBe(2);
    expect(h.canRedo).toBe(false);
    expect(h.redo()).toBeUndefined();
  });

  it('a new commit after undo clears the redo stack', () => {
    const h = new CommitHistory<number>(50);
    h.seed(0);
    h.commit(1);
    h.commit(2);
    h.undo();
    h.commit(3);
    expect(h.canRedo).toBe(false);
    expect(h.undo()).toBe(1);
  });

  it('drops the oldest entries past capacity', () => {
    const h = new CommitHistory<number>(3);
    h.seed(0);
    h.commit(1);
    h.commit(2);
    h.commit(3); // log is now [1, 2, 3], 0 dropped
    expect(h.undo()).toBe(2);
    expect(h.undo()).toBe(1);
    expect(h.canUndo).toBe(false);
  });

  it('seed resets both stacks', () => {
    const h = new CommitHistory<number>(50);
    h.seed(0);
    h.commit(1);
    h.undo();
    h.seed(5);
    expect(h.canUndo).toBe(false);
    expect(h.canRedo).toBe(false);
  });
});
