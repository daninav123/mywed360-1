import { render } from '@testing-library/react';
import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';

import { useGanttNormalizedTasks, useGanttBoundedTasks } from './useGanttTasks';

function GanttTest({ tasks, start, end, meetings, onResult }) {
  const { uniqueGanttTasks } = useGanttNormalizedTasks(tasks);
  const bounded = useGanttBoundedTasks(uniqueGanttTasks, start, end, meetings);
  useEffect(() => {
    onResult({ unique: uniqueGanttTasks, bounded });
  }, [uniqueGanttTasks, bounded, onResult]);
  return null;
}

describe('useGanttTasks', () => {
  it('normalizes tasks and applies bounds', async () => {
    const tasks = [
      { id: 'a', title: 'A', start: '2025-01-01', end: '2025-01-10' },
      { id: 'b', title: 'B', start: new Date('2025-02-01'), end: new Date('2025-02-15') },
      { id: 'bad', title: 'Bad', start: null, end: null },
    ];
    const results = await new Promise((resolve) => {
      render(
        <GanttTest
          tasks={tasks}
          start={new Date('2025-01-01')}
          end={new Date('2025-03-01')}
          meetings={[]}
          onResult={resolve}
        />
      );
    });
    expect(results.unique.length).toBe(2);
    // bounded includes a bounds task marker at the end, so >= 2
    expect(results.bounded.length).toBeGreaterThanOrEqual(2);
  });
});
