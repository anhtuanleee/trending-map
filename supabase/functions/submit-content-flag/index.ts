import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

const reasons = [
  'false_information',
  'incorrect_location',
  'outdated',
  'privacy_violation',
  'defamation',
  'fake_official_source',
  'dangerous_content',
  'spam',
  'copyright',
  'other',
] as const;

type Body = {
  reportId: string;
  reason: (typeof reasons)[number];
  description?: string;
  idempotencyKey: string;
};

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
    const description = body.description?.trim();
    if (
      !uuidPattern.test(body.reportId) ||
      !uuidPattern.test(body.idempotencyKey) ||
      !reasons.includes(body.reason) ||
      (description?.length ?? 0) > 1000 ||
      (body.reason === 'other' && !description)
    ) {
      return json({ error: 'invalid_payload' }, 422);
    }

    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } },
    );
    const { data, error } = await client.rpc('submit_content_flag', {
      p_report_id: body.reportId,
      p_reason: body.reason,
      p_description: description ?? null,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) return json({ error: error.message }, 400);

    return json({ id: data, reportId: body.reportId, status: 'open' }, 201);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
