import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

type Body = {
  reportId: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  fileSizeBytes: number;
  idempotencyKey: string;
};

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
    if (
      !body.reportId ||
      !body.idempotencyKey ||
      body.mimeType !== 'image/jpeg' ||
      !Number.isInteger(body.width) ||
      !Number.isInteger(body.height) ||
      body.width < 1 ||
      body.height < 1 ||
      body.width > 1600 ||
      body.height > 1600 ||
      !Number.isInteger(body.fileSizeBytes) ||
      body.fileSizeBytes < 1 ||
      body.fileSizeBytes > 5_000_000
    ) {
      return json({ error: 'invalid_payload' }, 422);
    }

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authorization } },
    });
    const { data, error } = await userClient.rpc('prepare_report_media_upload', {
      p_report_id: body.reportId,
      p_mime_type: body.mimeType,
      p_width: body.width,
      p_height: body.height,
      p_file_size_bytes: body.fileSizeBytes,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) return json({ error: error.message }, 400);

    const reservation = data?.[0];
    if (!reservation) return json({ error: 'reservation_not_returned' }, 500);

    const adminClient = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const pathParts = reservation.storage_path.split('/');
    const fileName = pathParts.pop();
    if (!fileName) return json({ error: 'invalid_storage_path' }, 500);
    const folder = pathParts.join('/');
    const listed = await adminClient.storage.from(bucket).list(folder, {
      limit: 2,
      search: fileName,
    });
    const objectAlreadyExists = !listed.error && listed.data.some((item) => item.name === fileName);
    if (!reservation.upload_required || objectAlreadyExists) {
      return json({ mediaId: reservation.media_id, uploadRequired: false });
    }

    const signed = await adminClient.storage
      .from(bucket)
      .createSignedUploadUrl(reservation.storage_path);
    if (signed.error) {
      await adminClient
        .from('report_media')
        .update({ upload_status: 'failed' })
        .eq('id', reservation.media_id);
      return json({ error: 'signed_upload_failed' }, 500);
    }

    return json({
      mediaId: reservation.media_id,
      uploadRequired: true,
      bucket,
      path: signed.data.path,
      token: signed.data.token,
    });
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
