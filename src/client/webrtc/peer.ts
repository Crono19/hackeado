export const desktopCaptureConstraints = {
  video: {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
  },
  audio: false,
  preferCurrentTab: false,
  selfBrowserSurface: 'exclude',
  surfaceSwitching: 'exclude',
} as DisplayMediaStreamOptions;

export function createRemotePeer() {
  return new RTCPeerConnection({ iceServers: [], bundlePolicy: 'max-bundle' });
}

export async function optimizeDesktopSender(sender: RTCRtpSender) {
  const parameters = sender.getParameters();
  parameters.degradationPreference = 'maintain-resolution';
  parameters.encodings = [
    { ...(parameters.encodings[0] ?? {}), maxBitrate: 8_000_000, maxFramerate: 30 },
  ];
  await sender.setParameters(parameters).catch(() => undefined);
}
