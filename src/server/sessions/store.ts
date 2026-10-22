import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import type {
  DemoSession,
  ExperienceRole,
  JoinRequestView,
  Participant,
  SessionCredentials,
  SessionMode,
} from '../../shared/types.js';
import { createInitialSession } from '../../shared/session.js';
import { tickTimer } from '../../shared/timer.js';
import { tickSimulation } from '../../shared/simulation.js';

const JOIN_TTL_MS = 5 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 6;
const MAX_EVENT_IDS = 300;

interface TokenRecord {
  participantId: string;
  role: ExperienceRole;
  expiresAt: number;
}

interface JoinRequestRecord extends JoinRequestView {
  secretHash: string;
  participantId?: string;
  token?: string;
}

interface ManagedSession {
  state: DemoSession;
  tokens: Map<string, TokenRecord>;
  joins: Map<string, JoinRequestRecord>;
  processedEvents: Map<string, number>;
}

export interface AuthContext extends TokenRecord {
  sessionId: string;
}

export interface CreatedSession {
  session: DemoSession;
  credentials: SessionCredentials;
}

export interface JoinTicket {
  request: JoinRequestView;
  requestKey: string;
}

export interface TimerTick {
  session: DemoSession;
  milestones: number[];
}

export interface SimulationTick {
  session: DemoSession;
}

export class SessionStoreError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'SessionStoreError';
  }
}

export class SessionStore {
  private readonly sessions = new Map<string, ManagedSession>();
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly ttlMs = 30 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  createSession(input: { scenarioId: string; mode: SessionMode }): CreatedSession {
    this.cleanup();
    const now = this.now();
    const id = randomUUID();
    const pairingCode = this.createUniqueCode();
    const participant = this.createParticipant('coordinator', now, 'connected');
    const state = {
      ...createInitialSession({
        id,
        pairingCode,
        scenarioId: input.scenarioId,
        mode: input.mode,
        now,
        ttlMs: this.ttlMs,
      }),
      participants: [participant],
    };
    const managed: ManagedSession = {
      state,
      tokens: new Map(),
      joins: new Map(),
      processedEvents: new Map(),
    };
    const token = this.issueToken(managed, participant);
    this.sessions.set(id, managed);
    return { session: state, credentials: this.credentials(state, 'coordinator', token) };
  }

  requestJoin(
    code: string,
    role: Exclude<ExperienceRole, 'coordinator'>,
    fingerprint: string,
  ): JoinTicket {
    this.assertAttemptAllowed(`${fingerprint}:${code}`);
    const managed = this.findByCode(code);
    this.assertActive(managed);
    const now = this.now();
    const requestKey = randomBytes(24).toString('base64url');
    const request: JoinRequestRecord = {
      id: randomUUID(),
      sessionId: managed.state.id,
      role,
      status: 'waiting',
      createdAt: now,
      expiresAt: Math.min(now + JOIN_TTL_MS, managed.state.expiresAt),
      secretHash: hash(requestKey),
    };
    managed.joins.set(request.id, request);
    this.touch(managed);
    return { request: this.joinView(request), requestKey };
  }

  getJoinRequest(
    requestId: string,
    requestKey: string,
  ): { request: JoinRequestView; token?: string } {
    const { managed, request } = this.findJoin(requestId);
    if (request.secretHash !== hash(requestKey))
      throw new SessionStoreError(403, 'invalid_join_key', 'Solicitud no autorizada.');
    this.refreshJoinStatus(request, managed);
    const result = { request: this.joinView(request), token: request.token };
    request.token = undefined;
    return result;
  }

  listJoinRequests(auth: AuthContext): JoinRequestView[] {
    this.assertRole(auth, ['coordinator']);
    const managed = this.getManaged(auth.sessionId);
    for (const request of managed.joins.values()) this.refreshJoinStatus(request, managed);
    return [...managed.joins.values()].map((request) => this.joinView(request));
  }

