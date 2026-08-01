-- Monetta — schema Postgres para login + sincronização multi-dispositivo.
-- Rodar uma vez no SQL Editor do Supabase (projeto já usado pela fila do WhatsApp).

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  monthly_income numeric not null,
  income_frequency text not null,
  income_amount numeric not null,
  income_amount_secondary numeric,
  work_days_per_month int,
  payment_day int not null,
  financial_goal text not null,
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric not null,
  due_day int not null,
  priority text not null,
  is_recurring boolean not null default false,
  is_installment boolean not null default false,
  installment_total int,
  installment_paid int,
  notes text,
  status text not null default 'pending',
  paid_at timestamptz,
  paid_month int,
  paid_year int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  platform text not null,
  amount numeric not null,
  quantity numeric,
  coin_id text,
  coin_symbol text,
  date timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  deadline timestamptz,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ledger of deposits made toward a goal — `goals.current_amount` is kept as
-- a denormalized running total (updated atomically by add_goal_deposit /
-- delete_goal_deposit below) so existing reads of the goal row don't need to
-- sum this table; the ledger exists for history + "desfazer" (undo).
create table public.goal_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  goal_name text not null,
  amount numeric not null,
  date timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric not null,
  month int not null,
  year int not null,
  is_recurring boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.debit_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric not null,
  category text not null,
  date timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  amount numeric not null,
  paid_at timestamptz not null,
  month int not null,
  year int not null,
  notes text
);

-- investment_id: ON DELETE SET NULL (não cascade!) — quando um saque total
-- fecha a posição, a linha de investimento é apagada mas o saque precisa
-- sobreviver (histórico + fluxo de "desfazer saque" recriam o investimento
-- a partir dos campos denormalizados abaixo). A exclusão em massa ao apagar
-- um investimento manualmente é feita explicitamente pelo app, não pelo FK.
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid references public.investments(id) on delete set null,
  investment_name text not null,
  investment_type text not null,
  investment_platform text not null,
  coin_id text,
  coin_symbol text,
  amount numeric not null,
  cost_basis numeric not null,
  quantity numeric,
  date timestamptz not null,
  notes text,
  income_entry_id uuid references public.incomes(id) on delete set null,
  created_at timestamptz not null default now()
);

create index bills_user_id_idx on public.bills(user_id);
create index investments_user_id_idx on public.investments(user_id);
create index goals_user_id_idx on public.goals(user_id);
create index goal_deposits_user_id_idx on public.goal_deposits(user_id);
create index goal_deposits_goal_id_idx on public.goal_deposits(goal_id);
create index incomes_user_id_idx on public.incomes(user_id);
create index debit_expenses_user_id_idx on public.debit_expenses(user_id);
create index payment_records_user_id_idx on public.payment_records(user_id);
create index withdrawals_user_id_idx on public.withdrawals(user_id);
create index withdrawals_investment_id_idx on public.withdrawals(investment_id);

-- ─── Row Level Security ────────────────────────────────────────────────
-- Cada usuário só vê/edita as próprias linhas. Uma policy só, reaproveitada
-- pra todas as tabelas.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_profiles', 'bills', 'investments', 'goals', 'goal_deposits',
    'incomes', 'debit_expenses', 'payment_records', 'withdrawals'
  ]) loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s_owner_all" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t
    );
  end loop;
end $$;

-- ─── RPCs transacionais (saques) ───────────────────────────────────────
-- Espelham addWithdrawal/deleteWithdrawal de src/database/queries.ts:
-- proração do custo de aquisição, fechamento/reabertura da posição e
-- criação/remoção do income associado — tudo numa transação atômica do
-- Postgres em vez de múltiplos round-trips do client.

