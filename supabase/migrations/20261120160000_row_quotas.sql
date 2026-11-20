-- Correção M-03, parte 3 (auditoria de segurança 2026-11-20)
--
-- Sem limite de linhas por usuário, uma única conta podia inserir milhões
-- de registros pela API (abuso de armazenamento/custo do banco). Este
-- trigger barra novas inserções quando o usuário atinge o teto da tabela.
--
-- Os limites são generosos (uso real fica muito abaixo):
--   bills 2.000 · investments 2.000 · goals 500 · goal_deposits 20.000
--   incomes 20.000 · withdrawals 20.000 · payment_records 50.000
--   debit_expenses 50.000   (user_profiles já é 1 por usuário via unique)
--
-- A função é SECURITY INVOKER: chamada pelo usuário, o RLS restringe a
-- contagem às próprias linhas; chamada de dentro das RPCs SECURITY DEFINER,
-- o filtro explícito por user_id garante a mesma contagem.

begin;

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

commit;
