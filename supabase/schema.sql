-- Monetta — schema Postgres para login + sincronização multi-dispositivo.
-- Instalação nova: rodar este arquivo uma vez no SQL Editor do Supabase.
-- Banco já existente: NÃO rodar este arquivo — aplicar, em ordem, os
-- arquivos de supabase/migrations/ ainda não aplicados. Este arquivo
-- reflete o estado final depois de todas as migrations.

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
  updated_at timestamptz not null default now(),
  constraint bills_id_user_id_key unique (id, user_id)
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
  updated_at timestamptz not null default now(),
  constraint investments_id_user_id_key unique (id, user_id)
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
  updated_at timestamptz not null default now(),
  constraint goals_id_user_id_key unique (id, user_id)
);

-- Ledger of deposits made toward a goal — `goals.current_amount` is kept as
-- a denormalized running total (updated atomically by add_goal_deposit /
-- delete_goal_deposit below) so existing reads of the goal row don't need to
-- sum this table; the ledger exists for history + "desfazer" (undo).
--
-- Todas as FKs entre tabelas do app são compostas (x_id, user_id): o banco
-- exige que filho e pai pertençam ao MESMO usuário. Checagens de FK
-- ignoram RLS, então uma FK simples deixaria gravar referências a dados de
-- outra conta (auditoria de segurança 2026-11-20, A-01/A-02/B-02).
create table public.goal_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null,
  goal_name text not null,
  amount numeric not null,
  date timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint goal_deposits_goal_id_user_id_fkey
    foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
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
  updated_at timestamptz not null default now(),
  constraint incomes_id_user_id_key unique (id, user_id)
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
  bill_id uuid not null,
  amount numeric not null,
  paid_at timestamptz not null,
  month int not null,
  year int not null,
  notes text,
  constraint payment_records_bill_id_user_id_fkey
    foreign key (bill_id, user_id) references public.bills (id, user_id) on delete cascade
);

-- investment_id: ON DELETE SET NULL (não cascade!) — quando um saque total
-- fecha a posição, a linha de investimento é apagada mas o saque precisa
-- sobreviver (histórico + fluxo de "desfazer saque" recriam o investimento
-- a partir dos campos denormalizados abaixo). A exclusão em massa ao apagar
-- um investimento manualmente é feita explicitamente pelo app, não pelo FK.
-- `set null (coluna)` zera só o id referenciado, nunca o user_id (PG 15+).
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid,
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
  income_entry_id uuid,
  created_at timestamptz not null default now(),
  constraint withdrawals_investment_id_user_id_fkey
    foreign key (investment_id, user_id) references public.investments (id, user_id)
    on delete set null (investment_id),
  constraint withdrawals_income_entry_id_user_id_fkey
    foreign key (income_entry_id, user_id) references public.incomes (id, user_id)
    on delete set null (income_entry_id)
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

-- ─── Validação de valores ──────────────────────────────────────────────
-- O frontend valida, mas qualquer usuário pode chamar a API direto: estas
-- regras são a validação de verdade. Valores monetários entre 0 e 1 trilhão,
-- dias/meses em faixa, enums só nos campos estáveis da lógica do app e
-- limite de tamanho nos textos. Categorias/tipos têm só limite de tamanho
-- (podem existir valores legados).
alter table public.user_profiles
  add constraint user_profiles_name_chk check (char_length(name) <= 100),
  add constraint user_profiles_monthly_income_chk check (monthly_income between 0 and 1e12),
  add constraint user_profiles_income_amount_chk check (income_amount between 0 and 1e12),
  add constraint user_profiles_income_amount_secondary_chk check (income_amount_secondary is null or income_amount_secondary between 0 and 1e12),
  add constraint user_profiles_income_frequency_chk check (income_frequency in ('daily', 'weekly', 'biweekly', 'monthly', 'variable')),
  add constraint user_profiles_work_days_chk check (work_days_per_month is null or work_days_per_month between 1 and 31),
  add constraint user_profiles_payment_day_chk check (payment_day between 1 and 31),
  add constraint user_profiles_financial_goal_chk check (char_length(financial_goal) <= 50),
  add constraint user_profiles_theme_chk check (theme in ('light', 'dark'));

