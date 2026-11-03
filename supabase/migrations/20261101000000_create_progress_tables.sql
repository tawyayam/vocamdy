create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  active_deck_id text not null default 'awl',
  daily_new smallint not null default 10 check (daily_new between 1 and 30),
  batch_size smallint not null default 5 check (batch_size between 3 and 10),
  backlog_cap smallint not null default 30 check (backlog_cap between 10 and 100),
  updated_at timestamptz not null default now()
);

create table public.word_progress (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  word_id text not null,
  deck_id text not null,
  stage smallint not null check (stage between 1 and 4),
  due_date date,
  introduced_on date not null,
  graduated_on date,
  correct_count integer not null default 0 check (correct_count >= 0),
  wrong_count integer not null default 0 check (wrong_count >= 0),
  last_answered_on date,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id),
  constraint word_progress_stage_dates check (
    (stage = 4 and due_date is null and graduated_on is not null)
    or (stage < 4 and due_date is not null and graduated_on is null)
  )
);

create index word_progress_due_idx
  on public.word_progress (user_id, deck_id, due_date);

create table public.daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  study_day date not null,
  answers_count integer not null default 0 check (answers_count >= 0),
  new_words_count integer not null default 0 check (new_words_count >= 0),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  completed text check (completed is null or completed in ('full', 'mini')),
  updated_at timestamptz not null default now(),
  primary key (user_id, study_day)
);

alter table public.user_settings enable row level security;
alter table public.word_progress enable row level security;
alter table public.daily_activity enable row level security;

create policy user_settings_owner_access
  on public.user_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy word_progress_owner_access
  on public.word_progress
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy daily_activity_owner_access
  on public.daily_activity
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.word_progress to authenticated;
grant select, insert, update, delete on table public.daily_activity to authenticated;