  decideJoin(auth: AuthContext, requestId: string, approved: boolean): JoinRequestView {
    this.assertRole(auth, ['coordinator']);
    const managed = this.getManaged(auth.sessionId);
    const request = managed.joins.get(requestId);
    if (!request) throw new SessionStoreError(404, 'join_not_found', 'Solicitud no encontrada.');
    this.refreshJoinStatus(request, managed);
    if (request.status !== 'waiting')
      throw new SessionStoreError(409, 'join_resolved', 'Solicitud ya resuelta.');
    if (!approved) {
      request.status = 'rejected';
      return this.joinView(request);
    }
    const participant = this.createParticipant(request.role, this.now(), 'approved');
    managed.state = {
      ...managed.state,
      participants: [...managed.state.participants, participant],
      revision: managed.state.revision + 1,
    };
    request.status = 'approved';
    request.expiresAt = managed.state.expiresAt;
    request.participantId = participant.id;
    request.token = this.issueToken(managed, participant);
    this.touch(managed);
    return this.joinView(request);
  }

  authenticate(sessionId: string, token: string, touch = true): AuthContext {
    const managed = this.getManaged(sessionId);
    this.assertActive(managed);
    const record = managed.tokens.get(hash(token));
    if (!record) throw new SessionStoreError(401, 'invalid_token', 'Token inválido o revocado.');
    if (record.expiresAt <= this.now()) {
      managed.tokens.delete(hash(token));
      throw new SessionStoreError(401, 'token_expired', 'Token expirado.');
    }
    if (touch) this.touch(managed);
    return { sessionId, ...record };
  }

  getState(auth: AuthContext): DemoSession {
    return structuredClone(this.getManaged(auth.sessionId).state);
  }

  updateState(auth: AuthContext, updater: (session: DemoSession) => DemoSession): DemoSession {
    const managed = this.getManaged(auth.sessionId);
    managed.state = updater(structuredClone(managed.state));
    this.touch(managed);
    return structuredClone(managed.state);
  }

  setParticipantStatus(auth: AuthContext, status: Participant['status']): DemoSession {
    return this.updateState(auth, (state) => ({
      ...state,
      participants: state.participants.map((participant) =>
        participant.id === auth.participantId
          ? { ...participant, status, lastSeenAt: this.now() }
          : participant,
      ),
    }));
  }

  markHeartbeat(auth: AuthContext): DemoSession {
    return this.setParticipantStatus(auth, 'connected');
  }

  isDuplicate(auth: AuthContext, eventId: string): boolean {
    const managed = this.getManaged(auth.sessionId);
    if (managed.processedEvents.has(eventId)) return true;
    managed.processedEvents.set(eventId, this.now());
    while (managed.processedEvents.size > MAX_EVENT_IDS) {
      const oldest = managed.processedEvents.keys().next().value as string | undefined;
      if (!oldest) break;
      managed.processedEvents.delete(oldest);
    }
    return false;
  }

  tickTimers(): TimerTick[] {
    const now = this.now();
    const ticks: TimerTick[] = [];
    for (const managed of this.sessions.values()) {
      const result = tickTimer(managed.state, now);
      if (result.session !== managed.state) {
        managed.state = result.session;
        ticks.push({ session: structuredClone(result.session), milestones: result.milestones });
      }
    }
    return ticks;
  }

  tickSimulations(): SimulationTick[] {
    const now = this.now();
    const ticks: SimulationTick[] = [];
    for (const managed of this.sessions.values()) {
      const result = tickSimulation(managed.state, now);
      if (result !== managed.state) {
        managed.state = result;
        ticks.push({ session: structuredClone(result) });
      }
    }
    return ticks;
  }

  reset(auth: AuthContext): CreatedSession {
    this.assertRole(auth, ['coordinator']);
    const managed = this.getManaged(auth.sessionId);
    if (!['idle', 'ended'].includes(managed.state.remote.status)) {
      throw new SessionStoreError(
        409,
        'remote_session_active',
        'Termina y confirma el acceso remoto antes de reiniciar.',
      );
    }
    const now = this.now();
    const participant = this.createParticipant('coordinator', now, 'connected');
    managed.state = {
      ...createInitialSession({
        id: managed.state.id,
        pairingCode: this.createUniqueCode(managed.state.id),
        scenarioId: managed.state.scenarioId,
        mode: managed.state.mode,
        now,
        ttlMs: this.ttlMs,
      }),
      participants: [participant],
    };
    managed.tokens.clear();
    managed.joins.clear();
    managed.processedEvents.clear();
    const token = this.issueToken(managed, participant);
    return {
      session: structuredClone(managed.state),
      credentials: this.credentials(managed.state, 'coordinator', token),
    };
  }

