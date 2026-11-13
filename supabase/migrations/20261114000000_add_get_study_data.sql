create or replace function public.get_study_data()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
with me as (
  select auth.uid() as user_id
),
settings as (
  select
    coalesce(s.active_deck_id, 'awl') as active_deck_id,
    coalesce(s.daily_new, 10) as daily_new,
    coalesce(s.batch_size, 5) as batch_size,
    coalesce(s.backlog_cap, 30) as backlog_cap
  from me
  left join public.user_settings s on s.user_id = me.user_id
),
progress as (
  select coalesce(
    jsonb_agg(to_jsonb(p) order by p.word_id),
    '[]'::jsonb
  ) as items
  from public.word_progress p
  join me on p.user_id = me.user_id
  join settings st on p.deck_id = st.active_deck_id
),
activities as (
  select coalesce(
    jsonb_agg(to_jsonb(a) order by a.study_day desc),
    '[]'::jsonb
  ) as items
  from (
    select da.*
    from public.daily_activity da
    join me on da.user_id = me.user_id
    order by da.study_day desc
    limit 14
  ) a
)
select jsonb_build_object(
  'settings', (select to_jsonb(s) from settings s),
  'progress', (select items from progress),
  'activities', (select items from activities)
);
$$;

revoke execute on function public.get_study_data() from public;
revoke execute on function public.get_study_data() from anon;
grant execute on function public.get_study_data() to authenticated;
