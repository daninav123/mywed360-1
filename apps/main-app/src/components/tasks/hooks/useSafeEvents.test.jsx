import { render } from '@testing-library/react';
import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';

import { useSafeEvents } from './useSafeEvents';

function SafeEventsTest({ meetings, onResult }) {
  const res = useSafeEvents(meetings);
  useEffect(() => onResult(res), [res, onResult]);
  return null;
}

describe('useSafeEvents', () => {
  it('filters invalid events and sorts', async () => {
    const meetings = [
      { id: '1', title: 'Ok', start: '2025-01-02', end: '2025-01-03' },
      { id: 'dup', title: 'Dup', start: '2025-01-01', end: '2025-01-01' },
      { id: 'dup', title: 'Dup', start: '2025-01-01', end: '2025-01-01' },
      { id: 'bad', title: 'Bad', start: null, end: null },
    ];
    const out = await new Promise((resolve) => {
      render(<SafeEventsTest meetings={meetings} onResult={resolve} />);
    });
    // safeEvents may include duplicates; safeMeetings is de-duplicated
    expect(out.safeMeetings.length).toBe(2);
    expect(out.safeEvents.length).toBeGreaterThanOrEqual(2);
    expect(out.sortedEvents[0].start <= out.sortedEvents[1].start).toBe(true);
  });
});
