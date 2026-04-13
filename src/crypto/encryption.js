import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

const PRIVATE_KEY_STORE = 'user_private_key';
const PUBLIC_KEY_STORE = 'user_public_key';

export async function generateAndStoreKeypair() {
  const keypair = nacl.box.keyPair();
  const privateKeyB64 = encodeBase64(keypair.secretKey);
  const publicKeyB64 = encodeBase64(keypair.publicKey);
  await SecureStore.setItemAsync(PRIVATE_KEY_STORE, privateKeyB64);
  await SecureStore.setItemAsync(PUBLIC_KEY_STORE, publicKeyB64);
  return { publicKey: publicKeyB64 };
}

export async function encryptMessage(plainText, recipientPublicKeyB64) {
  const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
  if (!privateKeyB64) throw new Error('No local private key found');
  const senderSecretKey = decodeBase64(privateKeyB64);
  const recipientPublicKey = decodeBase64(recipientPublicKeyB64);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = encodeUTF8(plainText);
  const encrypted = nacl.box(messageUint8, nonce, recipientPublicKey, senderSecretKey);
  return { cipher: encodeBase64(encrypted), nonce: encodeBase64(nonce) };
}

export async function decryptMessage(cipherB64, nonceB64, senderPublicKeyB64) {
  const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
  if (!privateKeyB64) throw new Error('No local private key found');
  const recipientSecretKey = decodeBase64(privateKeyB64);
  const senderPublicKey = decodeBase64(senderPublicKeyB64);
  const nonce = decodeBase64(nonceB64);
  const cipher = decodeBase64(cipherB64);
  const decrypted = nacl.box.open(cipher, nonce, senderPublicKey, recipientSecretKey);
  if (!decrypted) throw new Error('Decryption failed');
  return decodeUTF8(decrypted);
}

// Symmetric encryption for large files (Vault / Media)
export async function encryptFile(base64Data) {
  const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
  // We use the first 32 bytes of the private key as a symmetric key for secretbox
  const key = decodeBase64(privateKeyB64).slice(0, 32);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageUint8 = decodeBase64(base64Data);
  const encrypted = nacl.secretbox(messageUint8, nonce, key);
  return { cipher: encodeBase64(encrypted), nonce: encodeBase64(nonce) };
}

export async function decryptFile(cipherB64, nonceB64) {
  const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
  const key = decodeBase64(privateKeyB64).slice(0, 32);
  const nonce = decodeBase64(nonceB64);
  const cipher = decodeBase64(cipherB64);
  const decrypted = nacl.secretbox.open(cipher, nonce, key);
  if (!decrypted) throw new Error('File decryption failed');
  return encodeBase64(decrypted);
}

export async function getLocalPublicKey() {
  return await SecureStore.getItemAsync(PUBLIC_KEY_STORE);
}
