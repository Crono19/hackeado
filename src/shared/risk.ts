import type { DemoSession, PermissionKey, RiskState } from './types.js';

const permissionRisk: Record<
  PermissionKey,
  Omit<RiskState, 'recoverability'> & { recovery: number }
> = {
  screen: { privacy: 24, deviceControl: 6, accounts: 7, files: 5, recovery: 5 },
  keyboard: { privacy: 8, deviceControl: 44, accounts: 18, files: 16, recovery: 18 },
  files: { privacy: 18, deviceControl: 4, accounts: 7, files: 38, recovery: 12 },
  clipboard: { privacy: 12, deviceControl: 3, accounts: 24, files: 4, recovery: 7 },
  microphone: { privacy: 18, deviceControl: 2, accounts: 2, files: 0, recovery: 3 },
  camera: { privacy: 20, deviceControl: 2, accounts: 2, files: 0, recovery: 3 },
  unattended: { privacy: 8, deviceControl: 32, accounts: 20, files: 15, recovery: 35 },
};

export function calculateRisk(session: DemoSession): RiskState {
  const risk: RiskState = {
    privacy: 0,
    deviceControl: 0,
    accounts: 0,
    files: 0,
    recoverability: 100,
  };
  for (const permission of session.permissions) {
    if (permission.status !== 'granted') continue;
    const weight = permissionRisk[permission.key];
    risk.privacy += weight.privacy;
    risk.deviceControl += weight.deviceControl;
    risk.accounts += weight.accounts;
    risk.files += weight.files;
    risk.recoverability -= weight.recovery;
  }
  for (const item of session.simulation.queue) {
    if (item.status !== 'completed') continue;
    const weight = simulationRisk[item.actionId];
    risk.privacy += weight.privacy;
    risk.deviceControl += weight.deviceControl;
    risk.accounts += weight.accounts;
    risk.files += weight.files;
    risk.recoverability -= weight.recovery;
  }
  return {
    privacy: clamp(risk.privacy),
    deviceControl: clamp(risk.deviceControl),
    accounts: clamp(risk.accounts),
    files: clamp(risk.files),
    recoverability: clamp(risk.recoverability),
  };
}

const simulationRisk: Record<
  DemoSession['simulation']['queue'][number]['actionId'],
  Omit<RiskState, 'recoverability'> & { recovery: number }
> = {
  move_cursor: { privacy: 0, deviceControl: 8, accounts: 0, files: 0, recovery: 2 },
  open_folder: { privacy: 5, deviceControl: 4, accounts: 0, files: 12, recovery: 3 },
  open_budget: { privacy: 10, deviceControl: 2, accounts: 5, files: 8, recovery: 3 },
  type_message: { privacy: 0, deviceControl: 12, accounts: 0, files: 3, recovery: 4 },
  copy_clipboard: { privacy: 9, deviceControl: 0, accounts: 12, files: 0, recovery: 4 },
  copy_files: { privacy: 12, deviceControl: 2, accounts: 0, files: 24, recovery: 9 },
  expose_microphone: { privacy: 13, deviceControl: 0, accounts: 0, files: 0, recovery: 2 },
  expose_camera: { privacy: 15, deviceControl: 0, accounts: 0, files: 0, recovery: 2 },
  foreign_login: { privacy: 4, deviceControl: 0, accounts: 22, files: 0, recovery: 8 },
};

export function exposureIndex(risk: RiskState): number {
  return Math.round(
    (risk.privacy + risk.deviceControl + risk.accounts + risk.files + (100 - risk.recoverability)) /
      5,
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
