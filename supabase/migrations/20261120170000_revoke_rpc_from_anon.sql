-- Correção B-03 (auditoria de segurança 2026-11-20)
--
-- `revoke all ... from public` não basta no Supabase: os default privileges
-- do schema public dão EXECUTE explícito ao papel `anon` em toda função
-- nova. Em produção uma chamada anônima chegava ao corpo das RPCs (barrada
-- só pelo `if auth.uid() is null`). Com o revoke, o anon é recusado antes
-- de executar qualquer coisa. O app só chama estas RPCs autenticado.

begin;

revoke execute on function public.add_withdrawal(uuid, numeric, numeric, timestamptz, text) from anon;
revoke execute on function public.delete_withdrawal(uuid) from anon;
revoke execute on function public.add_goal_deposit(uuid, numeric, timestamptz, text) from anon;
revoke execute on function public.delete_goal_deposit(uuid) from anon;

commit;
