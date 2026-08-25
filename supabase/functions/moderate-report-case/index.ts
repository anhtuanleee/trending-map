import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

type Body = {
  caseId: string;
  action: 'approve' | 'resolve' | 'reject';
  reason?: string;
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
    const reason = body.reason?.trim();
    if (
      !uuidPattern.test(body.caseId) ||
      !uuidPattern.test(body.idempotencyKey) ||
      !['approve', 'resolve', 'reject'].includes(body.action) ||
      (body.action !== 'approve' && !reason) ||
      (reason?.length ?? 0) > 500
    ) {
      return json({ error: 'invalid_payload' }, 422);
    }

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authorization } },
    });
    const { data, error } = await userClient.rpc('moderate_report_case', {
      p_case_id: body.caseId,
      p_action: body.action,
      p_reason: reason ?? null,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) {
      const forbidden = error.message.includes('moderator_required');
      return json(
        { error: forbidden ? 'moderator_required' : error.message },
        forbidden ? 403 : 400,
      );
    }

    const result = data?.[0];
    if (!result) return json({ error: 'moderation_result_not_returned' }, 500);
    return json({
      caseId: result.case_id,
      reportId: result.report_id,
      action: result.moderation_action,
      caseStatus: result.case_status,
      verificationStatus: result.verification_status,
      operationalStatus: result.operational_status,
    });
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
