import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsJson } from './cors.ts';

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createAdminClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

export function createUserClient(authHeader: string) {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'), {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { error: corsJson({ error: 'Missing Authorization header' }, 401), authHeader: null, user: null };
  }

  const userClient = createUserClient(authHeader);
  const { data, error } = await userClient.auth.getUser();

  if (error || !data.user) {
    return { error: corsJson({ error: 'Invalid session' }, 401), authHeader, user: null };
  }

  return { error: null, authHeader, user: data.user };
}

export async function getHubConfig(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin.from('hub_config').select('*').single();
  if (error || !data) {
    throw new Error(`Hub configuration is missing: ${error?.message ?? 'No hub_config row found'}`);
  }

  return data;
}

export async function refreshDriveAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google token refresh failed: ${response.status} ${details}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Google token refresh succeeded without an access_token');
  }

  return data.access_token as string;
}

async function driveRequest<T>(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${GOOGLE_DRIVE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Drive request failed: ${response.status} ${details}`);
  }

  return (await response.json()) as T;
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function sanitizeFolderName(value: string) {
  const trimmed = value.trim();
  const sanitized = trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').slice(0, 80);
  return sanitized || 'saily-user';
}

async function findFolder(accessToken: string, name: string, parentId: string) {
  const q = [
    `name = '${escapeDriveQueryValue(name)}'`,
    `mimeType = '${FOLDER_MIME}'`,
    `'${parentId}' in parents`,
    'trashed = false',
  ].join(' and ');

  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,parents)',
    pageSize: '1',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const data = await driveRequest<{ files: Array<{ id: string; name: string }> }>(
    accessToken,
    `/files?${params.toString()}`
  );

  return data.files?.[0] ?? null;
}

async function createFolder(accessToken: string, name: string, parentId: string) {
  return await driveRequest<{ id: string; name: string }>(accessToken, '/files?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    }),
  });
}

async function getFileMetadata(accessToken: string, fileId: string) {
  const params = new URLSearchParams({
    fields: 'id,name,parents,appProperties,size,createdTime,modifiedTime,mimeType',
    supportsAllDrives: 'true',
  });

  return await driveRequest<{
    id: string;
    name: string;
    parents?: string[];
    appProperties?: Record<string, string>;
    size?: string;
    createdTime?: string;
    modifiedTime?: string;
    mimeType?: string;
  }>(accessToken, `/files/${fileId}?${params.toString()}`);
}

export async function ensureRootFolder(admin: ReturnType<typeof createAdminClient>, accessToken: string, hub: any) {
  if (hub.master_folder_id) {
    try {
      const metadata = await getFileMetadata(accessToken, hub.master_folder_id);
      if (metadata?.id) {
        return metadata.id;
      }
    } catch (_error) {
      // If the configured root disappeared or is invalid, recreate and persist it.
    }
  }

  const existing = await findFolder(accessToken, 'SAILY', 'root');
  const rootFolder = existing ?? (await createFolder(accessToken, 'SAILY', 'root'));

  await admin.from('hub_config').update({ master_folder_id: rootFolder.id }).eq('id', hub.id);
  return rootFolder.id;
}

export async function ensureUserFolder(
  admin: ReturnType<typeof createAdminClient>,
  accessToken: string,
  userId: string
) {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, username, harbour_folder_id, harbour_folder_name')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error(`Profile not found for folder provisioning: ${error?.message ?? userId}`);
  }

  if (profile.harbour_folder_id) {
    return {
      folderId: profile.harbour_folder_id,
      folderName: profile.harbour_folder_name ?? profile.username,
      profile,
    };
  }

  const hub = await getHubConfig(admin);
  const rootFolderId = await ensureRootFolder(admin, accessToken, hub);
  const folderName = sanitizeFolderName(profile.username);

  const existing = await findFolder(accessToken, folderName, rootFolderId);
  const folder = existing ?? (await createFolder(accessToken, folderName, rootFolderId));

  const updatePayload = {
    harbour_folder_id: folder.id,
    harbour_folder_name: folder.name,
    harbour_provisioned_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: updatedProfile, error: updateError } = await admin
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select('*')
    .single();

  if (updateError || !updatedProfile) {
    throw new Error(`Failed to persist harbour folder metadata: ${updateError?.message ?? 'Unknown error'}`);
  }

  return {
    folderId: folder.id,
    folderName: folder.name,
    profile: updatedProfile,
  };
}

function buildMultipartBody(metadata: Record<string, unknown>, mediaBody: string, mediaType: string) {
  const boundary = `saily-${crypto.randomUUID()}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mediaType}`,
    '',
    mediaBody,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return {
    boundary,
    body,
  };
}

export async function uploadHarbourPayload(accessToken: string, folderId: string, payload: {
  fileName: string;
  ownerId: string;
  cipher: string;
  nonce: string;
}) {
  const metadata = {
    name: payload.fileName,
    parents: [folderId],
    appProperties: {
      ownerId: payload.ownerId,
      storage: 'harbour',
      cipherVersion: '1',
    },
  };

  const mediaBody = JSON.stringify({
    cipher: payload.cipher,
    nonce: payload.nonce,
    fileName: payload.fileName,
    uploadedAt: new Date().toISOString(),
  });

  const multipart = buildMultipartBody(metadata, mediaBody, 'application/json');
  const response = await fetch(`${GOOGLE_DRIVE_UPLOAD_API}?uploadType=multipart&supportsAllDrives=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${multipart.boundary}`,
    },
    body: multipart.body,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Drive upload failed: ${response.status} ${details}`);
  }

  return await response.json() as { id: string; name: string };
}

export async function downloadHarbourPayload(accessToken: string, fileId: string) {
  const response = await fetch(
    `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Drive download failed: ${response.status} ${details}`);
  }

  return await response.json() as {
    cipher: string;
    nonce: string;
    fileName?: string;
    uploadedAt?: string;
  };
}

export async function listFolderFiles(accessToken: string, folderId: string) {
  const q = [`'${folderId}' in parents`, 'trashed = false'].join(' and ');
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,size,createdTime,modifiedTime,mimeType,appProperties)',
    orderBy: 'createdTime desc',
    pageSize: '100',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const data = await driveRequest<{
    files: Array<{
      id: string;
      name: string;
      size?: string;
      createdTime?: string;
      modifiedTime?: string;
      mimeType?: string;
      appProperties?: Record<string, string>;
    }>;
  }>(accessToken, `/files?${params.toString()}`);

  return data.files ?? [];
}

export async function assertCanAccessHarbourFile(req: Request, ownerId: string, fileId: string) {
  const auth = await getAuthedUser(req);
  if (auth.error || !auth.user || !auth.authHeader) {
    return auth;
  }

  if (auth.user.id === ownerId) {
    return auth;
  }

  const userClient = createUserClient(auth.authHeader);
  const [postResult, storyResult] = await Promise.all([
    userClient.from('posts').select('id').eq('user_id', ownerId).eq('cloud_file_id', fileId).maybeSingle(),
    userClient.from('stories').select('id').eq('user_id', ownerId).eq('cloud_file_id', fileId).maybeSingle(),
  ]);

  if (!postResult.data && !storyResult.data) {
    return {
      error: corsJson({ error: 'You do not have access to this Harbour file.' }, 403),
      user: null,
      authHeader: auth.authHeader,
    };
  }

  return auth;
}
