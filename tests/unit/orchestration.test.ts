import { describe, expect, it } from 'vitest';
import { executeAttackerAction } from '../../src/shared/attacker-actions';
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
} from '../../src/shared/orchestration';
import { answerPermission } from '../../src/shared/permissions';
import {
  beginRemoteMedia,
  registerRemoteAgent,
  revokeNativeControl,
} from '../../src/shared/remote-state';
import {
  createInitialSession,
  selectVictimProfile,
  updatePermission,
} from '../../src/shared/session';
import { openSupportCase, submitDecision } from '../../src/shared/story';

function reachPermissions() {
  let session = startExperience(createInitialSession({ now: 1_000 }), 1_100);
  session = advanceAfterProfile(selectVictimProfile(session, 'alex', 1_200), 1_300);
  session = openSupportCase(session, 1_400);
  return submitDecision(session, 'solve', 1_500);
}

function reachControlled() {
  let session = reachPermissions();
  session = executeAttackerAction(session, 'request_screen', 1_600);
  session = advanceAfterScreenConsent(answerPermission(session, 'screen', 'granted', 1_700), 1_700);
  expect(session.phase).toBe('permissions');
  session = executeAttackerAction(session, 'request_keyboard', 1_800);
  session = advanceAfterScreenConsent(
    answerPermission(session, 'keyboard', 'granted', 1_900),
    1_900,
  );
  expect(session.phase).toBe('connecting');
  session = executeAttackerAction(session, 'mark_remote_ready', 2_000);
  session = executeAttackerAction(session, 'confirm_screen', 2_100);
  return advanceAfterSimulatedControl(
    executeAttackerAction(session, 'confirm_control', 2_200),
    2_200,
  );
}

describe('automatic experience orchestration', () => {
  it('moves from start to compromised control without manual scene commands', () => {
    const session = reachControlled();
    expect(session.phase).toBe('controlled');
    expect(session.outcome).toBe('compromised');
    expect(session.remote.status).toBe('control');
  });

  it('moves live mode to connection only when desktop capture actually starts', () => {
    let session = { ...reachPermissions(), mode: 'live' as const };
    session = updatePermission(session, 'screen', 'granted', 1_600);
    expect(advanceAfterScreenConsent(session, 1_600).phase).toBe('permissions');
    session = registerRemoteAgent(
      session,
      {
        sessionId: session.id,
        agentId: 'agent-test',
        deviceId: 'windows-vm',
        version: '0.5.0',
        participantId: 'victim-test',
        registeredAt: 1_600,
        lastSeenAt: 1_600,
        capabilities: {
          nativeBridge: true,
          desktopCapture: true,
          pointer: true,
          keyboard: true,
          wheel: true,
          emergencyHotkey: true,
          displayCount: 1,
          screenWidth: 1920,
          screenHeight: 1080,
          dpiScale: 1,
        },
      },
      1_600,
    );
    session = advanceAfterCapture(beginRemoteMedia(session, 1_700), 1_700);
    expect(session.phase).toBe('connecting');
    expect(session.remote.media.status).toBe('negotiating');
  });

  it('revokes input before enabling victim recovery', () => {
    const controlled = reachControlled();
    const revealed = advanceAfterControlStop(
      revokeNativeControl(controlled, 'attacker', 2_300),
      2_300,
    );
    const recovering = beginVictimRecovery(revealed, 2_400);
    expect(recovering.phase).toBe('recovery');
    expect(recovering.remote.status).toBe('ended');
    expect(recovering.remote.input.status).toBe('revoked');
  });

  it('switches failures to local fallback with remote access ended', () => {
    const fallback = activateFallbackMode(reachControlled(), 2_300);
    expect(fallback.phase).toBe('reveal');
    expect(fallback.mode).toBe('simulated');
    expect(fallback.technical.fallbackActive).toBe(true);
    expect(fallback.remote.status).toBe('ended');
  });

  it('finishes any active round in a safe, complete result', () => {
    const result = finishExperience(reachControlled(), 2_300);
    expect(result.phase).toBe('result');
    expect(result.status).toBe('complete');
    expect(result.remote.input.status).toBe('revoked');
    expect(result.timer.status).toBe('paused');
    expect(result.summary).toBeDefined();
  });
});
