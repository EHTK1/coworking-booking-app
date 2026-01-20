// lib/password.ts - Password hashing utilities

import crypto from 'crypto';

const SALT_LENGTH = 16;
const HASH_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');

    crypto.pbkdf2(
      password,
      salt,
      HASH_ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      }
    );
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');

    crypto.pbkdf2(
      password,
      salt,
      HASH_ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      }
    );
  });
}
