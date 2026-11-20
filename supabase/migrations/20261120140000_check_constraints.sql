-- Correção M-03, parte 1 (auditoria de segurança 2026-11-20)
--
-- Nenhuma tabela validava valores: o PostgREST aceitava amount negativo,
-- due_day = 99, month = 13, textos de 100k+ caracteres etc. O frontend
-- valida, mas qualquer usuário pode chamar a API direto.
--
-- Regras: valores monetários entre 0 e 1 trilhão, dias/meses em faixa,
-- enums só nos campos estáveis da lógica do app (status, priority, theme,
-- frequência) e limite de tamanho nos textos. Categorias/tipos recebem só
-- limite de tamanho, para não quebrar linhas com valores legados.
--
-- As constraints entram como NOT VALID (valem para toda escrita nova) e
-- depois tentamos validar as linhas existentes: se alguma linha antiga
-- violar, a constraint continua ativa para escritas novas e um NOTICE
-- avisa qual delas ficou pendente de validação.

begin;

-- user_profiles
alter table public.user_profiles
  add constraint user_profiles_name_chk check (char_length(name) <= 100) not valid,
  add constraint user_profiles_monthly_income_chk check (monthly_income between 0 and 1e12) not valid,
  add constraint user_profiles_income_amount_chk check (income_amount between 0 and 1e12) not valid,
  add constraint user_profiles_income_amount_secondary_chk check (income_amount_secondary is null or income_amount_secondary between 0 and 1e12) not valid,
  add constraint user_profiles_income_frequency_chk check (income_frequency in ('daily', 'weekly', 'biweekly', 'monthly', 'variable')) not valid,
  add constraint user_profiles_work_days_chk check (work_days_per_month is null or work_days_per_month between 1 and 31) not valid,
  add constraint user_profiles_payment_day_chk check (payment_day between 1 and 31) not valid,
  add constraint user_profiles_financial_goal_chk check (char_length(financial_goal) <= 50) not valid,
  add constraint user_profiles_theme_chk check (theme in ('light', 'dark')) not valid;

-- bills
alter table public.bills
  add constraint bills_name_chk check (char_length(name) <= 200) not valid,
  add constraint bills_category_chk check (char_length(category) <= 50) not valid,
  add constraint bills_amount_chk check (amount between 0 and 1e12) not valid,
  add constraint bills_due_day_chk check (due_day between 1 and 31) not valid,
  add constraint bills_priority_chk check (priority in ('high', 'medium', 'low')) not valid,
  add constraint bills_status_chk check (status in ('pending', 'paid', 'overdue')) not valid,
  add constraint bills_installment_total_chk check (installment_total is null or installment_total between 1 and 1200) not valid,
  add constraint bills_installment_paid_chk check (installment_paid is null or installment_paid between 0 and 1200) not valid,
  add constraint bills_paid_month_chk check (paid_month is null or paid_month between 1 and 12) not valid,
  add constraint bills_paid_year_chk check (paid_year is null or paid_year between 1900 and 2200) not valid,
  add constraint bills_notes_chk check (notes is null or char_length(notes) <= 2000) not valid;

-- investments
alter table public.investments
  add constraint investments_name_chk check (char_length(name) <= 200) not valid,
  add constraint investments_type_chk check (char_length(type) <= 50) not valid,
  add constraint investments_platform_chk check (char_length(platform) <= 200) not valid,
  add constraint investments_amount_chk check (amount between 0 and 1e12) not valid,
  add constraint investments_quantity_chk check (quantity is null or quantity between 0 and 1e15) not valid,
  add constraint investments_coin_id_chk check (coin_id is null or char_length(coin_id) <= 100) not valid,
  add constraint investments_coin_symbol_chk check (coin_symbol is null or char_length(coin_symbol) <= 30) not valid,
  add constraint investments_notes_chk check (notes is null or char_length(notes) <= 2000) not valid;

-- goals
alter table public.goals
  add constraint goals_name_chk check (char_length(name) <= 200) not valid,
  add constraint goals_description_chk check (description is null or char_length(description) <= 2000) not valid,
  add constraint goals_target_amount_chk check (target_amount between 0 and 1e12) not valid,
  add constraint goals_current_amount_chk check (current_amount between 0 and 1e12) not valid,
  add constraint goals_color_chk check (char_length(color) <= 32) not valid;

-- goal_deposits
alter table public.goal_deposits
  add constraint goal_deposits_goal_name_chk check (char_length(goal_name) <= 200) not valid,
  add constraint goal_deposits_amount_chk check (amount between 0 and 1e12) not valid,
  add constraint goal_deposits_notes_chk check (notes is null or char_length(notes) <= 2000) not valid;

-- incomes
alter table public.incomes
  add constraint incomes_name_chk check (char_length(name) <= 200) not valid,
  add constraint incomes_category_chk check (char_length(category) <= 50) not valid,
  add constraint incomes_amount_chk check (amount between 0 and 1e12) not valid,
  add constraint incomes_month_chk check (month between 1 and 12) not valid,
  add constraint incomes_year_chk check (year between 1900 and 2200) not valid,
  add constraint incomes_notes_chk check (notes is null or char_length(notes) <= 2000) not valid;

-- debit_expenses
alter table public.debit_expenses
  add constraint debit_expenses_description_chk check (char_length(description) <= 500) not valid,
  add constraint debit_expenses_amount_chk check (amount between 0 and 1e12) not valid,
  add constraint debit_expenses_category_chk check (char_length(category) <= 50) not valid;

-- payment_records
alter table public.payment_records
  add constraint payment_records_amount_chk check (amount between 0 and 1e12) not valid,
  add constraint payment_records_month_chk check (month between 1 and 12) not valid,
  add constraint payment_records_year_chk check (year between 1900 and 2200) not valid,
  add constraint payment_records_notes_chk check (notes is null or char_length(notes) <= 2000) not valid;

-- withdrawals
alter table public.withdrawals
  add constraint withdrawals_investment_name_chk check (char_length(investment_name) <= 200) not valid,
  add constraint withdrawals_investment_type_chk check (char_length(investment_type) <= 50) not valid,
  add constraint withdrawals_investment_platform_chk check (char_length(investment_platform) <= 200) not valid,
  add constraint withdrawals_coin_id_chk check (coin_id is null or char_length(coin_id) <= 100) not valid,
  add constraint withdrawals_coin_symbol_chk check (coin_symbol is null or char_length(coin_symbol) <= 30) not valid,
  add constraint withdrawals_amount_chk check (amount between 0 and 1e12) not valid,
  add constraint withdrawals_cost_basis_chk check (cost_basis between 0 and 1e12) not valid,
  add constraint withdrawals_quantity_chk check (quantity is null or quantity between 0 and 1e15) not valid,
  add constraint withdrawals_notes_chk check (notes is null or char_length(notes) <= 2000) not valid;

-- Valida as linhas existentes; o que falhar fica NOT VALID com aviso.
do $$
declare
  r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
    from pg_constraint c
    where c.contype = 'c' and not c.convalidated
      and c.connamespace = 'public'::regnamespace
      and c.conname like '%\_chk'
  loop
    begin
      execute format('alter table %s validate constraint %I', r.tbl, r.conname);
    exception when check_violation then
      raise notice 'Constraint % em % ficou NOT VALID: há linhas antigas que a violam (escritas novas já são validadas).', r.conname, r.tbl;
    end;
  end loop;
end $$;

commit;
