-- Phase 5b: Push Notifications Infrastructure
-- Enable required extensions
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema cron;

-- Store Supabase URL in vault for trigger use
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'SUPABASE_URL') then
    perform vault.create_secret(
      'https://lajdwhpvnrrwuhbdxtkn.supabase.co',
      'SUPABASE_URL',
      'Supabase project URL for Edge Function calls'
    );
  end if;
end $$;

-- Helper: overdue daily tasks with no completion today (Vietnam time)
create or replace function public.get_overdue_tasks()
returns table(id uuid, space_id uuid, name text, icon text, frequency text)
language sql security definer
as $$
  select t.id, t.space_id, t.name, t.icon, t.frequency
  from public.tasks t
  where t.is_active = true
    and t.frequency = 'daily'
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

-- Trigger function: fire notify-task-completion Edge Function after INSERT
create or replace function public.trigger_notify_task_completion()
returns trigger language plpgsql security definer as $$
declare
  _service_key text;
  _url text;
begin
  select decrypted_secret into _service_key
  from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY' limit 1;

  select decrypted_secret || '/functions/v1/notify-task-completion'
  into _url
  from vault.decrypted_secrets where name = 'SUPABASE_URL' limit 1;

  if _service_key is null or _url is null then
    return NEW;
  end if;

  perform net.http_post(
    url := _url,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'task_completions',
      'record', row_to_json(NEW)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    )
  );

  return NEW;
end;
$$;

-- Attach trigger to task_completions
drop trigger if exists on_task_completion_insert on public.task_completions;
create trigger on_task_completion_insert
  after insert on public.task_completions
  for each row execute function public.trigger_notify_task_completion();

-- pg_cron: notify overdue tasks daily at 21:00 ICT (14:00 UTC)
select cron.schedule(
  'notify-overdue-tasks',
  '0 14 * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'SUPABASE_URL' limit 1
      ) || '/functions/v1/notify-overdue-tasks',
      body := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'SUPABASE_SERVICE_ROLE_KEY' limit 1
        )
      )
    );
  $$
);
