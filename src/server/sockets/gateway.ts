import type { Server, Socket } from 'socket.io';
import { ZodError } from 'zod';
import {
  attackerActionSchema,
  decisionSubmitSchema,
  permissionAnswerSchema,
  phaseTransitionRequestSchema,
  profileSelectSchema,
  recoveryOrderSchema,
  recoveryStepSchema,
  remoteChecklistSchema,
  remoteStatusSchema,
  sessionEventSchema,
  signalExamineSchema,
  simulationEnqueueSchema,
  technicalUpdateSchema,
  timerControlSchema,
  webrtcDescriptionSchema,
  webrtcIceSchema,
} from '../../shared/schemas.js';
import { socketEvents } from '../../shared/events.js';
import { executeAttackerAction } from '../../shared/attacker-actions.js';
import { answerPermission } from '../../shared/permissions.js';
import { toPublicSession } from '../../shared/public-state.js';
import {
  completeRecovery,
  completeRecoveryStep,
  requestRemoteStop,
  validateRecoveryOrder,
} from '../../shared/recovery.js';
import { cancelSimulationQueue, enqueueSimulation } from '../../shared/simulation.js';
import { emergencyStopSession, transitionSession } from '../../shared/state-machine.js';
import {
  selectVictimProfile,
  updateRemoteChecklist,
  updateRemoteStatus,
} from '../../shared/session.js';
import { examineSignal, openSupportCase, submitDecision } from '../../shared/story.js';
import { activateQuickClose, pauseTimer, resumeTimer, startTimer } from '../../shared/timer.js';
import type {
  DemoSession,
  ExperienceRole,
  SessionCredentials,
  SocketAck,
} from '../../shared/types.js';
import type { AuthContext, SessionStore } from '../sessions/store.js';
import { SessionStoreError } from '../sessions/store.js';

interface AuthenticatedSocket extends Socket {
  data: {
    auth: AuthContext;
    eventTimes: number[];
  };
}

type Ack<T = undefined> = (result: SocketAck<T>) => void;

