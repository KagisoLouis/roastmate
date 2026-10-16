-- Run in Supabase SQL Editor. All payment and quota writes are server-only.
create table if not exists public.subscriptions(user_id uuid primary key references auth.users(id) on delete cascade,id text unique not null,status text not null,access_until timestamptz,updated_at timestamptz not null,test_mode boolean not null);
create table if not exists public.payment_events(hash text primary key,received_at timestamptz not null default now());
create table if not exists public.roast_usage(user_id uuid references auth.users(id) on delete cascade,period text not null,used integer not null default 0 check(used>=0),last_request timestamptz,primary key(user_id,period));
create table if not exists public.global_roast_usage(period text primary key,used integer not null default 0 check(used>=0));
create table if not exists public.roast_requests(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,period text not null,refunded boolean not null default false);
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.roast_usage enable row level security;
alter table public.global_roast_usage enable row level security;
alter table public.roast_requests enable row level security;
revoke all on public.subscriptions,public.payment_events,public.roast_usage,public.global_roast_usage,public.roast_requests from anon,authenticated;
grant all on public.subscriptions,public.payment_events,public.roast_usage,public.global_roast_usage,public.roast_requests to service_role;
create or replace function public.apply_subscription(p_hash text,p_user uuid,p_id text,p_status text,p_until timestamptz,p_updated timestamptz,p_test boolean) returns void language plpgsql security definer set search_path=public as $$
begin
 insert into payment_events(hash) values(p_hash) on conflict do nothing;
 if not found then return;end if;
 insert into subscriptions(user_id,id,status,access_until,updated_at,test_mode) values(p_user,p_id,p_status,p_until,p_updated,p_test)
 on conflict(user_id) do update set id=excluded.id,status=excluded.status,access_until=excluded.access_until,updated_at=excluded.updated_at,test_mode=excluded.test_mode where excluded.updated_at>=subscriptions.updated_at;
end;$$;
create or replace function public.reserve_roast(p_user uuid,p_period text,p_id uuid,p_global_limit integer,p_test boolean) returns jsonb language plpgsql security definer set search_path=public as $$
declare n integer;g integer;last_at timestamptz;
begin
 perform pg_advisory_xact_lock(715031);
 if not exists(select 1 from subscriptions where user_id=p_user and status in('active','cancelled') and access_until>now() and test_mode=p_test) then return jsonb_build_object('ok',false,'reason','A paid subscription is required');end if;
 if exists(select 1 from roast_requests where id=p_id) then return jsonb_build_object('ok',false,'reason','Request already processed');end if;
 insert into roast_usage(user_id,period) values(p_user,p_period) on conflict do nothing;
 insert into global_roast_usage(period) values(p_period) on conflict do nothing;
 select used,last_request into n,last_at from roast_usage where user_id=p_user and period=p_period;
 select used into g from global_roast_usage where period=p_period;
 if n>=200 then return jsonb_build_object('ok',false,'reason','Your 200-roast calendar-month allowance is used');end if;
 if g>=p_global_limit then return jsonb_build_object('ok',false,'reason','Site AI allowance reached; stored jokes remain available');end if;
 if last_at>now()-interval '4 seconds' then return jsonb_build_object('ok',false,'reason','Please wait a few seconds');end if;
 insert into roast_requests(id,user_id,period) values(p_id,p_user,p_period);
 update roast_usage set used=used+1,last_request=now() where user_id=p_user and period=p_period;
 update global_roast_usage set used=used+1 where period=p_period;
 return jsonb_build_object('ok',true);
end;$$;
create or replace function public.refund_roast(p_user uuid,p_period text,p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(715031);
 update roast_requests set refunded=true where id=p_id and user_id=p_user and period=p_period and not refunded;
 if not found then return;end if;
 update roast_usage set used=greatest(0,used-1) where user_id=p_user and period=p_period;
 update global_roast_usage set used=greatest(0,used-1) where period=p_period;
end;$$;
revoke all on function public.apply_subscription(text,uuid,text,text,timestamptz,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.reserve_roast(uuid,text,uuid,integer,boolean) from public,anon,authenticated;
revoke all on function public.refund_roast(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.apply_subscription(text,uuid,text,text,timestamptz,timestamptz,boolean) to service_role;
grant execute on function public.reserve_roast(uuid,text,uuid,integer,boolean) to service_role;
grant execute on function public.refund_roast(uuid,text,uuid) to service_role;

-- Free game quota and member game history. UTC day; first move reserves a game.
create table if not exists public.player_games(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,test_mode boolean not null,day date not null default (now() at time zone 'UTC')::date,pgn text not null default '',finished boolean not null default false,analysis jsonb,updated_at timestamptz not null default now());
create index if not exists player_games_owner_day on public.player_games(user_id,day);
alter table public.player_games enable row level security;
revoke all on public.player_games from anon,authenticated;
grant all on public.player_games to service_role;
create or replace function public.start_player_game(p_user uuid,p_id uuid,p_test boolean) returns jsonb language plpgsql security definer set search_path=public as $$
declare n integer;is_paid boolean;existing_owner uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select user_id into existing_owner from player_games where id=p_id;
 if exists(select 1 from player_games where id=p_id and (finished or test_mode<>p_test)) then return jsonb_build_object('ok',false,'reason','Start a new game');end if;
 if existing_owner is not null then
 if existing_owner<>p_user then return jsonb_build_object('ok',false,'reason','Game ID already used');end if;
 return jsonb_build_object('ok',true,'resumed',true);
 end if;
 select exists(select 1 from subscriptions where user_id=p_user and status in('active','cancelled') and access_until>now() and test_mode=p_test) into is_paid;
 select count(*) into n from player_games where user_id=p_user and test_mode=p_test and day=(now() at time zone 'UTC')::date;
 if not is_paid and n>=3 then return jsonb_build_object('ok',false,'reason','Your 3 free games are used. Return after midnight UTC or upgrade for unlimited games.');end if;
 insert into player_games(id,user_id,test_mode) values(p_id,p_user,p_test);
 return jsonb_build_object('ok',true,'paid',is_paid,'used',n+1,'remaining',case when is_paid then null else greatest(0,2-n) end);
end;$$;
revoke all on function public.start_player_game(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.start_player_game(uuid,uuid,boolean) to service_role;
