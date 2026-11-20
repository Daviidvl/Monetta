-- Correção A-01 + A-02 (auditoria de segurança 2026-11-20)
--
-- delete_withdrawal e delete_goal_deposit são SECURITY DEFINER (ignoram RLS).
-- Ambas validavam apenas o dono da linha de withdrawals/goal_deposits, mas
-- depois liam/alteravam/apagavam linhas de investments, incomes e goals
-- usando IDs guardados nessa linha — IDs que o próprio utilizador pode
-- escrever via PostgREST, apontando para dados de outra conta.
--
-- Correção: toda instrução dentro das funções passa a filtrar também por
-- user_id = auth.uid(). `create or replace` preserva dono e GRANTs atuais.

begin;

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
    where id = v_deposit.goal_id and user_id = v_user_id;

  delete from goal_deposits where id = p_deposit_id and user_id = v_user_id;
end;
$$;

commit;