export function registerSocketGateway(io: Server, store: SessionStore) {
  const clock = setInterval(() => {
    for (const tick of store.tickTimers()) {
      emitRoleState(io, socketEvents.sessionState, tick.session);
      for (const minute of tick.milestones) {
        io.to(roomName(tick.session.id)).emit(socketEvents.timerWarning, {
          minute,
          remainingSeconds: tick.session.timer.remainingSeconds,
        });
      }
    }
    for (const tick of store.tickSimulations()) {
      emitRoleState(io, socketEvents.simulationUpdated, tick.session);
      emitRoleState(io, socketEvents.sessionState, tick.session);
    }
  }, 250);
  clock.unref();

  io.use((rawSocket, next) => {
    try {
      const socket = rawSocket as AuthenticatedSocket;
      const sessionId = String(socket.handshake.auth.sessionId ?? '');
      const token = String(socket.handshake.auth.token ?? '');
      socket.data.auth = store.authenticate(sessionId, token);
      socket.data.eventTimes = [];
      next();
    } catch (error) {
      next(new Error(publicError(error)));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const auth = socket.data.auth;
    const room = roomName(auth.sessionId);
    socket.join(room);
    socket.join(roleRoom(auth.sessionId, auth.role));
    const state = store.setParticipantStatus(auth, 'connected');
    socket.emit(socketEvents.connected, {
      socketId: socket.id,
      role: auth.role,
      timestamp: new Date().toISOString(),
    });
    socket.emit(socketEvents.sessionState, stateForRole(state, auth.role));
    io.to(roleRoom(auth.sessionId, 'coordinator')).emit(socketEvents.presence, state.participants);

    socket.on(socketEvents.heartbeat, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        sessionEventSchema.parse(payload);
        const next = store.markHeartbeat(auth);
        io.to(roleRoom(auth.sessionId, 'coordinator')).emit(
          socketEvents.presence,
          next.participants,
        );
        return stateForRole(next, auth.role);
      });
    });

    socket.on(socketEvents.phaseRequest, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = phaseTransitionRequestSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          transitionSession(session, input.target, input),
        );
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.timerControl, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = timerControlSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const action = { start: startTimer, pause: pauseTimer, resume: resumeTimer }[input.action];
        let next = store.updateState(auth, action);
        if (input.action === 'pause') {
          next = store.updateState(auth, (session) =>
            cancelSimulationQueue(session, 'experiencia pausada'),
          );
        }
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.quickClose, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, activateQuickClose);
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.profileSelect, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = profileSelectSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          selectVictimProfile(session, input.profileId),
        );
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.technicalUpdate, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = technicalUpdateSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) => ({
          ...session,
          technical: { ...session.technical, soundReady: input.soundReady },
          revision: session.revision + 1,
        }));
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.supportOpen, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, openSupportCase);
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.signalExamine, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = signalExamineSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) => examineSignal(session, input.signal));
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.decisionSubmit, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = decisionSubmitSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) => submitDecision(session, input.choice));
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.attackerAction, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = attackerActionSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          executeAttackerAction(session, input.action),
        );
        const latest = next.timeline.at(-1);
        if (latest?.kind === 'permission') {
          emitRoleState(io, socketEvents.permissionRequested, next);
        }
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.simulationEnqueue, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = simulationEnqueueSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) => enqueueSimulation(session, input.action));
        emitRoleState(io, socketEvents.simulationUpdated, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.simulationCancel, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker', 'coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          cancelSimulationQueue(session, 'cancelación manual'),
        );
        emitRoleState(io, socketEvents.simulationUpdated, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.permissionAnswer, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'coordinator']);
        const input = permissionAnswerSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const before = store.getState(auth).phase;
        const next = store.updateState(auth, (session) =>
          answerPermission(session, input.permission, input.status),
        );
        if (next.phase !== before) emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.remoteStatus, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = remoteStatusSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          updateRemoteStatus(session, input.status),
        );
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.remoteChecklistUpdate, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = remoteChecklistSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          updateRemoteChecklist(session, input.item, input.checked),
        );
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.remoteStopRequest, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, requestRemoteStop);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.recoveryOrder, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'coordinator']);
        const input = recoveryOrderSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          validateRecoveryOrder(session, input.order),
        );
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.recoveryStep, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'coordinator']);
        const input = recoveryStepSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) =>
          completeRecoveryStep(session, input.step),
        );
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.recoveryComplete, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, completeRecovery);
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.emergencyStop, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, emergencyStopSession);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.sessionReset, (payload: unknown, ack?: Ack<SessionCredentials>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const reset = store.reset(auth);
        emitRoleReset(io, reset.session);
        ack?.({ ok: true, data: reset.credentials });
        io.in(room).disconnectSockets(true);
      });
    });

    socket.on(socketEvents.fallbackActivate, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, (session) => ({
          ...session,
          mode: 'simulated',
          technical: { ...session.technical, fallbackActive: true },
          revision: session.revision + 1,
        }));
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.webrtcOffer, (payload: unknown, ack?: Ack<{ relayed: boolean }>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = webrtcDescriptionSchema.parse(payload);
        assertSession(auth, input.sessionId);
        io.to(roleRoom(auth.sessionId, 'attacker')).emit(socketEvents.webrtcOffer, {
          description: input.description,
        });
        return { relayed: true };
      });
    });

    socket.on(socketEvents.webrtcAnswer, (payload: unknown, ack?: Ack<{ relayed: boolean }>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = webrtcDescriptionSchema.parse(payload);
        assertSession(auth, input.sessionId);
        io.to(roleRoom(auth.sessionId, 'victim')).emit(socketEvents.webrtcAnswer, {
          description: input.description,
        });
        return { relayed: true };
      });
    });

    socket.on(socketEvents.webrtcIce, (payload: unknown, ack?: Ack<{ relayed: boolean }>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'attacker']);
        const input = webrtcIceSchema.parse(payload);
        assertSession(auth, input.sessionId);
        const target = auth.role === 'victim' ? 'attacker' : 'victim';
        io.to(roleRoom(auth.sessionId, target)).emit(socketEvents.webrtcIce, {
          candidate: input.candidate,
        });
        return { relayed: true };
      });
    });

    socket.on(socketEvents.webrtcStop, (payload: unknown, ack?: Ack<{ relayed: boolean }>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'attacker']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        const target = auth.role === 'victim' ? 'attacker' : 'victim';
        io.to(roleRoom(auth.sessionId, target)).emit(socketEvents.webrtcStop);
        return { relayed: true };
      });
    });

    socket.on('disconnect', () => {
      try {
        const next = disconnectParticipant(store, auth);
        io.to(roleRoom(auth.sessionId, 'coordinator')).emit(
          socketEvents.presence,
          next.participants,
        );
        emitRoleState(io, socketEvents.sessionState, next);
      } catch {
        // Session may have expired or reset; disconnection then needs no mutation.
      }
    });
  });
}