  assertRole(auth: AuthContext, allowed: readonly ExperienceRole[]) {
    if (!allowed.includes(auth.role))
      throw new SessionStoreError(403, 'role_forbidden', `Rol ${auth.role} no autorizado.`);
  }

  cleanup(): string[] {
    const now = this.now();
    const removed: string[] = [];
    for (const [id, managed] of this.sessions) {
      if (managed.state.expiresAt <= now) {
        this.sessions.delete(id);
        removed.push(id);
      }
    }
    for (const [key, attempts] of this.attempts) {
      const recent = attempts.filter((at) => at > now - ATTEMPT_WINDOW_MS);
      if (recent.length) this.attempts.set(key, recent);
      else this.attempts.delete(key);
    }
    return removed;
  }

  private getManaged(sessionId: string): ManagedSession {
    const managed = this.sessions.get(sessionId);
    if (!managed)
      throw new SessionStoreError(404, 'session_not_found', 'Sesión inexistente o expirada.');
    return managed;
  }

  private findByCode(code: string): ManagedSession {
    const managed = [...this.sessions.values()].find((entry) => entry.state.pairingCode === code);
    if (!managed) throw new SessionStoreError(404, 'invalid_code', 'Código inválido o expirado.');
    return managed;
  }

  private findJoin(requestId: string): { managed: ManagedSession; request: JoinRequestRecord } {
    for (const managed of this.sessions.values()) {
      const request = managed.joins.get(requestId);
      if (request) return { managed, request };
    }
    throw new SessionStoreError(404, 'join_not_found', 'Solicitud no encontrada.');
  }

  private assertActive(managed: ManagedSession) {
    if (managed.state.expiresAt <= this.now()) {
      this.sessions.delete(managed.state.id);
      throw new SessionStoreError(410, 'session_expired', 'Sesión expirada.');
    }
  }

  private touch(managed: ManagedSession) {
    const now = this.now();
    managed.state = { ...managed.state, updatedAt: now, expiresAt: now + this.ttlMs };
  }

  private assertAttemptAllowed(key: string) {
    const now = this.now();
    const attempts = (this.attempts.get(key) ?? []).filter((at) => at > now - ATTEMPT_WINDOW_MS);
    if (attempts.length >= MAX_ATTEMPTS)
      throw new SessionStoreError(
        429,
        'too_many_attempts',
        'Demasiados intentos. Espera un minuto.',
      );
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  private createUniqueCode(exceptSessionId?: string): string {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      const used = [...this.sessions.values()].some(
        (entry) => entry.state.id !== exceptSessionId && entry.state.pairingCode === code,
      );
      if (!used) return code;
    }
    throw new SessionStoreError(503, 'code_pool_busy', 'No fue posible generar código temporal.');
  }

  private createParticipant(
    role: ExperienceRole,
    now: number,
    status: Participant['status'],
  ): Participant {
    return { id: randomUUID(), role, status, joinedAt: now, lastSeenAt: now };
  }

  private issueToken(managed: ManagedSession, participant: Participant): string {
    const token = randomBytes(32).toString('base64url');
    managed.tokens.set(hash(token), {
      participantId: participant.id,
      role: participant.role,
      expiresAt: managed.state.expiresAt,
    });
    return token;
  }

  private credentials(state: DemoSession, role: ExperienceRole, token: string): SessionCredentials {
    return {
      sessionId: state.id,
      pairingCode: state.pairingCode,
      role,
      token,
      expiresAt: state.expiresAt,
    };
  }

  private joinView(request: JoinRequestRecord): JoinRequestView {
    const { id, sessionId, role, status, createdAt, expiresAt } = request;
    return { id, sessionId, role, status, createdAt, expiresAt };
  }

  private refreshJoinStatus(request: JoinRequestRecord, managed: ManagedSession) {
    if (
      request.status === 'waiting' &&
      (request.expiresAt <= this.now() || managed.state.expiresAt <= this.now())
    ) {
      request.status = 'expired';
    }
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
