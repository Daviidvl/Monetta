-- Correção M-03, parte 2 (auditoria de segurança 2026-11-20)
--
-- add_withdrawal e add_goal_deposit não validavam os parâmetros: p_quantity
-- negativo INFLAVA o investimento (100/1 → 600/6), p_amount negativo
-- deixava metas negativas, quantidades acima do saldo ficavam gravadas no
-- saque e voltavam inteiras no "desfazer".
--
-- Regras (as mesmas que o WithdrawalForm / GoalDepositForm já aplicam no
-- browser, agora impostas no servidor):
--   * valor > 0; quantidade, se informada, > 0; data obrigatória;
--   * cripto: quantidade até o saldo (+0,1% + 1e-8 de tolerância de
--     arredondamento, igual ao form) e gravada já limitada ao saldo;
--   * demais: valor até o valor investido (+0,1% + 0,01, igual ao form).
-- Todas as escritas também passam a filtrar por user_id (defesa em
-- profundidade; a posse já era verificada na leitura inicial).

begin;

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

commit;
