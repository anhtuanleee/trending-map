import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

type Body = {
  reportId: string;
  kind: 'seen' | 'not_there' | 'incorrect';
  coordinate?: { longitude: number; latitude: number };
  idempotencyKey: string;
};

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
    if (!body.reportId || !['seen', 'not_there', 'incorrect'].includes(body.kind)) {
      return json({ error: 'invalid_payload' }, 422);
    }

    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } },
    );
    const { error } = await client.rpc('confirm_report', {
      p_report_id: body.reportId,
      p_kind: body.kind,
      p_longitude: body.coordinate?.longitude ?? null,
      p_latitude: body.coordinate?.latitude ?? null,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) return json({ error: error.message }, 400);

    return json({ reportId: body.reportId, accepted: true });
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
