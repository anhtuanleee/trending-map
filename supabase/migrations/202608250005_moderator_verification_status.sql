alter type public.verification_status add value if not exists 'moderator_verified' after 'community_verified';

comment on type public.verification_status is
  'Public verification provenance: community, moderator, or official source remain distinct.';
