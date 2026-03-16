-- Persists the user's preferred roadmap layout (tree or classic list)

alter table public.profiles
  add column if not exists roadmap_view_mode text not null default 'tree';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_roadmap_view_mode_chk'
  ) then
    alter table public.profiles
      add constraint profiles_roadmap_view_mode_chk
      check (roadmap_view_mode in ('tree', 'list'));
  end if;
end $$;
