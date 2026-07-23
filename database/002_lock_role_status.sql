-- Fix announcement type mismatch (UI offers 'alert', schema didn't allow it)
alter table public.announcements drop constraint if exists announcements_type_check;
alter table public.announcements add constraint announcements_type_check
  check (type in ('announcement', 'news', 'insight', 'alert'));

-- Assignment deadline: UI treats it as optional, schema required it
alter table public.assignments alter column deadline drop not null;