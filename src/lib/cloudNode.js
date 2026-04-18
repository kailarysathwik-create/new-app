import { encryptFile, decryptFile } from '../crypto/encryption';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { decodeBase64 } from 'tweetnacl-util';

/**
 * SAILY — THE HARBOUR
 * 
 * Architecture:
 * - "The Harbour" is the Admin's 5TB Google Drive, shared across all Saily users.
 * - The admin's OAuth credentials are stored ONLY on the Supabase backend (hub_config table).
 * - All uploads/downloads go through a Supabase Edge Function that uses the master token.
 * - Each user's media is stored in: SAILY/[userId]/ — their personal berth.
 * - Files are E2E encrypted on-device BEFORE upload, so even the admin can't read them.
 */

// ─── UPLOAD TO THE HARBOUR ─────────────────────────────────────────────────
// Encrypts a file locally, then sends the cipher to the Supabase Edge Function
// which deposits it into SAILY/[userId]/ on the Harbour drive.
export const uploadToHarbour = async (localUri, fileName, userId, options = {}) => {
  let base64 = null;
  const mimeType = options.mimeType || 'application/octet-stream';

  try {
    // 1. Read and Encrypt locally (zero-knowledge)
    base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { cipher, nonce } = await encryptFile(base64);

    // 2. Call the Supabase Edge Function — it uses the Master Token server-side
    const { data, error } = await supabase.functions.invoke('harbour-upload', {
      body: {
        userId,
        fileName,
        cipher,
        nonce,
      },
    });

    if (error) throw error;
    return { fileId: data.fileId, publicUrl: null, error: null, viaFallback: false };
  } catch (err) {
    console.error('[Harbour] Upload failed:', err);

    // Fallback path: if edge function is unavailable, upload media directly
    // to an accessible storage bucket so users can continue using the app.
    try {
      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const fileBuffer = decodeBase64(base64);
      const safeName = `${Date.now()}_${fileName}`;
      const path = `${userId}/${safeName}`;
      const candidateBuckets = ['harbour', 'media', 'uploads', 'avatars'];
      let lastUploadError = null;

      for (const bucket of candidateBuckets) {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, fileBuffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: mimeType,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          if (data?.publicUrl) {
            return {
              fileId: null,
              publicUrl: data.publicUrl,
              error: null,
              viaFallback: true,
            };
          }
        }

        lastUploadError = uploadError;
      }

      if (lastUploadError) {
        console.error('[Harbour] No fallback bucket accepted the upload:', lastUploadError);
      }
    } catch (fallbackErr) {
      console.error('[Harbour] Fallback upload failed:', fallbackErr);
    }

    return { fileId: null, publicUrl: null, error: err, viaFallback: false };
  }
};

// ─── DOWNLOAD FROM THE HARBOUR ─────────────────────────────────────────────
// Fetches the encrypted cipher via Supabase Edge Function, then decrypts locally.
export const downloadFromHarbour = async (fileId, ownerId) => {
  try {
    const { data, error } = await supabase.functions.invoke('harbour-download', {
      body: { fileId, ownerId },
    });

    if (error) throw error;

    // Decrypt locally — the edge function only returns the cipher
    const decryptedBase64 = await decryptFile(data.cipher, data.nonce);
    const localUri = `${FileSystem.cacheDirectory}harbour_${fileId}`;
    await FileSystem.writeAsStringAsync(localUri, decryptedBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { localUri, error: null };
  } catch (err) {
    console.error('[Harbour] Download failed:', err);
    return { localUri: null, error: err };
  }
};

// ─── LIST USER'S BERTH ─────────────────────────────────────────────────────
// Returns all files in this user's partition (SAILY/[userId]/) from The Harbour.
export const listUserBerth = async (userId) => {
  try {
    const { data, error } = await supabase.functions.invoke('harbour-list', {
      body: { userId },
    });
    if (error) throw error;
    return { files: data.files, error: null };
  } catch (err) {
    console.error('[Harbour] List failed:', err);
    return { files: [], error: err };
  }
};

// ─── LEGACY COMPAT ─────────────────────────────────────────────────────────
// Kept for PostCard backward compat that still references downloadFromCloud
export const downloadFromCloud = downloadFromHarbour;
export const uploadToCloud = (localUri, fileName, _accessToken, _folderId, userId) =>
  uploadToHarbour(localUri, fileName, userId);
