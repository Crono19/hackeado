import type { ExperienceRole, SessionCredentials } from '../shared/types';

const key = (role: ExperienceRole) => `hackeado:session:${role}`;

export function loadCredentials(role: ExperienceRole): SessionCredentials | null {
  try {
    const raw = localStorage.getItem(key(role));
    if (!raw) return null;
    const credentials = JSON.parse(raw) as SessionCredentials;
    if (credentials.expiresAt <= Date.now()) {
      localStorage.removeItem(key(role));
      return null;
    }
    return credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: SessionCredentials) {
  localStorage.setItem(key(credentials.role), JSON.stringify(credentials));
}

export function clearCredentials(role: ExperienceRole) {
  localStorage.removeItem(key(role));
}