create or replace function public.add_withdrawal(
  p_investment_id uuid,
  p_amount numeric,
  p_quantity numeric,
  p_date timestamptz,
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investment record;
  v_user_id uuid := auth.uid();
  v_is_crypto boolean;
  v_sold_ratio numeric;
  v_cost_basis numeric;
  v_remaining_amount numeric;
  v_remaining_quantity numeric;
  v_is_full boolean;
  v_income_id uuid;
  v_withdrawal_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_investment from investments
    where id = p_investment_id and user_id = v_user_id;
  if not found then
    raise exception 'Investimento não encontrado';
  end if;

  v_is_crypto := v_investment.quantity is not null and p_quantity is not null;

  if v_is_crypto then
    v_sold_ratio := case when v_investment.quantity > 0
      then least(1, p_quantity / v_investment.quantity) else 1 end;
    v_cost_basis := v_investment.amount * v_sold_ratio;
    v_remaining_amount := greatest(0, v_investment.amount - v_cost_basis);
    v_remaining_quantity := greatest(0, v_investment.quantity - p_quantity);
  else
    v_cost_basis := least(p_amount, v_investment.amount);
    v_remaining_amount := greatest(0, v_investment.amount - v_cost_basis);
    v_remaining_quantity := v_investment.quantity;
  end if;

  v_is_full := v_remaining_amount <= 0.005
    or (v_remaining_quantity is not null and v_remaining_quantity <= 0.00000001);

  insert into incomes (user_id, name, category, amount, month, year, is_recurring)
  values (
    v_user_id, 'Saque: ' || v_investment.name, 'investment_withdrawal', p_amount,
    extract(month from p_date)::int, extract(year from p_date)::int, false
  )
  returning id into v_income_id;

  insert into withdrawals (
    user_id, investment_id, investment_name, investment_type, investment_platform,
    coin_id, coin_symbol, amount, cost_basis, quantity, date, notes, income_entry_id
  ) values (
    v_user_id, p_investment_id, v_investment.name, v_investment.type, v_investment.platform,
    v_investment.coin_id, v_investment.coin_symbol, p_amount, v_cost_basis, p_quantity, p_date, p_notes, v_income_id
  )
  returning id into v_withdrawal_id;

  if v_is_full then
    delete from investments where id = p_investment_id;
  else
    update investments set amount = v_remaining_amount, quantity = v_remaining_quantity, updated_at = now()
      where id = p_investment_id;
  end if;

  return v_withdrawal_id;
end;
$$;

create or replace function public.delete_withdrawal(p_withdrawal_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_withdrawal record;
  v_investment_exists boolean := false;
  v_inv_amount numeric;
  v_inv_quantity numeric;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_withdrawal from withdrawals
    where id = p_withdrawal_id and user_id = v_user_id;
  if not found then
    return;
  end if;

  if v_withdrawal.income_entry_id is not null then
    delete from incomes where id = v_withdrawal.income_entry_id;
  end if;

  if v_withdrawal.investment_id is not null then
    select amount, quantity into v_inv_amount, v_inv_quantity
      from investments where id = v_withdrawal.investment_id;
    v_investment_exists := found;
  end if;

  if v_investment_exists then
    update investments set
      amount = v_inv_amount + v_withdrawal.cost_basis,
      quantity = case when v_inv_quantity is not null
        then v_inv_quantity + coalesce(v_withdrawal.quantity, 0) else v_inv_quantity end,
      updated_at = now()
    where id = v_withdrawal.investment_id;
  else
    insert into investments (
      user_id, name, type, platform, amount, quantity, coin_id, coin_symbol, date, created_at, updated_at
    ) values (
      v_user_id, v_withdrawal.investment_name, v_withdrawal.investment_type, v_withdrawal.investment_platform,
      v_withdrawal.cost_basis, v_withdrawal.quantity, v_withdrawal.coin_id, v_withdrawal.coin_symbol,
      v_withdrawal.date, v_withdrawal.created_at, now()
    );
  end if;

  delete from withdrawals where id = p_withdrawal_id;
end;
$$;

revoke all on function public.add_withdrawal from public;
revoke all on function public.delete_withdrawal from public;
grant execute on function public.add_withdrawal to authenticated;
grant execute on function public.delete_withdrawal to authenticated;

-- ─── RPCs transacionais (aportes em metas) ─────────────────────────────
-- Mesma ideia dos saques de investimento: manter o `current_amount` da meta
-- e o registro no ledger `goal_deposits` em sincronia numa única transação.

create or replace function public.add_goal_deposit(
  p_goal_id uuid,
  p_amount numeric,
  p_date timestamptz,
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_goal record;
  v_deposit_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_goal from goals where id = p_goal_id and user_id = v_user_id;
  if not found then
    raise exception 'Meta não encontrada';
  end if;

  insert into goal_deposits (user_id, goal_id, goal_name, amount, date, notes)
  values (v_user_id, p_goal_id, v_goal.name, p_amount, p_date, p_notes)
  returning id into v_deposit_id;

  update goals set current_amount = current_amount + p_amount, updated_at = now()
    where id = p_goal_id;

  return v_deposit_id;
end;
$$;

create or replace function public.delete_goal_deposit(p_deposit_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deposit record;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_deposit from goal_deposits
    where id = p_deposit_id and user_id = v_user_id;
  if not found then
    return;
  end if;

  update goals set current_amount = greatest(0, current_amount - v_deposit.amount), updated_at = now()
    where id = v_deposit.goal_id;

  delete from goal_deposits where id = p_deposit_id;
end;
$$;

revoke all on function public.add_goal_deposit from public;
revoke all on function public.delete_goal_deposit from public;
grant execute on function public.add_goal_deposit to authenticated;
grant execute on function public.delete_goal_deposit to authenticated;
