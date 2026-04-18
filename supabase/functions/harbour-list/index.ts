import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders, corsJson } from '../_shared/cors.ts';
import {
  createAdminClient,
  ensureUserFolder,
  getAuthedUser,
  getHubConfig,
  listFolderFiles,
  refreshDriveAccessToken,
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

    const { userId } = await req.json();
    if (!userId || userId !== auth.user.id) {
      return corsJson({ error: 'You can only list your own Harbour berth.' }, 403);
    }

    const admin = createAdminClient();
    const hub = await getHubConfig(admin);
    const accessToken = await refreshDriveAccessToken(hub.master_refresh_token);
    const provisioned = await ensureUserFolder(admin, accessToken, userId);
    const files = await listFolderFiles(accessToken, provisioned.folderId);

    return corsJson({
      ok: true,
      folderId: provisioned.folderId,
      folderName: provisioned.folderName,
      files,
    });
  } catch (error) {
    return corsJson(
      { error: error instanceof Error ? error.message : 'Unknown Harbour list error' },
      500
    );
  }
});
