/**
 * Password-based encryption for bundled leads.
 *
 * A static site cannot keep a secret in its own JavaScript, so a gate that
 * merely compares a password string is decoration — anyone can read the data
 * straight out of the bundle without ever touching the check. Encrypting the
 * payload instead makes the password load-bearing: the bundle ships ciphertext,
 * and without the password there is nothing to read.
 *
 * AES-GCM with a PBKDF2-derived key. Uses the Web Crypto API, which is
 * available both in browsers and in Node, so one implementation serves the
 * build script and the app.
 *
 * This protects the data at rest in the bundle. It is not a substitute for
 * server-side access control on genuinely sensitive material.
 */

const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedPayload {
  /** Format marker, so a future change can be detected rather than misread. */
  scheme: 'aes-gcm-pbkdf2-sha256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptJson(plaintext: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext),
  );

  return {
    scheme: 'aes-gcm-pbkdf2-sha256',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

/**
 * Decrypt a payload. Throws on a wrong password — AES-GCM's authentication tag
 * fails rather than yielding garbage, so there is no separate check to write.
 */
export async function decryptJson(
  payload: EncryptedPayload,
  password: string,
): Promise<string> {
  const key = await deriveKey(
    password,
    fromBase64(payload.salt),
    payload.iterations || PBKDF2_ITERATIONS,
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) as BufferSource },
    key,
    fromBase64(payload.ciphertext) as BufferSource,
  );

  return new TextDecoder().decode(plaintext);
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<EncryptedPayload>;
  return (
    candidate.scheme === 'aes-gcm-pbkdf2-sha256' &&
    typeof candidate.salt === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string'
  );
}
