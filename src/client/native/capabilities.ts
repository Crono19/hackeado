import type { AgentCapabilities } from '../../shared/types';

export const browserOnlyCapabilities: AgentCapabilities = {
  nativeBridge: false,
  desktopCapture: true,
  pointer: false,
  keyboard: false,
  wheel: false,
  emergencyHotkey: false,
  displayCount: 1,
  screenWidth: Math.max(640, window.screen.width),
  screenHeight: Math.max(480, window.screen.height),
  dpiScale: Math.max(0.5, window.devicePixelRatio || 1),
};
