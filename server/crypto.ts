import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

const SECRET_KEY = process.env.ENCRYPTION_SECRET;
if (!SECRET_KEY || SECRET_KEY.length < 32) throw new Error('ENCRYPTION_SECRET must be configured with at least 32 random characters');

function getDerivedKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt sensitive string data (e.g. access tokens, sensitive metadata) using AES-256-GCM.
 * Output format: base64(salt:iv:tag:ciphertext)
 */
export function encryptData(text: string): string {
  if (!text) return '';
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getDerivedKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex')
  ].join(':');
}

/**
 * Decrypt AES-256-GCM encrypted string data.
 */
export function decryptData(encryptedString: string): string {
  if (!encryptedString) return '';
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 4) {
      // Fallback if plain text or older format
      return encryptedString;
    }
    const [saltHex, ivHex, tagHex, cipherHex] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(cipherHex, 'hex');

    const key = getDerivedKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed, returning sanitized fallback:', error);
    return '';
  }
}
