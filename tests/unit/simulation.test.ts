import { describe, expect, it } from 'vitest';
import { createInitialSession } from '../../src/shared/session.js';
import {
  cancelSimulationQueue,
  enqueueSimulation,
  tickSimulation,
} from '../../src/shared/simulation.js';

function controlledSession() {
  return {
    ...createInitialSession({ now: 1_000, mode: 'simulated' }),
    phase: 'controlled' as const,
    timer: {
      ...createInitialSession({ now: 1_000 }).timer,
      status: 'running' as const,
    },
  };
}

describe('safe simulation queue', () => {
  it('queues, starts, and completes only fictional effects', () => {
    const queued = enqueueSimulation(controlledSession(), 'copy_files', 2_000);
    expect(queued.simulation.queue[0]?.status).toBe('queued');
    const running = tickSimulation(queued, 2_100);
    expect(running.simulation.queue[0]?.status).toBe('running');
    const completed = tickSimulation(running, 5_000);
    expect(completed.simulation.queue[0]?.status).toBe('completed');
    expect(completed.simulation.exposedPercent).toBe(22);
    expect(completed.risk.files).toBeGreaterThan(0);
  });

  it('cancels queued and running effects on pause', () => {
    const queued = enqueueSimulation(controlledSession(), 'expose_camera', 2_000);
    const running = tickSimulation(queued, 2_100);
    const paused = {
      ...running,
      timer: { ...running.timer, status: 'paused' as const },
    };
    const cancelled = tickSimulation(paused, 2_200);
    expect(cancelled.simulation.queue[0]?.status).toBe('cancelled');
  });

  it('cancels whole pending queue for emergency stop', () => {
    let session = enqueueSimulation(controlledSession(), 'move_cursor', 2_000);
    session = enqueueSimulation(session, 'open_folder', 2_001);
    const cancelled = cancelSimulationQueue(session, 'prueba', 2_100);
    expect(cancelled.simulation.queue.every((item) => item.status === 'cancelled')).toBe(true);
  });
});
