import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;

@Injectable()
export class AuthPasswordsService {
  hashPassword(password: string) {
    const salt = randomBytes(16);
    const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH);

    return [
      PASSWORD_HASH_ALGORITHM,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  verifyPassword(password: string, passwordHash: string) {
    const [algorithm, encodedSalt, encodedHash] = passwordHash.split('$');

    if (
      algorithm !== PASSWORD_HASH_ALGORITHM ||
      !encodedSalt ||
      !encodedHash
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const salt = Buffer.from(encodedSalt, 'base64url');
    const expectedHash = Buffer.from(encodedHash, 'base64url');
    const providedHash = scryptSync(password, salt, expectedHash.length);

    return (
      providedHash.length === expectedHash.length &&
      timingSafeEqual(providedHash, expectedHash)
    );
  }
}
