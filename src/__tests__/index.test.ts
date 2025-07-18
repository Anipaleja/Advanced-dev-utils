import { StringUtils, CryptoUtils, MathUtils, ArrayUtils } from '../index';

describe('Advanced Utils Package', () => {
  describe('StringUtils', () => {
    test('should calculate string similarity', () => {
      const similarity = StringUtils.similarity('hello', 'hallo');
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1);
    });

    test('should convert to camelCase', () => {
      const result = StringUtils.toCamelCase('hello_world_test');
      expect(result).toBe('helloWorldTest');
    });

    test('should convert to title case', () => {
      const result = StringUtils.toTitleCase('hello world');
      expect(result).toBe('Hello World');
    });
  });

  describe('CryptoUtils', () => {
    test('should generate random string', () => {
      const result = CryptoUtils.randomString(10);
      expect(result).toHaveLength(10);
    });

    test('should generate UUID', () => {
      const uuid = CryptoUtils.uuid();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should hash data', async () => {
      const hash = await CryptoUtils.hash('test data');
      expect(hash).toHaveLength(64); // SHA-256 produces 64 character hex string
    });

    test('should encrypt and decrypt data', async () => {
      const key = await CryptoUtils.generateKey();
      const originalData = 'Hello, World!';
      
      const encrypted = await CryptoUtils.encrypt(originalData, key);
      const decrypted = await CryptoUtils.decrypt(encrypted.encrypted, key, encrypted.iv, encrypted.tag);
      
      expect(decrypted).toBe(originalData);
    });
  });

  describe('MathUtils', () => {
    test('should calculate average', () => {
      const result = MathUtils.average([1, 2, 3, 4, 5]);
      expect(result).toBe(3);
    });

    test('should calculate median', () => {
      const result = MathUtils.median([1, 2, 3, 4, 5]);
      expect(result).toBe(3);
    });

    test('should calculate factorial', () => {
      expect(MathUtils.factorial(5)).toBe(120);
      expect(MathUtils.factorial(0)).toBe(1);
    });

    test('should check if number is prime', () => {
      expect(MathUtils.isPrime(2)).toBe(true);
      expect(MathUtils.isPrime(3)).toBe(true);
      expect(MathUtils.isPrime(4)).toBe(false);
      expect(MathUtils.isPrime(17)).toBe(true);
    });
  });

  describe('ArrayUtils', () => {
    test('should chunk array', () => {
      const result = ArrayUtils.chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    test('should get unique values', () => {
      const result = ArrayUtils.unique([1, 2, 2, 3, 3, 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('should flatten array', () => {
      const result = ArrayUtils.flatten([[1, 2], [3, 4], [5]]);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = ArrayUtils.shuffle([...original]);
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });
  });
});
