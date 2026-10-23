import type { Server, Socket } from 'socket.io';
import { ZodError } from 'zod';
import {
  attackerActionSchema,
  agentHeartbeatSchema,
  agentCapabilitiesUpdateSchema,
  agentRegisterSchema,
  controlActivateSchema,
  controlGrantSchema,
  controlHeartbeatSchema,
  controlRequestSchema,
  controlRevokeSchema,
  decisionSubmitSchema,
  permissionAnswerSchema,
  phaseTransitionRequestSchema,
  profileSelectSchema,
  recoveryOrderSchema,
  recoveryStepSchema,
  remoteChecklistSchema,
  remoteQualitySchema,
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
import {
  activateFallbackMode,
  advanceAfterCapture,
  advanceAfterControlStop,
  advanceAfterProfile,
  advanceAfterScreenConsent,
  advanceAfterSimulatedControl,
  beginVictimRecovery,
  finishExperience,
  startExperience,
} from '../../shared/orchestration.js';
import { emergencyStopSession, transitionSession } from '../../shared/state-machine.js';
import {
  selectVictimProfile,
  updateRemoteChecklist,
  updateRemoteStatus,
} from '../../shared/session.js';
import {
  activateNativeControl,
  beginRemoteMedia,
  denyNativeControl,
  endRemoteMedia,
  grantNativeControl,
  markRemoteMediaLive,
  markRemoteAgentHeartbeat,
  markRemoteAgentOffline,
  registerRemoteAgent,
  renewNativeControl,
  remoteSessionIsActive,
  requestNativeControl,
  revokeNativeControl,
  updateRemoteQuality,
  updateRemoteAgentCapabilities,
} from '../../shared/remote-state.js';
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
import { AgentRegistry } from '../control/agent-registry.js';
import { ControlLeaseManager } from '../control/lease-manager.js';

interface AuthenticatedSocket extends Socket {
  data: {
    auth: AuthContext;
    eventTimes: Map<string, number[]>;
    currentEvent?: string;
  };
}

type Ack<T = undefined> = (result: SocketAck<T>) => void;

export interface SocketGatewayOptions {
  agentRegistry?: AgentRegistry;
  leaseManager?: ControlLeaseManager;
}

export function registerSocketGateway(
  io: Server,
  store: SessionStore,
  options: SocketGatewayOptions = {},
) {
  const agentRegistry =
    options.agentRegistry ??
    new AgentRegistry({ allowedDeviceId: '', agentKey: '', heartbeatTimeoutMs: 9_000 });
  const leaseManager = options.leaseManager ?? new ControlLeaseManager({ ttlMs: 15_000 });
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
    for (const agent of agentRegistry.expireStale()) {
      leaseManager.revoke(agent.sessionId);
      const next = safelyUpdateRemote(store, agent.sessionId, (session) =>
        markRemoteAgentOffline(session, 'timeout'),
      );
      if (next) emitRoleState(io, socketEvents.sessionState, next);
    }
    for (const lease of leaseManager.expireStale()) {
      const next = safelyUpdateRemote(store, lease.sessionId, (session) =>
        revokeNativeControl(session, 'timeout'),
      );
      if (next) emitRoleState(io, socketEvents.sessionState, next);
    }
  }, 250);
  clock.unref();

  io.use((rawSocket, next) => {
    try {
      const socket = rawSocket as AuthenticatedSocket;
      const sessionId = String(socket.handshake.auth.sessionId ?? '');
      const token = String(socket.handshake.auth.token ?? '');
      socket.data.auth = store.authenticate(sessionId, token);
      socket.data.eventTimes = new Map();
      next();
    } catch (error) {
      next(new Error(publicError(error)));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const auth = socket.data.auth;
    socket.prependAny((event) => {
      socket.data.currentEvent = event;
    });
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

    socket.on(socketEvents.sessionStart, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const next = store.updateState(auth, startExperience);
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.sessionEnd, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        leaseManager.revoke(auth.sessionId);
        const next = store.updateState(auth, finishExperience);
        io.to(roleRoom(auth.sessionId, 'victim')).emit(socketEvents.webrtcStop);
        io.to(roleRoom(auth.sessionId, 'attacker')).emit(socketEvents.webrtcStop);
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.agentRegister, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = agentRegisterSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        if (store.getState(auth).mode !== 'live')
          throw new Error('native_agent_live_mode_required');
        const agent = agentRegistry.register(auth.sessionId, auth.participantId, input);
        const next = store.updateState(auth, (session) => registerRemoteAgent(session, agent));
        emitRoleState(io, socketEvents.agentStatus, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.agentHeartbeat, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = agentHeartbeatSchema.parse(payload);
        assertSession(auth, input.sessionId);
        const agent = agentRegistry.heartbeat(auth.sessionId, auth.participantId, input.agentId);
        const next = store.updateState(auth, (session) =>
          markRemoteAgentHeartbeat(session, agent.lastSeenAt),
        );
        return next;
      });
    });

    socket.on(socketEvents.agentCapabilities, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = agentCapabilitiesUpdateSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const agent = agentRegistry.updateCapabilities(
          auth.sessionId,
          auth.participantId,
          input.agentId,
          input.capabilities,
        );
        const next = store.updateState(auth, (session) =>
          updateRemoteAgentCapabilities(session, agent.capabilities, agent.lastSeenAt),
        );
        emitRoleState(io, socketEvents.agentStatus, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.controlRequest, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = controlRequestSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        agentRegistry.getOnline(auth.sessionId);
        const next = store.updateState(auth, (session) =>
          requestNativeControl(session, auth.participantId),
        );
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.controlGrant, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = controlGrantSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const agent = agentRegistry.getOnline(auth.sessionId);
        if (agent.participantId !== auth.participantId) throw new Error('agent_identity_mismatch');
        const state = store.getState(auth);
        const owner = state.remote.input.requestedByParticipantId;
        if (!owner) throw new Error('control_not_requested');
        const lease = leaseManager.issue(auth.sessionId, owner, agent.participantId);
        const next = store.updateState(auth, (session) =>
          grantNativeControl(session, lease, auth.participantId),
        );
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.controlActivate, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = controlActivateSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        const lease = leaseManager.validate(auth.sessionId, input.leaseId, auth.participantId);
        const next = store.updateState(auth, (session) => {
          const activated = activateNativeControl(session, lease);
          return activated.phase === 'connecting'
            ? transitionSession(activated, 'controlled', { outcome: 'compromised' })
            : activated;
        });
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.controlHeartbeat, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = controlHeartbeatSchema.parse(payload);
        assertSession(auth, input.sessionId);
        const lease = leaseManager.renew(auth.sessionId, input.leaseId, auth.participantId);
        const next = store.updateState(auth, (session) => renewNativeControl(session, lease));
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.controlRevoke, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim', 'attacker', 'coordinator']);
        const input = controlRevokeSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        assertStopReasonMatchesRole(auth.role, input.reason);
        leaseManager.revoke(auth.sessionId);
        const next = store.updateState(auth, (session) => {
          const stopped =
            auth.role === 'victim' && session.remote.input.status === 'requested'
              ? denyNativeControl(session, Date.now(), auth.participantId)
              : revokeNativeControl(session, input.reason, Date.now(), auth.participantId);
          return advanceAfterControlStop(stopped);
        });
        if (next.phase === 'reveal') emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.controlStopped, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.controlReveal, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        leaseManager.revoke(auth.sessionId);
        const next = store.updateState(auth, (session) => {
          const stopped = endRemoteMedia(session, 'attacker', Date.now());
          if (stopped.phase !== 'controlled') throw new Error('reveal_out_of_phase');
          return transitionSession(stopped, 'reveal');
        });
        emitRoleState(io, socketEvents.controlStopped, next);
        emitRoleState(io, socketEvents.phaseChanged, next);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.remoteQuality, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = remoteQualitySchema.parse(payload);
        assertSession(auth, input.sessionId);
        const next = store.updateState(auth, (session) =>
          updateRemoteQuality(session, {
            width: input.width,
            height: input.height,
            fps: input.fps,
            bitrateKbps: input.bitrateKbps,
            packetsLost: input.packetsLost,
            roundTripMs: input.roundTripMs,
          }),
        );
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.phaseRequest, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['coordinator']);
        const input = phaseTransitionRequestSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        throw new Error('manual_phase_control_disabled');
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
          advanceAfterProfile(selectVictimProfile(session, input.profileId)),
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
          advanceAfterSimulatedControl(executeAttackerAction(session, input.action)),
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
          advanceAfterScreenConsent(answerPermission(session, input.permission, input.status)),
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
        leaseManager.revoke(auth.sessionId);
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

    socket.on(socketEvents.recoveryBegin, (payload: unknown, ack?: Ack<DemoSession>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        leaseManager.revoke(auth.sessionId);
        const next = store.updateState(auth, beginVictimRecovery);
        io.to(roleRoom(auth.sessionId, 'attacker')).emit(socketEvents.webrtcStop);
        emitRoleState(io, socketEvents.phaseChanged, next);
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
        store.assertRole(auth, ['coordinator', 'attacker']);
        const input = sessionEventSchema.parse(payload);
        assertSession(auth, input.sessionId);
        if (store.isDuplicate(auth, input.eventId)) return duplicate(ack);
        leaseManager.revoke(auth.sessionId);
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
        leaseManager.clearSession(auth.sessionId);
        agentRegistry.clearSession(auth.sessionId);
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
        leaseManager.revoke(auth.sessionId);
        const next = store.updateState(auth, activateFallbackMode);
        io.to(roleRoom(auth.sessionId, 'victim')).emit(socketEvents.webrtcStop);
        io.to(roleRoom(auth.sessionId, 'attacker')).emit(socketEvents.webrtcStop);
        emitRoleState(io, socketEvents.sessionState, next);
        return next;
      });
    });

    socket.on(socketEvents.webrtcOffer, (payload: unknown, ack?: Ack<{ relayed: boolean }>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['victim']);
        const input = webrtcDescriptionSchema.parse(payload);
        assertSession(auth, input.sessionId);
        const current = store.getState(auth);
        if (current.mode === 'live')
          agentRegistry.assertParticipant(auth.sessionId, auth.participantId);
        const next = store.updateState(auth, (session) =>
          advanceAfterCapture(beginRemoteMedia(session)),
        );
        io.to(roleRoom(auth.sessionId, 'attacker')).emit(socketEvents.webrtcOffer, {
          description: input.description,
        });
        emitRoleState(io, socketEvents.sessionState, next);
        return { relayed: true };
      });
    });

    socket.on(socketEvents.webrtcAnswer, (payload: unknown, ack?: Ack<{ relayed: boolean }>) => {
      handle(socket, ack, () => {
        store.assertRole(auth, ['attacker']);
        const input = webrtcDescriptionSchema.parse(payload);
        assertSession(auth, input.sessionId);
        const next = store.updateState(auth, (session) => markRemoteMediaLive(session));
        io.to(roleRoom(auth.sessionId, 'victim')).emit(socketEvents.webrtcAnswer, {
          description: input.description,
        });
        emitRoleState(io, socketEvents.sessionState, next);
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
        leaseManager.revoke(auth.sessionId);
        const reason = auth.role === 'victim' ? 'victim' : 'attacker';
        const next = store.updateState(auth, (session) => endRemoteMedia(session, reason));
        const target = auth.role === 'victim' ? 'attacker' : 'victim';
        io.to(roleRoom(auth.sessionId, target)).emit(socketEvents.webrtcStop);
        emitRoleState(io, socketEvents.sessionState, next);
        return { relayed: true };
      });
    });

    socket.on('disconnect', () => {
      try {
        let next = disconnectParticipant(store, auth);
        if (auth.role === 'victim') {
          const agentDisconnected = agentRegistry.disconnect(auth.sessionId, auth.participantId);
          const current = store.getState(auth);
          leaseManager.revoke(auth.sessionId);
          if (agentDisconnected) {
            next = store.updateState(auth, (session) => markRemoteAgentOffline(session, 'network'));
          } else if (remoteSessionIsActive(current)) {
            next = store.updateState(auth, (session) => endRemoteMedia(session, 'network'));
          }
          io.to(roleRoom(auth.sessionId, 'attacker')).emit(socketEvents.webrtcStop);
        } else if (auth.role === 'attacker') {
          leaseManager.revokeOwnedBy(auth.sessionId, auth.participantId);
          const current = store.getState(auth);
          if (remoteSessionIsActive(current)) {
            next = store.updateState(auth, (session) => endRemoteMedia(session, 'network'));
            io.to(roleRoom(auth.sessionId, 'victim')).emit(socketEvents.webrtcStop);
          }
        }
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

function assertStopReasonMatchesRole(role: ExperienceRole, reason: string) {
  const allowed: Partial<Record<ExperienceRole, string[]>> = {
    victim: ['victim'],
    attacker: ['attacker'],
    coordinator: ['coordinator', 'emergency'],
  };
  if (!allowed[role]?.includes(reason)) throw new Error('stop_reason_forbidden');
}

function safelyUpdateRemote(
  store: SessionStore,
  sessionId: string,
  updater: (session: DemoSession) => DemoSession,
): DemoSession | undefined {
  try {
    return store.updateSystemState(sessionId, updater);
  } catch {
    return undefined;
  }
}

function assertRate(socket: AuthenticatedSocket) {
  const now = Date.now();
  const event = socket.data.currentEvent ?? 'unknown';
  const recent = (socket.data.eventTimes.get(event) ?? []).filter((at) => at > now - 10_000);
  const limit =
    event === socketEvents.heartbeat ? 40 : event === socketEvents.remoteQuality ? 20 : 15;
  if (recent.length >= limit) throw new SessionStoreError(429, 'event_rate', 'Demasiados eventos.');
  recent.push(now);
  socket.data.eventTimes.set(event, recent);
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
