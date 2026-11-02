-- Keep the admin check out of the public REST API (/rest/v1/rpc/is_admin):
-- policies call it from a private schema that PostgREST does not expose.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_admin() returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter policy "menu: admins insert" on public.menu_items with check ((select private.is_admin()));
alter policy "menu: admins update" on public.menu_items using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "menu: admins delete" on public.menu_items using ((select private.is_admin()));

drop function public.is_admin();