export function disconnectParticipant(store: SessionStore, auth: AuthContext): DemoSession {
  let next = store.setParticipantStatus(auth, 'disconnected');
  if (auth.role === 'victim' && next.timer.status === 'running') {
    next = store.updateState(auth, (session) => ({
      ...session,
      timer: {
        ...session.timer,
        status: 'paused',
        pausedAt: Date.now(),
        lastTickAt: Date.now(),
      },
    }));
  }
  return next;
}

function handle<T>(socket: AuthenticatedSocket, ack: Ack<T> | undefined, action: () => T | void) {
  try {
    assertRate(socket);
    const data = action();
    if (data !== undefined) ack?.({ ok: true, data });
  } catch (error) {
    ack?.({ ok: false, error: publicError(error) });
  }
}

function duplicate<T>(ack?: Ack<T>) {
  ack?.({ ok: true, duplicate: true });
}

function assertSession(auth: AuthContext, sessionId: string) {
  if (auth.sessionId !== sessionId)
    throw new SessionStoreError(403, 'session_mismatch', 'Evento para otra sesión.');
}

function assertRate(socket: AuthenticatedSocket) {
  const now = Date.now();
  socket.data.eventTimes = socket.data.eventTimes.filter((at) => at > now - 10_000);
  if (socket.data.eventTimes.length >= 30)
    throw new SessionStoreError(429, 'event_rate', 'Demasiados eventos.');
  socket.data.eventTimes.push(now);
}

function roomName(sessionId: string) {
  return `session:${sessionId}`;
}

function roleRoom(sessionId: string, role: ExperienceRole) {
  return `${roomName(sessionId)}:role:${role}`;
}

function stateForRole(session: DemoSession, role: ExperienceRole) {
  return role === 'audience' ? toPublicSession(session) : session;
}

function emitRoleState(io: Server, event: string, session: DemoSession) {
  const roles: ExperienceRole[] = ['victim', 'attacker', 'audience', 'coordinator'];
  for (const role of roles) {
    io.to(roleRoom(session.id, role)).emit(event, stateForRole(session, role));
  }
}

function emitRoleReset(io: Server, session: DemoSession) {
  const roles: ExperienceRole[] = ['victim', 'attacker', 'audience', 'coordinator'];
  for (const role of roles) {
    io.to(roleRoom(session.id, role)).emit(socketEvents.sessionReset, {
      session: stateForRole(session, role),
    });
  }
}

function publicError(error: unknown) {
  if (error instanceof SessionStoreError) return error.code;
  if (error instanceof ZodError) return 'invalid_payload';
  if (error instanceof Error && /^[a-z][a-z0-9_]{2,64}$/.test(error.message)) return error.message;
  if (error instanceof Error) return 'action_rejected';
  return 'unknown_error';
}
