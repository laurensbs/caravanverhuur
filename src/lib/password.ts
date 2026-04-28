import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12;

const READABLE_WORDS = ['Brava', 'Pals', 'Begur', 'Roses', 'Calella', 'Estartit', 'Lloret', 'Tossa', 'Aro', 'Palamos', 'Cadaques', 'Empuria', 'Costa', 'Marina', 'Platja', 'Sol', 'Mar', 'Sand', 'Wave', 'Sunny'];

/**
 * Leesbaar tijdelijk wachtwoord, format Woord-XXXX-Woord (Brava-7421-Pals).
 * ~16 bits entropie — voldoende met bcrypt + rate-limit + verplichte change bij eerste login.
 */
export function generateTemporaryPassword(): string {
  const w1 = READABLE_WORDS[randomBytes(1)[0] % READABLE_WORDS.length];
  const w2 = READABLE_WORDS[randomBytes(1)[0] % READABLE_WORDS.length];
  const num = (randomBytes(2).readUInt16BE(0) % 9000 + 1000).toString();
  return `${w1}-${num}-${w2}`;
}

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
