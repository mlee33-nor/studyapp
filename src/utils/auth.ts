// Secure client-side auth using Web Crypto API (PBKDF2 with random salt)
// Credentials stored in localStorage — never in plain text.

const AUTH_KEY = 'studyBuddyAuth';
const PBKDF2_ITERATIONS = 100_000;

interface StoredCredentials {
  email: string;
  salt: string;       // hex-encoded random salt
  hash: string;       // hex-encoded PBKDF2 hash
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return bufToHex(bits);
}

export async function createAccount(email: string, password: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  // Prevent overwriting an existing account
  const existing = localStorage.getItem(AUTH_KEY);
  if (existing) {
    try {
      const creds: StoredCredentials = JSON.parse(existing);
      if (creds.email === normalizedEmail) {
        throw new Error('EMAIL_IN_USE');
      }
      // Different email — still an existing account on this device
      throw new Error('ACCOUNT_EXISTS');
    } catch (e) {
      if (e instanceof Error && (e.message === 'EMAIL_IN_USE' || e.message === 'ACCOUNT_EXISTS')) {
        throw e;
      }
      // JSON parse error — corrupted data, allow overwrite
    }
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt.buffer);
  const creds: StoredCredentials = { email: normalizedEmail, salt: bufToHex(salt.buffer), hash };
  localStorage.setItem(AUTH_KEY, JSON.stringify(creds));
}

export async function verifyLogin(email: string, password: string): Promise<boolean> {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return false;
  try {
    const creds: StoredCredentials = JSON.parse(raw);
    if (creds.email !== email.toLowerCase().trim()) return false;
    const hash = await deriveKey(password, hexToBuf(creds.salt));
    return hash === creds.hash;
  } catch {
    return false;
  }
}

export function hasAccount(): boolean {
  return localStorage.getItem(AUTH_KEY) !== null;
}

export function getStoredEmail(): string | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as StoredCredentials).email;
  } catch {
    return null;
  }
}

export function logout(): void {
  // Only clears the login session flag, not the account itself
  localStorage.removeItem('studyBuddyLoggedIn');
}

export function setLoggedIn(): void {
  localStorage.setItem('studyBuddyLoggedIn', 'true');
}

export function isLoggedIn(): boolean {
  return localStorage.getItem('studyBuddyLoggedIn') === 'true';
}
