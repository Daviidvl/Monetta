-- Correção B-02 (auditoria de segurança 2026-11-20)
--
-- As FKs entre tabelas (withdrawals → investments/incomes, goal_deposits →
-- goals, payment_records → bills) só verificavam que o id referenciado
-- EXISTE, não que pertence ao mesmo usuário — checagens de FK ignoram RLS.
-- Isso permitia gravar linhas apontando para dados de outra conta (base
-- das falhas A-01/A-02) e servia de oráculo de existência de ids alheios.
--
-- Correção: FKs compostas (x_id, user_id) → pai(id, user_id). O banco passa
-- a exigir que filho e pai tenham o mesmo dono. Requer Postgres 15+ por
-- causa de `on delete set null (coluna)`.

begin;

-- 1) Pré-checagens: aborta (sem alterar nada) se o Postgres for antigo ou se
--    já existirem referências cruzadas — nesse caso elas precisam ser
--    investigadas antes (podem ser sinal de exploração).
do $$
declare
  v_cross int;
begin
  if current_setting('server_version_num')::int < 150000 then
    raise exception 'Postgres 15+ necessário (on delete set null (coluna)). Versão atual: %',
      current_setting('server_version');
  end if;

  select count(*) into v_cross from (
    select w.id from public.withdrawals w
      join public.investments i on i.id = w.investment_id where i.user_id <> w.user_id
    union all
    select w.id from public.withdrawals w
      join public.incomes n on n.id = w.income_entry_id where n.user_id <> w.user_id
    union all
    select d.id from public.goal_deposits d
      join public.goals g on g.id = d.goal_id where g.user_id <> d.user_id
    union all
    select p.id from public.payment_records p
      join public.bills b on b.id = p.bill_id where b.user_id <> p.user_id
  ) x;

  if v_cross > 0 then
    raise exception '% linha(s) com referência a dados de OUTRO usuário. Migration abortada — rode a query de detecção da auditoria e investigue antes de continuar.', v_cross;
  end if;
end $$;

-- 2) Alvos das FKs compostas.
alter table public.investments add constraint investments_id_user_id_key unique (id, user_id);
alter table public.incomes     add constraint incomes_id_user_id_key     unique (id, user_id);
alter table public.goals       add constraint goals_id_user_id_key       unique (id, user_id);
alter table public.bills       add constraint bills_id_user_id_key       unique (id, user_id);

-- 3) Troca das FKs simples pelas compostas (mesmo comportamento de
--    cascade / set null de antes; set null só zera a coluna do id, nunca
--    o user_id, que é NOT NULL).
alter table public.withdrawals
  drop constraint if exists withdrawals_investment_id_fkey,
  add constraint withdrawals_investment_id_user_id_fkey
    foreign key (investment_id, user_id) references public.investments (id, user_id)
    on delete set null (investment_id);

alter table public.withdrawals
  drop constraint if exists withdrawals_income_entry_id_fkey,
  add constraint withdrawals_income_entry_id_user_id_fkey
    foreign key (income_entry_id, user_id) references public.incomes (id, user_id)
    on delete set null (income_entry_id);

alter table public.goal_deposits
  drop constraint if exists goal_deposits_goal_id_fkey,
  add constraint goal_deposits_goal_id_user_id_fkey
    foreign key (goal_id, user_id) references public.goals (id, user_id)
    on delete cascade;

alter table public.payment_records
  drop constraint if exists payment_records_bill_id_fkey,
  add constraint payment_records_bill_id_user_id_fkey
    foreign key (bill_id, user_id) references public.bills (id, user_id)
    on delete cascade;

commit;