alter table public.bills
  add constraint bills_name_chk check (char_length(name) <= 200),
  add constraint bills_category_chk check (char_length(category) <= 50),
  add constraint bills_amount_chk check (amount between 0 and 1e12),
  add constraint bills_due_day_chk check (due_day between 1 and 31),
  add constraint bills_priority_chk check (priority in ('high', 'medium', 'low')),
  add constraint bills_status_chk check (status in ('pending', 'paid', 'overdue')),
  add constraint bills_installment_total_chk check (installment_total is null or installment_total between 1 and 1200),
  add constraint bills_installment_paid_chk check (installment_paid is null or installment_paid between 0 and 1200),
  add constraint bills_paid_month_chk check (paid_month is null or paid_month between 1 and 12),
  add constraint bills_paid_year_chk check (paid_year is null or paid_year between 1900 and 2200),
  add constraint bills_notes_chk check (notes is null or char_length(notes) <= 2000);

alter table public.investments
  add constraint investments_name_chk check (char_length(name) <= 200),
  add constraint investments_type_chk check (char_length(type) <= 50),
  add constraint investments_platform_chk check (char_length(platform) <= 200),
  add constraint investments_amount_chk check (amount between 0 and 1e12),
  add constraint investments_quantity_chk check (quantity is null or quantity between 0 and 1e15),
  add constraint investments_coin_id_chk check (coin_id is null or char_length(coin_id) <= 100),
  add constraint investments_coin_symbol_chk check (coin_symbol is null or char_length(coin_symbol) <= 30),
  add constraint investments_notes_chk check (notes is null or char_length(notes) <= 2000);

alter table public.goals
  add constraint goals_name_chk check (char_length(name) <= 200),
  add constraint goals_description_chk check (description is null or char_length(description) <= 2000),
  add constraint goals_target_amount_chk check (target_amount between 0 and 1e12),
  add constraint goals_current_amount_chk check (current_amount between 0 and 1e12),
  add constraint goals_color_chk check (char_length(color) <= 32);

alter table public.goal_deposits
  add constraint goal_deposits_goal_name_chk check (char_length(goal_name) <= 200),
  add constraint goal_deposits_amount_chk check (amount between 0 and 1e12),
  add constraint goal_deposits_notes_chk check (notes is null or char_length(notes) <= 2000);

alter table public.incomes
  add constraint incomes_name_chk check (char_length(name) <= 200),
  add constraint incomes_category_chk check (char_length(category) <= 50),
  add constraint incomes_amount_chk check (amount between 0 and 1e12),
  add constraint incomes_month_chk check (month between 1 and 12),
  add constraint incomes_year_chk check (year between 1900 and 2200),
  add constraint incomes_notes_chk check (notes is null or char_length(notes) <= 2000);

alter table public.debit_expenses
  add constraint debit_expenses_description_chk check (char_length(description) <= 500),
  add constraint debit_expenses_amount_chk check (amount between 0 and 1e12),
  add constraint debit_expenses_category_chk check (char_length(category) <= 50);

alter table public.payment_records
  add constraint payment_records_amount_chk check (amount between 0 and 1e12),
  add constraint payment_records_month_chk check (month between 1 and 12),
  add constraint payment_records_year_chk check (year between 1900 and 2200),
  add constraint payment_records_notes_chk check (notes is null or char_length(notes) <= 2000);

alter table public.withdrawals
  add constraint withdrawals_investment_name_chk check (char_length(investment_name) <= 200),
  add constraint withdrawals_investment_type_chk check (char_length(investment_type) <= 50),
  add constraint withdrawals_investment_platform_chk check (char_length(investment_platform) <= 200),
  add constraint withdrawals_coin_id_chk check (coin_id is null or char_length(coin_id) <= 100),
  add constraint withdrawals_coin_symbol_chk check (coin_symbol is null or char_length(coin_symbol) <= 30),
  add constraint withdrawals_amount_chk check (amount between 0 and 1e12),
  add constraint withdrawals_cost_basis_chk check (cost_basis between 0 and 1e12),
  add constraint withdrawals_quantity_chk check (quantity is null or quantity between 0 and 1e15),
  add constraint withdrawals_notes_chk check (notes is null or char_length(notes) <= 2000);

