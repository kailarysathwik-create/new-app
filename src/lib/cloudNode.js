import { encryptFile, decryptFile } from '../crypto/encryption';
import * as FileSystem from 'expo-file-system';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * Saily Cloud Node Engine
 * Manages encrypted storage on the user's personal cloud.
 */

export const getCloudHeader = (accessToken) => ({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
});

// Search for the 'SAILY' folder on the user's Drive
export const findSailyFolder = async (accessToken) => {
    const query = encodeURIComponent("name = 'SAILY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const response = await fetch(`${DRIVE_API_URL}?q=${query}`, {
        headers: getCloudHeader(accessToken),
    });
    const data = await response.json();
    return data.files?.[0] || null;
};

// Create the 'SAILY' folder if it doesn't exist
export const createSailyFolder = async (accessToken) => {
    const response = await fetch(DRIVE_API_URL, {
        method: 'POST',
        headers: getCloudHeader(accessToken),
        body: JSON.stringify({
            name: 'SAILY',
            mimeType: 'application/vnd.google-apps.folder',
        }),
    });
    return await response.json();
};

// Encrypt and Upload a file to the SAILY folder
export const uploadToCloud = async (localUri, fileName, accessToken, folderId) => {
    try {
        // 1. Read file as Base64
        const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
        
        // 2. Encrypt file data
        const { cipher, nonce } = await encryptFile(base64);
        
        // 3. Prepare Multipart Upload (Metadata + Encrypted Cipher)
        const metadata = {
            name: fileName,
            parents: [folderId],
            description: JSON.stringify({ s_nonce: nonce, s_version: '1.0' }),
        };

        const boundary = 'SAILY_BOUNDARY';
        const body = 
            `--${boundary}\r\n` +
            `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
            `${JSON.stringify(metadata)}\r\n` +
            `--${boundary}\r\n` +
            `Content-Type: application/octet-stream\r\n\r\n` +
            `${cipher}\r\n` +
            `--${boundary}--`;

        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                ...getCloudHeader(accessToken),
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: body,
        });

        const result = await response.json();
        return { fileId: result.id, error: null };
    } catch (err) {
        console.error('Cloud upload failed:', err);
        return { fileId: null, error: err };
    }
};

// Download and Decrypt a file
export const downloadFromCloud = async (fileId, accessToken) => {
    try {
        // 1. Get Metadata (to find the nonce)
        const metaRes = await fetch(`${DRIVE_API_URL}/${fileId}?fields=description`, {
            headers: getCloudHeader(accessToken),
        });
        const metadata = await metaRes.json();
        const { s_nonce } = JSON.parse(metadata.description);

        // 2. Get Media (Cipher text)
        const mediaRes = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
            headers: getCloudHeader(accessToken),
        });
        const cipher = await mediaRes.text();

        // 3. Decrypt
        const decryptedBase64 = await decryptFile(cipher, s_nonce);
        
        // 4. Save to temporary local file
        const localUri = `${FileSystem.cacheDirectory}${fileId}`;
        await FileSystem.writeAsStringAsync(localUri, decryptedBase64, { encoding: FileSystem.EncodingType.Base64 });
        
        return { localUri, error: null };
    } catch (err) {
        console.error('Cloud download failed:', err);
        return { localUri: null, error: err };
    }
};
