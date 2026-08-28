-- Supabase grants function EXECUTE directly to API roles through default
-- privileges. Revoking only from PUBLIC therefore leaves auth-only RPCs
-- callable by anon. Make the public schema deny-by-default, then restore the
-- intentional API surface explicitly.
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;

-- Anonymous/public reads.
grant execute on function public.get_map_items to anon, authenticated;
grant execute on function public.get_report_timeline to anon, authenticated;
grant execute on function public.get_feature_rollouts to anon, authenticated;
grant execute on function public.get_current_policy_versions to anon, authenticated;

-- Authenticated community commands and private capability checks.
grant execute on function public.is_moderator to authenticated;
grant execute on function public.submit_report to authenticated;
grant execute on function public.confirm_report to authenticated;
grant execute on function public.can_update_report to authenticated;
grant execute on function public.add_report_update to authenticated;
grant execute on function public.prepare_report_media_upload to authenticated;
grant execute on function public.complete_report_media_upload to authenticated;
grant execute on function public.submit_content_flag to authenticated;
grant execute on function public.accept_policy_version to authenticated;

-- Moderator endpoints still authenticate as the caller and enforce role
-- membership inside each security-definer function.
grant execute on function public.get_report_media_moderation_queue to authenticated;
grant execute on function public.prepare_report_media_moderation to authenticated;
grant execute on function public.get_report_moderation_queue to authenticated;
grant execute on function public.moderate_report_case to authenticated;

-- Publication finalizers and maintenance commands never belong to client
-- roles. Service-role code owns these calls.
grant execute on function public.complete_report_media_moderation to service_role;
grant execute on function public.release_report_media_moderation_claim to service_role;
grant execute on function public.expire_stale_reports to service_role;

comment on schema public is
  'API functions are deny-by-default for anon/authenticated; migrations must grant each intended RPC explicitly.';
