-- 在现有 Supabase 项目的 SQL Editor 执行一次。
-- 不包含数据库密码或密钥；不删除任何现有表或数据。
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists axue_private;
revoke all on schema axue_private from public,anon,authenticated;
grant usage on schema axue_private to authenticated;

create table if not exists axue_private.workbench_owners (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table axue_private.workbench_owners enable row level security;
revoke all on axue_private.workbench_owners from public,anon,authenticated;

create table if not exists public.axue_wb_state (
 id text primary key check (id='main'),
 payload jsonb not null default '{"tasks":[],"weddingDate":""}'::jsonb,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists public.axue_wb_shares (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique,
 created_at timestamptz not null default now(),
 revoked boolean not null default false
);
alter table public.axue_wb_state enable row level security;
alter table public.axue_wb_shares enable row level security;
revoke all on public.axue_wb_state,public.axue_wb_shares from public,anon,authenticated;
-- 无直接数据访问策略；只允许以下显式检查权限的函数访问。

create or replace function axue_private.is_owner() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from axue_private.workbench_owners where user_id=auth.uid());
$$;
revoke all on function axue_private.is_owner() from public,anon,authenticated;
grant execute on function axue_private.is_owner() to authenticated;

create or replace function public.axue_wb_read(p_token text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare role_name text; result public.axue_wb_state%rowtype;
begin
 if p_token is not null then
   if p_token !~ '^[a-f0-9]{64}$' or not exists (
     select 1 from public.axue_wb_shares where not revoked
     and token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
   ) then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
   role_name:='viewer';
 elsif axue_private.is_owner() then role_name:='owner';
 else raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 select * into result from public.axue_wb_state where id='main';
 return jsonb_build_object('role',role_name,'revision',coalesce(result.revision,0),
   'updatedAt',result.updated_at,'state',coalesce(result.payload,'{"tasks":[],"weddingDate":""}'::jsonb));
end;$$;

create or replace function public.axue_wb_write(p_state jsonb,p_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare new_revision bigint; new_time timestamptz;
begin
 if not axue_private.is_owner() then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 if p_state is null or jsonb_typeof(p_state) is distinct from 'object'
 or jsonb_typeof(p_state->'tasks') is distinct from 'array' or p_revision is null or p_revision<0
 then raise exception 'INVALID_STATE' using errcode='22023'; end if;
 if jsonb_array_length(p_state->'tasks')>10000 or octet_length(p_state::text)>4000000
 then raise exception 'INVALID_STATE' using errcode='22023'; end if;
 if exists(select 1 from jsonb_array_elements(p_state->'tasks') t
   where jsonb_typeof(t) is distinct from 'object' or jsonb_typeof(t->'title') is distinct from 'string'
   or length(btrim(t->>'title'))=0 or t->>'status' is null or t->>'status' not in ('todo','doing','done')
   or coalesce(t->>'id','')='') then raise exception 'INVALID_TASK' using errcode='22023'; end if;
 if (select count(*) from jsonb_array_elements(p_state->'tasks')) <>
    (select count(distinct t->>'id') from jsonb_array_elements(p_state->'tasks') t)
 then raise exception 'DUPLICATE_ID' using errcode='22023'; end if;
 insert into public.axue_wb_state(id) values('main') on conflict(id) do nothing;
 update public.axue_wb_state set payload=p_state,revision=revision+1,updated_at=clock_timestamp()
 where id='main' and revision=p_revision returning revision,updated_at into new_revision,new_time;
 if not found then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
 return jsonb_build_object('revision',new_revision,'updatedAt',new_time);
end;$$;

create or replace function public.axue_wb_share_create() returns jsonb
language plpgsql security definer set search_path='' as $$
declare plain_token text; item public.axue_wb_shares%rowtype;
begin
 if not axue_private.is_owner() then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 plain_token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.axue_wb_shares(token_hash) values(encode(extensions.digest(plain_token,'sha256'),'hex')) returning * into item;
 return jsonb_build_object('id',item.id,'token',plain_token,'createdAt',item.created_at);
end;$$;
create or replace function public.axue_wb_share_list() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not axue_private.is_owner() then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'created_at',created_at) order by created_at desc)
 from public.axue_wb_shares where not revoked),'[]'::jsonb);
end;$$;
create or replace function public.axue_wb_share_revoke(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not axue_private.is_owner() then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 update public.axue_wb_shares set revoked=true where id=p_id;
 return '{"ok":true}'::jsonb;
end;$$;
revoke all on function public.axue_wb_read(text) from public,anon,authenticated;
revoke all on function public.axue_wb_write(jsonb,bigint) from public,anon,authenticated;
revoke all on function public.axue_wb_share_create() from public,anon,authenticated;
revoke all on function public.axue_wb_share_list() from public,anon,authenticated;
revoke all on function public.axue_wb_share_revoke(uuid) from public,anon,authenticated;
grant execute on function public.axue_wb_read(text) to anon,authenticated;
grant execute on function public.axue_wb_write(jsonb,bigint) to authenticated;
grant execute on function public.axue_wb_share_create() to authenticated;
grant execute on function public.axue_wb_share_list() to authenticated;
grant execute on function public.axue_wb_share_revoke(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
