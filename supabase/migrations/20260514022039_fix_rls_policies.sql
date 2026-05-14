-- Fix RLS policies: add WITH CHECK clauses and expiry validation

-- invite_links SELECT — add expires_at > now() check
drop policy if exists "space members can read invite links" on public.invite_links;
create policy "space members can read valid invite links"
  on public.invite_links for select
  using (
    exists (
      select 1 from public.space_members
      where space_id = invite_links.space_id
        and user_id = (select auth.uid())
    )
    and (expires_at is null or expires_at > now())
  );

-- invite_links INSERT — only members can create, must set expires_at
drop policy if exists "space members can create invite links" on public.invite_links;
create policy "space members can create invite links"
  on public.invite_links for insert
  with check (
    exists (
      select 1 from public.space_members
      where space_id = invite_links.space_id
        and user_id = (select auth.uid())
    )
    and created_by = (select auth.uid())
    and expires_at is not null
  );

-- profiles INSERT — add with check (prevent inserting for other users)
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  with check (id = (select auth.uid()));

-- space_members INSERT — add with check (can only insert yourself)
drop policy if exists "members can insert themselves" on public.space_members;
create policy "members can insert themselves"
  on public.space_members for insert
  with check (user_id = (select auth.uid()));

-- task_completions INSERT — add with check (must be member + own completion)
drop policy if exists "space members can insert completions" on public.task_completions;
create policy "space members can insert completions"
  on public.task_completions for insert
  with check (
    exists (
      select 1 from public.space_members
      where space_id = task_completions.space_id
        and user_id = (select auth.uid())
    )
    and completed_by = (select auth.uid())
  );

-- tasks INSERT — add with check (must be member of the space)
drop policy if exists "space members can create tasks" on public.tasks;
create policy "space members can create tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.space_members
      where space_id = tasks.space_id
        and user_id = (select auth.uid())
    )
  );
