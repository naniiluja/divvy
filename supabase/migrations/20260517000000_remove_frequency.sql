-- Remove frequency column from tasks table
alter table public.tasks drop column if exists frequency;

drop function if exists public.get_overdue_tasks();

create or replace function public.get_overdue_tasks()
returns table(id uuid, space_id uuid, name text, icon text)
language sql security definer
as $$
  select t.id, t.space_id, t.name, t.icon
  from public.tasks t
  where t.is_active = true
    and not exists (
      select 1 from public.task_completions tc
      where tc.task_id = t.id
        and tc.is_skipped = false
        and tc.completed_at >= (
          date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh')
          at time zone 'Asia/Ho_Chi_Minh'
        )
    );
$$;
