import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash.
 * Supports both bcrypt hashes (start with $2) and legacy SHA-256 hashes (uuid:hex).
 * If legacy hash matches, returns { valid: true, needsRehash: true } so callers can upgrade.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Bcrypt hashes start with $2a$ or $2b$
  if (storedHash.startsWith('$2')) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsRehash: false };
  }

  // Legacy SHA-256 format: "salt:hex"
  const [salt, hex] = storedHash.split(':');
  if (!salt || !hex) return { valid: false, needsRehash: false };

  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const computedHex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const valid = computedHex === hex;
  return { valid, needsRehash: valid }; // If valid, flag for rehash
}
