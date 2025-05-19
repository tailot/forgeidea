import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm' as crypto.CipherGCMTypes;
const IV_LENGTH = 12;

export interface EncryptedPayload {
  iv: string;
  encryptedData: string;
  authTag: string;
}

export class FlowCryptographer {
  private key: Buffer;

  constructor(secretKeyBuffer: Buffer) {
    if (secretKeyBuffer.length !== 32) {
      throw new Error('Secret key must be 32 bytes for AES-256.');
    }
    this.key = secretKeyBuffer;
  }

  encrypt(plaintext: string): EncryptedPayload {
    try {
      const iv: Buffer = crypto.randomBytes(IV_LENGTH);
      const cipher: crypto.CipherGCM = crypto.createCipheriv(ALGORITHM, this.key, iv);

      let encrypted: string = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag: Buffer = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      console.error('FlowCryptographer - Error during encryption:', error);
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  decrypt(payload: EncryptedPayload): string {
    try {
      const iv: Buffer = Buffer.from(payload.iv, 'hex');
      const encryptedData: Buffer = Buffer.from(payload.encryptedData, 'hex');
      const authTag: Buffer = Buffer.from(payload.authTag, 'hex');

      const decipher: crypto.DecipherGCM = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted: string = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('FlowCryptographer - Error during decryption:', error);
      throw new Error(`Decryption failed (possible tampering, wrong key, or corrupted payload): ${(error as Error).message}`);
    }
  }
}

/*
async function testCryptography() {
  const basekey = process.env.KEYCIPHER || crypto.randomBytes(32).toString('base64');
  //OR
  //const basekey = crypto.randomBytes(32);

  const exampleSecretKey =Buffer.from(basekey, 'base64');
  
  const cryptographer = new FlowCryptographer(exampleSecretKey);

  const originalMessage = "This is a test message for the FlowCryptographer library!";
  console.log("Original Message:", originalMessage);

  try {
    // Encryption
    const encryptedPayload = cryptographer.encrypt(originalMessage);
    console.log("\nEncrypted Payload:");
    console.log("IV:", encryptedPayload.iv);
    console.log("Encrypted Data:", encryptedPayload.encryptedData);
    console.log("Auth Tag:", encryptedPayload.authTag);

    // Decryption
    const decryptedMessage = cryptographer.decrypt(encryptedPayload);
    console.log("\nDecrypted Message:", decryptedMessage);

    if (originalMessage === decryptedMessage) {
      console.log("\nSuccess: Encryption and decryption work correctly!");
    } else {
      console.error("\nError: The decrypted message does not match the original.");
    }

// Failure test (e.g., tampered auth tag)
console.log("\n--- Failure Test with Tampered Auth Tag ---");
const tamperedPayload: EncryptedPayload = {
    ...encryptedPayload,
    authTag: crypto.randomBytes(AUTH_TAG_LENGTH).toString('hex')
};
try {
    cryptographer.decrypt(tamperedPayload);
} catch (e) {
    console.log("Decryption failed as expected:", (e as Error).message);
}


  } catch (error) {
    console.error("Error in test:", (error as Error).message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCryptography();
}
*/