import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

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
  const { data, error } = await userClient.rpc('get_report_moderation_queue');
  if (error) {
    const forbidden = error.message.includes('moderator_required');
    return json({ error: forbidden ? 'moderator_required' : error.message }, forbidden ? 403 : 400);
  }

  return json({
    items: (data ?? []).map((row: Record<string, unknown>) => ({
      caseId: row.case_id,
      reportId: row.report_id,
      type: row.report_type,
      categoryName: row.category_name,
      title: row.title,
      description: row.description,
      addressLabel: row.address_label,
      severity: row.severity,
      verificationStatus: row.verification_status,
      operationalStatus: row.operational_status,
      moderationStatus: row.moderation_status,
      visibilityStatus: row.visibility_status,
      openFlagCount: row.open_flag_count,
      flagReasons: row.flag_reasons ?? [],
      confirmationCount: row.confirmation_count,
      notThereCount: row.not_there_count,
      startsAt: row.starts_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      priority: row.priority,
      caseStatus: row.case_status,
      queueReason: row.queue_reason,
    })),
  });
});
