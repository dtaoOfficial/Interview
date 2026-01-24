import CryptoJS from 'crypto-js';

// 🔐 MUST MATCH THE KEY IN YOUR SPRING BOOT BACKEND (EncryptionUtil.java)
const SECRET_KEY = "NewHorizonSecure@2025"; 

export const decryptData = (encryptedData: string) => {
  try {
    // 1. Replicate Java's SHA-1 Key Generation Logic
    // Java: MessageDigest.getInstance("SHA-1").digest(key.getBytes("UTF-8"))
    const keyHash = CryptoJS.SHA1(CryptoJS.enc.Utf8.parse(SECRET_KEY));
    
    // Java: Arrays.copyOf(key, 16) -> Take first 16 bytes (32 hex characters)
    const keyHex = CryptoJS.enc.Hex.parse(keyHash.toString().substring(0, 32));

    // 2. Decrypt using AES-128 (ECB Mode, PKCS5 Padding)
    // Java: Cipher.getInstance("AES/ECB/PKCS5Padding")
    const bytes = CryptoJS.AES.decrypt(encryptedData, keyHex, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    // 3. Convert result to UTF-8 String
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) return null;
    
    return JSON.parse(decryptedString);
  } catch (error) {
    // console.error("Decryption Failed:", error); // Keep silent in prod
    return null;
  }
};