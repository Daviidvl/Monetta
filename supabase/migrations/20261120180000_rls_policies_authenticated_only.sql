-- Correção I-04 (auditoria de segurança 2026-11-20)
--
-- As 9 policies `<tabela>_owner_all` valiam para o papel `public` (inclui
-- anon) e chamavam auth.uid() uma vez POR LINHA. Mesma regra de dono,
-- agora:
--   * `to authenticated` — anon deixa de ter qualquer policy (nega tudo,
--     exatamente como já acontecia na prática);
--   * `(select auth.uid())` — avaliado uma vez por query (recomendação do
--     Supabase Advisor; evita degradação com tabelas grandes).
-- Nenhuma permissão é ampliada. Drop + create na mesma transação: não há
-- janela sem policy.

begin;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_profiles', 'bills', 'investments', 'goals', 'goal_deposits',
    'incomes', 'debit_expenses', 'payment_records', 'withdrawals'
  ]) loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_owner_all', t
    );
  end loop;
end $$;

commit;
