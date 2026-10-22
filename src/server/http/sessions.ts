import { Router, type Request } from 'express';
import { approveJoinSchema, createSessionSchema, joinSessionSchema } from '../../shared/schemas.js';
import { defaultScenario, getScenario } from '../../shared/scenario.js';
import { toPublicSession } from '../../shared/public-state.js';
import type { SessionStore } from '../sessions/store.js';
import { SessionStoreError } from '../sessions/store.js';

export function createSessionRouter(store: SessionStore) {
  const router = Router();

  router.post('/sessions', (request, response) => {
    const input = createSessionSchema.parse(request.body);
    response.status(201).json(store.createSession(input));
  });

  const requestJoin = (request: Request, response: import('express').Response) => {
    const input = joinSessionSchema.parse(request.body);
    const fingerprint = request.ip ?? request.socket.remoteAddress ?? 'local';
    const ticket = store.requestJoin(input.code, input.role, fingerprint);
    if (request.params.sessionId && ticket.request.sessionId !== request.params.sessionId) {
      throw new SessionStoreError(404, 'invalid_code', 'Código no corresponde a la sesión.');
    }
    response.status(202).json(ticket);
  };

  router.post('/sessions/join', requestJoin);
  router.post('/sessions/:sessionId/join', requestJoin);

  router.get('/join-requests/:requestId', (request, response) => {
    const key = typeof request.query.key === 'string' ? request.query.key : '';
    response.json(store.getJoinRequest(request.params.requestId, key));
  });

  router.get('/sessions/:sessionId/join-requests', (request, response) => {
    const auth = authenticateRequest(store, request);
    response.json({ requests: store.listJoinRequests(auth) });
  });

  router.post('/sessions/:sessionId/join-requests/:requestId/decision', (request, response) => {
    const auth = authenticateRequest(store, request);
    const input = approveJoinSchema.parse(request.body);
    response.json({ request: store.decideJoin(auth, request.params.requestId, input.approved) });
  });

  router.get('/sessions/:sessionId/state', (request, response) => {
    const auth = authenticateRequest(store, request);
    const session = store.getState(auth);
    response.json({
      session: auth.role === 'audience' ? toPublicSession(session) : session,
      role: auth.role,
    });
  });

  router.post('/sessions/:sessionId/reset', (request, response) => {
    const auth = authenticateRequest(store, request);
    response.json(store.reset(auth));
  });

  router.get('/scenarios', (_request, response) => {
    response.json({
      scenarios: [
        {
          id: defaultScenario.id,
          name: defaultScenario.name,
          description: defaultScenario.description,
        },
      ],
    });
  });

  router.get('/scenarios/:scenarioId', (request, response) => {
    const scenario = getScenario(request.params.scenarioId);
    if (!scenario) throw new SessionStoreError(404, 'scenario_not_found', 'Escenario inexistente.');
    response.json({ scenario });
  });

  return router;
}

function authenticateRequest(store: SessionStore, request: Request) {
  const header = request.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new SessionStoreError(401, 'missing_token', 'Token requerido.');
  return store.authenticate(String(request.params.sessionId), token);
}
