import { describe, expect, it } from 'vitest';
import { NEXT_ACTION, ACTIVE_STATUSES } from '@responder/lib/schema';

describe('NEXT_ACTION lifecycle mapping', () => {
  it('maps the full Phase 4 lifecycle: new -> acknowledged -> in_progress -> resolved -> closed', () => {
    expect(NEXT_ACTION.new).toEqual({ label: 'Acknowledge', next: 'acknowledged' });
    expect(NEXT_ACTION.acknowledged).toEqual({ label: 'Start Rescue', next: 'in_progress' });
    expect(NEXT_ACTION.in_progress).toEqual({ label: 'Resolve', next: 'resolved' });
    expect(NEXT_ACTION.resolved).toEqual({ label: 'Close', next: 'closed' });
  });

  it('has no further action once closed (terminal state)', () => {
    expect(NEXT_ACTION.closed).toBeUndefined();
  });
});

describe('ACTIVE_STATUSES', () => {
  it('contains exactly new, acknowledged, and in_progress', () => {
    expect([...ACTIVE_STATUSES].sort()).toEqual(['acknowledged', 'in_progress', 'new']);
  });

  it('excludes resolved and closed', () => {
    expect(ACTIVE_STATUSES).not.toContain('resolved');
    expect(ACTIVE_STATUSES).not.toContain('closed');
  });
});
