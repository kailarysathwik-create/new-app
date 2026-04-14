import { encryptFile, decryptFile } from '../crypto/encryption';
import * as FileSystem from 'expo-file-system';

/**
 * SAILY SHARED CLOUD ENGINE (5TB HUB)
 * Target Account: kailarysathwik@gmail.com
 * 
 * Architecture:
 * - Root: 'SAILY' (Shared 5TB Folder)
 * - Subfolders: '/[userId]/...' (Automatic User Partitions)
 */

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

export const getCloudHeader = (accessToken) => ({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
});

// Find the global 'SAILY' root folder on the hub account
export const findSailyRoot = async (accessToken) => {
    const query = encodeURIComponent("name = 'SAILY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const response = await fetch(`${DRIVE_API_URL}?q=${query}`, {
        headers: getCloudHeader(accessToken),
    });
    const data = await response.json();
    return data.files?.[0] || null;
};

// Find or create a user-specific subfolder within the SAILY root
export const getOrCreateUserFolder = async (accessToken, userId, rootFolderId) => {
    // 1. Check if user subfolder exists
    const query = encodeURIComponent(`name = '${userId}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const response = await fetch(`${DRIVE_API_URL}?q=${query}`, {
        headers: getCloudHeader(accessToken),
    });
    const data = await response.json();
    
    if (data.files?.[0]) {
        return data.files[0].id;
    }

    // 2. Create if it doesn't exist
    const createRes = await fetch(DRIVE_API_URL, {
        method: 'POST',
        headers: getCloudHeader(accessToken),
        body: JSON.stringify({
            name: userId,
            parents: [rootFolderId],
            mimeType: 'application/vnd.google-apps.folder',
        }),
    });
    const folder = await createRes.json();
    return folder.id;
};

// Create the 'SAILY' root folder (Admin only)
export const createSailyRoot = async (accessToken) => {
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

export const uploadToCloud = async (localUri, fileName, accessToken, userId, rootFolderId) => {
    try {
        // 1. Get/Create the target user partition
        const userFolderId = await getOrCreateUserFolder(accessToken, userId, rootFolderId);

        // 2. Read and Encrypt
        const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
        const { cipher, nonce } = await encryptFile(base64);
        
        // 3. Prepare Multipart Upload
        const metadata = {
            name: fileName,
            parents: [userFolderId],
            description: JSON.stringify({ s_nonce: nonce, s_version: '1.0', owner: userId }),
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
        console.error('Shared cloud upload failed:', err);
        return { fileId: null, error: err };
    }
};

export const downloadFromCloud = async (fileId, accessToken) => {
    try {
        const metaRes = await fetch(`${DRIVE_API_URL}/${fileId}?fields=description`, {
            headers: getCloudHeader(accessToken),
        });
        const metadata = await metaRes.json();
        const { s_nonce } = JSON.parse(metadata.description);

        const mediaRes = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
            headers: getCloudHeader(accessToken),
        });
        const cipher = await mediaRes.text();

        const decryptedBase64 = await decryptFile(cipher, s_nonce);
        const localUri = `${FileSystem.cacheDirectory}${fileId}`;
        await FileSystem.writeAsStringAsync(localUri, decryptedBase64, { encoding: FileSystem.EncodingType.Base64 });
        
        return { localUri, error: null };
    } catch (err) {
        console.error('Shared cloud download failed:', err);
        return { localUri: null, error: err };
    }
};

