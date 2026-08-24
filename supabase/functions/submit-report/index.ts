import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

import { corsHeaders } from '../_shared/cors.ts';

type Body = {
  type: 'incident' | 'scheduled_event' | 'area_alert';
  categoryId: string;
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  coordinate: { longitude: number; latitude: number };
  addressLabel?: string;
  startsAt: string;
  endsAt?: string;
  anonymousPublicly: boolean;
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
    if (!body.title || body.title.trim().length < 6 || !body.description) {
      return json({ error: 'invalid_payload' }, 422);
    }
    if (
      !Number.isFinite(body.coordinate?.latitude) ||
      !Number.isFinite(body.coordinate?.longitude)
    ) {
      return json({ error: 'invalid_coordinate' }, 422);
    }

    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } },
    );
    const { data, error } = await client.rpc('submit_report', {
      p_type: body.type,
      p_category_id: body.categoryId,
      p_title: body.title,
      p_description: body.description,
      p_severity: body.severity,
      p_longitude: body.coordinate.longitude,
      p_latitude: body.coordinate.latitude,
      p_address_label: body.addressLabel ?? null,
      p_starts_at: body.startsAt,
      p_ends_at: body.endsAt ?? null,
      p_anonymous_publicly: body.anonymousPublicly,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) return json({ error: error.message }, 400);

    return json({ id: data, status: 'unverified' }, 201);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
});
