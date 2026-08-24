import {
  confirmationResultSchema,
  type ConfirmationInput,
  type ConfirmationResult,
} from '@trending-map/contracts';

import { supabase } from '@/lib/supabase/client';

export async function confirmReport(input: ConfirmationInput): Promise<ConfirmationResult> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return confirmationResultSchema.parse({ reportId: input.reportId, accepted: true });
  }

  const { data, error } = await supabase.functions.invoke('confirm-report', { body: input });
  if (error) throw error;
  return confirmationResultSchema.parse(data);
}
