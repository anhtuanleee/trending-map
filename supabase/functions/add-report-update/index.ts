import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

type Body = {
  reportId: string;
  kind: 'note' | 'status_change';
  body?: string;
  operationalStatus?: 'active' | 'resolving' | 'resolved';
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
    const noteValid = body.kind === 'note' && Boolean(body.body?.trim());
    const statusValid =
      body.kind === 'status_change' &&
      ['active', 'resolving', 'resolved'].includes(body.operationalStatus ?? '');

    if (!body.reportId || !body.idempotencyKey || (!noteValid && !statusValid)) {
      return json({ error: 'invalid_payload' }, 422);
    }
    if (body.body && body.body.trim().length > 1000) {
      return json({ error: 'body_too_long' }, 422);
    }

    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } },
    );
    const { data, error } = await client.rpc('add_report_update', {
      p_report_id: body.reportId,
      p_kind: body.kind,
      p_body: body.body?.trim() ?? null,
      p_operational_status: body.operationalStatus ?? null,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) return json({ error: error.message }, 400);

    const item = data?.[0];
    if (!item) return json({ error: 'update_not_returned' }, 500);

    return json({
      id: item.id,
      reportId: item.report_id,
      kind: item.kind,
      body: item.body,
      operationalStatus: item.operational_status,
      official: item.official,
      sourceLabel: item.source_label,
      createdAt: item.created_at,
    });
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
