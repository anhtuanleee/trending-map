import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

type Body = {
  mediaId: string;
  decision: 'approve' | 'reject';
  reason?: string;
  idempotencyKey: string;
};

const privateBucket = 'report-evidence-private';
const publicBucket = 'report-evidence-public';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const reason = body.reason?.trim();
    if (
      !uuidPattern.test(body.mediaId) ||
      !uuidPattern.test(body.idempotencyKey) ||
      !['approve', 'reject'].includes(body.decision) ||
      (body.decision === 'reject' && !reason) ||
      (reason?.length ?? 0) > 500
    ) {
      return json({ error: 'invalid_payload' }, 422);
    }

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authorization } },
    });
    const prepared = await userClient.rpc('prepare_report_media_moderation', {
      p_media_id: body.mediaId,
      p_decision: body.decision,
      p_reason: reason ?? null,
      p_idempotency_key: body.idempotencyKey,
    });
    if (prepared.error) {
      const forbidden = prepared.error.message.includes('moderator_required');
      return json(
        { error: forbidden ? 'moderator_required' : prepared.error.message },
        forbidden ? 403 : 400,
      );
    }

    const claim = prepared.data?.[0];
    if (!claim) return json({ error: 'moderation_claim_not_returned' }, 500);
    const adminClient = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    if (claim.moderation_status === 'rejected') {
      const canonicalPublicPath = `${claim.report_id}/${claim.media_id}.jpg`;
      await adminClient.storage.from(publicBucket).remove([canonicalPublicPath]);
      return json({ mediaId: claim.media_id, status: 'rejected', publicUrl: null });
    }
    if (claim.moderation_status === 'approved') {
      return json({ mediaId: claim.media_id, status: 'approved', publicUrl: claim.public_url });
    }

    const media = await adminClient
      .from('report_media')
      .select('storage_path,public_storage_path,upload_status,moderation_idempotency_key')
      .eq('id', body.mediaId)
      .maybeSingle();
    if (
      media.error ||
      !media.data ||
      media.data.upload_status !== 'processing' ||
      media.data.moderation_idempotency_key !== body.idempotencyKey ||
      !media.data.public_storage_path
    ) {
      await adminClient.rpc('release_report_media_moderation_claim', {
        p_media_id: body.mediaId,
        p_idempotency_key: body.idempotencyKey,
      });
      return json({ error: 'media_claim_lookup_failed' }, 500);
    }

    const storagePath = media.data.storage_path;
    const publicStoragePath = media.data.public_storage_path;
    const downloaded = await adminClient.storage.from(privateBucket).download(storagePath);
    if (
      downloaded.error ||
      !downloaded.data ||
      downloaded.data.size < 1 ||
      downloaded.data.size > 5_000_000
    ) {
      await adminClient.rpc('release_report_media_moderation_claim', {
        p_media_id: body.mediaId,
        p_idempotency_key: body.idempotencyKey,
      });
      return json({ error: 'private_media_download_failed' }, 500);
    }

    const uploaded = await adminClient.storage
      .from(publicBucket)
      .upload(publicStoragePath, downloaded.data, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });
    if (uploaded.error) {
      await adminClient.rpc('release_report_media_moderation_claim', {
        p_media_id: body.mediaId,
        p_idempotency_key: body.idempotencyKey,
      });
      return json({ error: 'public_media_upload_failed' }, 500);
    }

    const publicUrl = adminClient.storage.from(publicBucket).getPublicUrl(publicStoragePath)
      .data.publicUrl;
    const completed = await adminClient.rpc('complete_report_media_moderation', {
      p_media_id: body.mediaId,
      p_idempotency_key: body.idempotencyKey,
      p_public_url: publicUrl,
    });
    if (completed.error) {
      const current = await adminClient
        .from('report_media')
        .select('upload_status,thumbnail_path,moderation_idempotency_key')
        .eq('id', body.mediaId)
        .maybeSingle();
      if (
        !current.error &&
        current.data?.upload_status === 'approved' &&
        current.data.moderation_idempotency_key === body.idempotencyKey
      ) {
        return json({
          mediaId: body.mediaId,
          status: 'approved',
          publicUrl: current.data.thumbnail_path,
        });
      }

      await adminClient.storage.from(publicBucket).remove([publicStoragePath]);
      await adminClient.rpc('release_report_media_moderation_claim', {
        p_media_id: body.mediaId,
        p_idempotency_key: body.idempotencyKey,
      });
      return json({ error: 'media_publication_finalize_failed' }, 500);
    }

    return json({ mediaId: body.mediaId, status: 'approved', publicUrl });
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