-- ─── Row Level Security ────────────────────────────────────────────────
-- Cada usuário só vê/edita as próprias linhas. Uma policy só, reaproveitada
-- pra todas as tabelas. `to authenticated`: anon não tem policy nenhuma
-- (nega tudo). `(select auth.uid())`: avaliado uma vez por query, não por
-- linha (recomendação do Supabase Advisor).
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
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_owner_all', t
    );
  end loop;
end $$;

-- ─── Quotas por usuário ────────────────────────────────────────────────
-- Barra novas inserções quando o usuário atinge o teto da tabela (evita
-- abuso de armazenamento/custo via API). SECURITY INVOKER: chamada pelo
-- usuário, o RLS restringe a contagem às próprias linhas; de dentro das
-- RPCs SECURITY DEFINER, o filtro por user_id garante a mesma contagem.
create or replace function public.enforce_row_quota() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_limit int := tg_argv[0]::int;
  v_count int;
begin
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into v_count using new.user_id;
  if v_count >= v_limit then
    raise exception 'Limite de % registros atingido.', v_limit using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_row_quota() from public, anon, authenticated;

create trigger bills_row_quota before insert on public.bills
  for each row execute function public.enforce_row_quota('2000');
create trigger investments_row_quota before insert on public.investments
  for each row execute function public.enforce_row_quota('2000');
create trigger goals_row_quota before insert on public.goals
  for each row execute function public.enforce_row_quota('500');
create trigger goal_deposits_row_quota before insert on public.goal_deposits
  for each row execute function public.enforce_row_quota('20000');
create trigger incomes_row_quota before insert on public.incomes
  for each row execute function public.enforce_row_quota('20000');
create trigger withdrawals_row_quota before insert on public.withdrawals
  for each row execute function public.enforce_row_quota('20000');
create trigger payment_records_row_quota before insert on public.payment_records
  for each row execute function public.enforce_row_quota('50000');
create trigger debit_expenses_row_quota before insert on public.debit_expenses
  for each row execute function public.enforce_row_quota('50000');

