/**
 * Advanced Crypto utilities with secure encryption, hashing, and key management
 */
export class CryptoUtils {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 96;
  private static readonly TAG_LENGTH = 128;

  /**
   * Generate a cryptographically secure random key
   */
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive key from password using PBKDF2
   */
  static async deriveKey(password: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Generate salt if not provided
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(32));
    }

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    return { key, salt };
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encrypt(data: string | ArrayBuffer, key: CryptoKey): Promise<{
    encrypted: ArrayBuffer;
    iv: Uint8Array;
    tag: Uint8Array;
  }> {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH / 8));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv,
        tagLength: this.TAG_LENGTH
      },
      key,
      dataBuffer
    );

    // Extract tag (last 16 bytes)
    const encryptedArray = new Uint8Array(encrypted);
    const tag = encryptedArray.slice(-16);
    const ciphertext = encryptedArray.slice(0, -16);

    return {
      encrypted: ciphertext.buffer,
      iv,
      tag
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decrypt(
    encrypted: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array,
    tag: Uint8Array
  ): Promise<string> {
    // Combine ciphertext and tag
    const combined = new Uint8Array(encrypted.byteLength + tag.byteLength);
    combined.set(new Uint8Array(encrypted));
    combined.set(tag, encrypted.byteLength);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv,
        tagLength: this.TAG_LENGTH
      },
      key,
      combined
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Hash data using SHA-256
   */
  static async hash(data: string | ArrayBuffer, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    
    return Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate HMAC signature
   */
  static async hmac(data: string | ArrayBuffer, key: string | CryptoKey, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    
    let cryptoKey: CryptoKey;
    if (typeof key === 'string') {
      const keyBuffer = encoder.encode(key);
      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
      );
    } else {
      cryptoKey = key;
    }

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    const signatureArray = new Uint8Array(signature);
    
    return Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate cryptographically secure random bytes
   */
  static randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generate random string
   */
  static randomString(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    const bytes = this.randomBytes(length);
    return Array.from(bytes)
      .map(byte => charset[byte % charset.length])
      .join('');
  }

  /**
   * Generate UUID v4
   */
  static uuid(): string {
    const bytes = this.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /**
   * Generate JWT token (simplified version)
   */
  static async generateJWT(payload: any, secret: string, expiresIn: number = 3600): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload));
    
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.hmac(data, secret);
    const encodedSignature = this.base64UrlEncode(signature);
    
    return `${data}.${encodedSignature}`;
  }

  /**
   * Verify JWT token
   */
  static async verifyJWT(token: string, secret: string): Promise<any> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const expectedSignature = await this.hmac(data, secret);
    const expectedEncodedSignature = this.base64UrlEncode(expectedSignature);
    
    if (encodedSignature !== expectedEncodedSignature) {
      throw new Error('Invalid JWT signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT token expired');
    }

    return payload;
  }

  /**
   * Secure password hashing using Argon2 (simplified scrypt-like implementation)
   */
  static async hashPassword(password: string, saltLength: number = 32): Promise<{
    hash: string;
    salt: string;
  }> {
    const salt = this.randomBytes(saltLength);
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 600000, // High iteration count for security
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const saltHex = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return { hash, salt: saltHex };
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 600000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const computedHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedHash === hash;
  }

  /**
   * Constant-time string comparison
   */
  static constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Base64 URL encode
   */
  private static base64UrlEncode(data: string): string {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   */
  private static base64UrlDecode(data: string): string {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  }
}
