import bcrypt from 'bcryptjs';
import argon2 from 'argon2';
import crypto from 'crypto';

export async function verifyStoredPassword(stored: string | null | undefined, entered: string) {
  const result = { valid: false, method: null as string | null };
  if (!stored) return result;
  const storedVal = stored;

  // Try bcrypt
  try {
    const ok = await bcrypt.compare(entered, storedVal);
    if (ok) {
      result.valid = true;
      result.method = 'bcrypt';
      return result;
    }
  } catch (e) {
    // ignore
  }

  // Try argon2
  try {
    if (storedVal.startsWith('$argon') || storedVal.startsWith('$argon2')) {
      const ok = await argon2.verify(storedVal, entered);
      if (ok) {
        result.valid = true;
        result.method = 'argon2';
        return result;
      }
    }
  } catch (e) {
    // ignore
  }

  // Plaintext match
  if (storedVal === entered) {
    result.valid = true;
    result.method = 'plaintext';
    return result;
  }

  // Hex decode
  try {
    const decodedHex = Buffer.from(storedVal, 'hex').toString('utf8');
    if (decodedHex === entered) {
      result.valid = true;
      result.method = 'hex';
      return result;
    }
  } catch (e) {}

  // Base64 decode
  try {
    const decodedB64 = Buffer.from(storedVal, 'base64').toString('utf8');
    if (decodedB64 === entered) {
      result.valid = true;
      result.method = 'base64';
      return result;
    }
  } catch (e) {}

  // Legacy salt:sha512hex
  const legacy = storedVal.match(/^([0-9a-f]{32}):([0-9a-f]{128})$/i);
  if (legacy) {
    const saltHex = legacy[1];
    const digestHex = legacy[2];
    try {
      const saltBuf = Buffer.from(saltHex, 'hex');
      const pwBuf = Buffer.from(entered, 'utf8');
      const h1 = crypto.createHash('sha512').update(Buffer.concat([saltBuf, pwBuf])).digest('hex');
      const h2 = crypto.createHash('sha512').update(Buffer.concat([pwBuf, saltBuf])).digest('hex');
      const h3 = crypto.createHmac('sha512', saltBuf).update(entered).digest('hex');
      if (h1 === digestHex) { result.valid = true; result.method = 'sha512(salt+pw)'; return result; }
      if (h2 === digestHex) { result.valid = true; result.method = 'sha512(pw+salt)'; return result; }
      if (h3 === digestHex) { result.valid = true; result.method = 'hmac-sha512'; return result; }
    } catch (e) {}
  }

  return result;
}

export default verifyStoredPassword;
