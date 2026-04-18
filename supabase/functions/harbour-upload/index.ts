import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders, corsJson } from '../_shared/cors.ts';
import {
  createAdminClient,
  ensureUserFolder,
  getAuthedUser,
  getHubConfig,
  refreshDriveAccessToken,
  uploadHarbourPayload,
} from '../_shared/harbour.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await getAuthedUser(req);
    if (auth.error || !auth.user) {
      return auth.error;
    }

    const { userId, fileName, cipher, nonce } = await req.json();
    if (!userId || userId !== auth.user.id) {
      return corsJson({ error: 'You can only upload into your own Harbour berth.' }, 403);
    }

    if (!fileName || !cipher || !nonce) {
      return corsJson({ error: 'Missing fileName, cipher, or nonce.' }, 400);
    }

    const admin = createAdminClient();
    const hub = await getHubConfig(admin);
    const accessToken = await refreshDriveAccessToken(hub.master_refresh_token);
    const provisioned = await ensureUserFolder(admin, accessToken, userId);
    const file = await uploadHarbourPayload(accessToken, provisioned.folderId, {
      ownerId: userId,
      fileName,
      cipher,
      nonce,
    });

    return corsJson({
      ok: true,
      fileId: file.id,
      folderId: provisioned.folderId,
      folderName: provisioned.folderName,
    });
  } catch (error) {
    return corsJson(
      { error: error instanceof Error ? error.message : 'Unknown Harbour upload error' },
      500
    );
  }
});
