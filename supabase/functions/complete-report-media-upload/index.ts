import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

type Body = { mediaId: string; idempotencyKey: string };

const bucket = 'report-evidence-private';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'authentication_required' }, 401);

  try {
    const body = (await request.json()) as Body;
    if (!body.mediaId || !body.idempotencyKey) return json({ error: 'invalid_payload' }, 422);

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authorization } },
    });
    const { data: media, error: mediaError } = await userClient
      .from('report_media')
      .select('storage_path, file_size_bytes, mime_type')
      .eq('id', body.mediaId)
      .maybeSingle();
    if (mediaError || !media) return json({ error: 'media_not_found' }, 404);

    const pathParts = media.storage_path.split('/');
    const fileName = pathParts.pop();
    if (!fileName) return json({ error: 'invalid_storage_path' }, 500);
    const folder = pathParts.join('/');
    const adminClient = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const listed = await adminClient.storage.from(bucket).list(folder, {
      limit: 2,
      search: fileName,
    });
    const uploadedObject = listed.data?.find((item) => item.name === fileName);
    if (listed.error || !uploadedObject) {
      return json({ error: 'uploaded_object_not_found' }, 409);
    }
    const objectSize = Number(uploadedObject.metadata?.size);
    const objectMimeType = uploadedObject.metadata?.mimetype;
    if (objectSize !== media.file_size_bytes || objectMimeType !== media.mime_type) {
      return json({ error: 'uploaded_object_mismatch' }, 409);
    }

    const { error } = await userClient.rpc('complete_report_media_upload', {
      p_media_id: body.mediaId,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) return json({ error: error.message }, 400);

    return json({ mediaId: body.mediaId, status: 'uploaded' });
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
