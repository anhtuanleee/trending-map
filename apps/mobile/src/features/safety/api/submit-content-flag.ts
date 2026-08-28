import {
  submitContentFlagResultSchema,
  type SubmitContentFlagInput,
  type SubmitContentFlagResult,
} from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export async function submitContentFlag(
  input: SubmitContentFlagInput,
): Promise<SubmitContentFlagResult> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return submitContentFlagResultSchema.parse({
      id: input.idempotencyKey,
      reportId: input.reportId,
      status: 'open',
    });
  }

  const { data, error } = await supabase.functions.invoke('submit-content-flag', { body: input });
  if (error) throw error;
  return submitContentFlagResultSchema.parse(data);
}
