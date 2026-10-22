import { calculateRisk } from './risk.js';
import type {
  DemoSession,
  SimulationActionDefinition,
  SimulationActionId,
  TimelineEvent,
} from './types.js';

export const simulationActions: Record<SimulationActionId, SimulationActionDefinition> = {
  move_cursor: action(
    'move_cursor',
    'Tomar el cursor',
    'Cursor ficticio cruza el escritorio.',
    1400,
    3,
  ),
  open_folder: action(
    'open_folder',
    'Abrir carpeta académica',
    'Muestra seis archivos ficticios.',
    1800,
    9,
  ),
  open_budget: action(
    'open_budget',
    'Abrir presupuesto',
    'Ventana ficticia revela gastos inventados.',
    1900,
    12,
    true,
  ),
  type_message: action(
    'type_message',
    'Escribir mensaje',
    'Escribe una advertencia teatral en pantalla.',
    3000,
    8,
    true,
  ),
  copy_clipboard: action(
    'copy_clipboard',
    'Copiar portapapeles',
    'Representa una copia; no lee portapapeles real.',
    1600,
    13,
    true,
  ),
  copy_files: action(
    'copy_files',
    'Copiar archivos',
    'Anima transferencia de archivos ficticios.',
    2800,
    22,
    true,
  ),
  expose_microphone: action(
    'expose_microphone',
    'Simular micrófono',
    'Indicador narrativo; no solicita micrófono.',
    1700,
    10,
    true,
  ),
  expose_camera: action(
    'expose_camera',
    'Simular cámara',
    'Indicador narrativo; no solicita cámara.',
    1700,
    12,
    true,
  ),
  foreign_login: action(
    'foreign_login',
    'Lanzar alerta de acceso',
    'Inicio ficticio desde otra ubicación.',
    2100,
    16,
    true,
  ),
};

export function availableSimulationActions(session: DemoSession): SimulationActionDefinition[] {
  if (!['controlled', 'reveal'].includes(session.phase)) return [];
  return Object.values(simulationActions).filter(
    (definition) =>
      !session.simulation.queue.some(
        (item) => item.actionId === definition.id && item.status !== 'cancelled',
      ),
  );
}

export function enqueueSimulation(
  session: DemoSession,
  actionId: SimulationActionId,
  now = Date.now(),
): DemoSession {
  const definition = availableSimulationActions(session).find((item) => item.id === actionId);
  if (!definition) throw new Error('simulation_action_not_allowed');
  const itemId = `sim-${session.revision + 1}-${actionId}`;
  return {
    ...session,
    simulation: {
      ...session.simulation,
      queue: [
        ...session.simulation.queue,
        { id: itemId, actionId, status: 'queued', queuedAt: now },
      ],
    },
    timeline: [
      ...session.timeline,
      event(itemId, now, `Acción simulada confirmada: ${definition.label}`),
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

export function tickSimulation(session: DemoSession, now = Date.now()): DemoSession {
  if (session.phase === 'emergency')
    return cancelSimulationQueue(session, 'parada de emergencia', now);
  if (session.timer.status === 'paused')
    return cancelSimulationQueue(session, 'experiencia pausada', now);
  let queue = session.simulation.queue;
  let timeline = session.timeline;
  let exposedPercent = session.simulation.exposedPercent;
  let revisionDelta = 0;

  const running = queue.find((item) => item.status === 'running');
  if (running?.completesAt && running.completesAt <= now) {
    const definition = simulationActions[running.actionId];
    queue = queue.map((item) =>
      item.id === running.id ? { ...item, status: 'completed', completedAt: now } : item,
    );
    exposedPercent = Math.min(100, exposedPercent + definition.exposureDelta);
    timeline = [
      ...timeline,
      event(`${running.id}-done`, now, `Efecto completado: ${definition.label}`),
    ];
    revisionDelta += 1;
  }

  if (!queue.some((item) => item.status === 'running')) {
    const next = queue.find((item) => item.status === 'queued');
    if (next) {
      const definition = simulationActions[next.actionId];
      queue = queue.map((item) =>
        item.id === next.id
          ? { ...item, status: 'running', startedAt: now, completesAt: now + definition.durationMs }
          : item,
      );
      timeline = [
        ...timeline,
        event(`${next.id}-start`, now, `Representando: ${definition.label}`),
      ];
      revisionDelta += 1;
    }
  }

  if (revisionDelta === 0) return session;
  const next = {
    ...session,
    simulation: { queue, exposedPercent },
    timeline,
    revision: session.revision + revisionDelta,
    updatedAt: now,
  };
  return { ...next, risk: calculateRisk(next) };
}

export function cancelSimulationQueue(
  session: DemoSession,
  reason: string,
  now = Date.now(),
): DemoSession {
  const pending = session.simulation.queue.filter((item) =>
    ['queued', 'running'].includes(item.status),
  );
  if (pending.length === 0) return session;
  return {
    ...session,
    simulation: {
      ...session.simulation,
      queue: session.simulation.queue.map((item) =>
        ['queued', 'running'].includes(item.status)
          ? { ...item, status: 'cancelled', cancelledAt: now, completesAt: undefined }
          : item,
      ),
    },
    timeline: [
      ...session.timeline,
      event(`sim-cancel-${session.revision + 1}`, now, `Cola simulada cancelada: ${reason}`),
    ],
    revision: session.revision + 1,
    updatedAt: now,
  };
}

function action(
  id: SimulationActionId,
  label: string,
  description: string,
  durationMs: number,
  exposureDelta: number,
  highImpact = false,
): SimulationActionDefinition {
  return { id, label, description, durationMs, exposureDelta, highImpact };
}

function event(id: string, at: number, message: string): TimelineEvent {
  return { id: `event-${id}`, at, actor: 'attacker', kind: 'action', nature: 'simulated', message };
}
