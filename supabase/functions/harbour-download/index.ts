import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders, corsJson } from '../_shared/cors.ts';
import {
  assertCanAccessHarbourFile,
  createAdminClient,
  downloadHarbourPayload,
  getHubConfig,
  refreshDriveAccessToken,
} from '../_shared/harbour.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileId, ownerId } = await req.json();
    if (!fileId || !ownerId) {
      return corsJson({ error: 'Missing fileId or ownerId.' }, 400);
    }

    const access = await assertCanAccessHarbourFile(req, ownerId, fileId);
    if (access.error) {
      return access.error;
    }

    const admin = createAdminClient();
    const hub = await getHubConfig(admin);
    const accessToken = await refreshDriveAccessToken(hub.master_refresh_token);
    const payload = await downloadHarbourPayload(accessToken, fileId);

    return corsJson({
      ok: true,
      cipher: payload.cipher,
      nonce: payload.nonce,
      fileName: payload.fileName ?? null,
      uploadedAt: payload.uploadedAt ?? null,
    });
  } catch (error) {
    return corsJson(
      { error: error instanceof Error ? error.message : 'Unknown Harbour download error' },
      500
    );
  }
});
