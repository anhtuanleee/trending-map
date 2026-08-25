import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

const privateBucket = 'report-evidence-private';

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

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await userClient.rpc('get_report_media_moderation_queue');
  if (error) {
    const forbidden = error.message.includes('moderator_required');
    return json({ error: forbidden ? 'moderator_required' : error.message }, forbidden ? 403 : 400);
  }

  const adminClient = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const mediaIds = (data ?? []).map((row: Record<string, unknown>) => String(row.media_id));
  const paths = mediaIds.length
    ? await adminClient.from('report_media').select('id,storage_path').in('id', mediaIds)
    : { data: [], error: null };
  if (paths.error) return json({ error: 'private_media_lookup_failed' }, 500);
  const pathById = new Map((paths.data ?? []).map((row) => [row.id, row.storage_path]));
  const items = await Promise.all(
    (data ?? []).map(async (row: Record<string, unknown>) => {
      const storagePath = pathById.get(String(row.media_id));
      if (!storagePath) throw new Error('private_media_path_missing');
      const signed = await adminClient.storage
        .from(privateBucket)
        .createSignedUrl(storagePath, 600);
      if (signed.error) throw signed.error;

      return {
        mediaId: row.media_id,
        reportId: row.report_id,
        reportTitle: row.report_title,
        categoryName: row.category_name,
        addressLabel: row.address_label,
        severity: row.severity,
        mimeType: row.mime_type,
        width: row.width,
        height: row.height,
        fileSizeBytes: row.file_size_bytes,
        uploadedAt: row.uploaded_at,
        status: row.upload_status,
        previewUrl: signed.data.signedUrl,
      };
    }),
  ).catch(() => null);

  if (!items) return json({ error: 'preview_signing_failed' }, 500);
  return json({ items });
});