-- ─── RPCs transacionais (saques) ───────────────────────────────────────
-- Espelham addWithdrawal/deleteWithdrawal de src/database/queries.ts:
-- proração do custo de aquisição, fechamento/reabertura da posição e
-- criação/remoção do income associado — tudo numa transação atômica do
-- Postgres em vez de múltiplos round-trips do client.
--
-- Todas as RPCs são SECURITY DEFINER (ignoram RLS): por isso TODA instrução
-- filtra por user_id = auth.uid(), e os parâmetros são validados aqui (as
-- mesmas regras do WithdrawalForm / GoalDepositForm, impostas no servidor).

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
  v_quantity numeric;
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

  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor do saque inválido' using errcode = 'check_violation';
  end if;
  if p_quantity is not null and p_quantity <= 0 then
    raise exception 'Quantidade do saque inválida' using errcode = 'check_violation';
  end if;
  if p_date is null then
    raise exception 'Data do saque inválida' using errcode = 'check_violation';
  end if;

  select * into v_investment from investments
    where id = p_investment_id and user_id = v_user_id;
  if not found then
    raise exception 'Investimento não encontrado';
  end if;

  v_is_crypto := v_investment.quantity is not null and p_quantity is not null;

  if v_is_crypto then
    if p_quantity > v_investment.quantity * 1.001 + 0.00000001 then
      raise exception 'Quantidade maior que a disponível' using errcode = 'check_violation';
    end if;
    v_quantity := least(p_quantity, v_investment.quantity);
    v_sold_ratio := case when v_investment.quantity > 0
      then v_quantity / v_investment.quantity else 1 end;
    v_cost_basis := v_investment.amount * v_sold_ratio;
    v_remaining_amount := greatest(0, v_investment.amount - v_cost_basis);
    v_remaining_quantity := greatest(0, v_investment.quantity - v_quantity);
  else
    if p_amount > v_investment.amount * 1.001 + 0.01 then
      raise exception 'Valor maior que o disponível' using errcode = 'check_violation';
    end if;
    v_quantity := p_quantity;
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
    v_investment.coin_id, v_investment.coin_symbol, p_amount, v_cost_basis, v_quantity, p_date, p_notes, v_income_id
  )
  returning id into v_withdrawal_id;

  if v_is_full then
    delete from investments where id = p_investment_id and user_id = v_user_id;
  else
    update investments set amount = v_remaining_amount, quantity = v_remaining_quantity, updated_at = now()
      where id = p_investment_id and user_id = v_user_id;
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

  -- Every statement below re-checks user_id: this function is SECURITY
  -- DEFINER (bypasses RLS) and the ids stored on the withdrawal row are
  -- client-writable, so they may point at another account's rows.
  if v_withdrawal.income_entry_id is not null then
    delete from incomes
      where id = v_withdrawal.income_entry_id and user_id = v_user_id;
  end if;

  if v_withdrawal.investment_id is not null then
    select amount, quantity into v_inv_amount, v_inv_quantity
      from investments
      where id = v_withdrawal.investment_id and user_id = v_user_id;
    v_investment_exists := found;
  end if;

  if v_investment_exists then
    update investments set
      amount = v_inv_amount + v_withdrawal.cost_basis,
      quantity = case when v_inv_quantity is not null
        then v_inv_quantity + coalesce(v_withdrawal.quantity, 0) else v_inv_quantity end,
      updated_at = now()
    where id = v_withdrawal.investment_id and user_id = v_user_id;
  else
    insert into investments (
      user_id, name, type, platform, amount, quantity, coin_id, coin_symbol, date, created_at, updated_at
    ) values (
      v_user_id, v_withdrawal.investment_name, v_withdrawal.investment_type, v_withdrawal.investment_platform,
      v_withdrawal.cost_basis, v_withdrawal.quantity, v_withdrawal.coin_id, v_withdrawal.coin_symbol,
      v_withdrawal.date, v_withdrawal.created_at, now()
    );
  end if;

  delete from withdrawals where id = p_withdrawal_id and user_id = v_user_id;
end;
$$;

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

  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor do aporte inválido' using errcode = 'check_violation';
  end if;
  if p_date is null then
    raise exception 'Data do aporte inválida' using errcode = 'check_violation';
  end if;

  select * into v_goal from goals where id = p_goal_id and user_id = v_user_id;
  if not found then
    raise exception 'Meta não encontrada';
  end if;

  insert into goal_deposits (user_id, goal_id, goal_name, amount, date, notes)
  values (v_user_id, p_goal_id, v_goal.name, p_amount, p_date, p_notes)
  returning id into v_deposit_id;

  update goals set current_amount = current_amount + p_amount, updated_at = now()
    where id = p_goal_id and user_id = v_user_id;

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

  -- goal_id on the deposit row is client-writable: re-check ownership here
  -- since SECURITY DEFINER bypasses RLS.
  update goals set current_amount = greatest(0, current_amount - v_deposit.amount), updated_at = now()
    where id = v_deposit.goal_id and user_id = v_user_id;

  delete from goal_deposits where id = p_deposit_id and user_id = v_user_id;
end;
$$;

-- `revoke ... from public` não basta no Supabase: os default privileges do
-- schema public dão EXECUTE explícito ao `anon` em toda função nova.
revoke all on function public.add_withdrawal from public, anon;
revoke all on function public.delete_withdrawal from public, anon;
revoke all on function public.add_goal_deposit from public, anon;
revoke all on function public.delete_goal_deposit from public, anon;
grant execute on function public.add_withdrawal to authenticated;
grant execute on function public.delete_withdrawal to authenticated;
grant execute on function public.add_goal_deposit to authenticated;
grant execute on function public.delete_goal_deposit to authenticated;
