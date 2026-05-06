-- Habilita o RLS na tabela escalas (se ainda não estiver habilitado)
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT na tabela escalas APENAS para usuários que NÃO estão em formação
-- Presume-se que o role do usuário está armazenado nos metadados do auth ou em uma tabela de perfis (users)

-- Exemplo 1: Se a 'role' estiver nos raw_user_meta_data do auth.users do Supabase
CREATE POLICY "Permitir SELECT em escalas para não-formandos (via auth meta)"
ON public.escalas
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IS DISTINCT FROM 'em_formacao'
);


-- Exemplo 2: Se a 'role' estiver numa tabela pública 'users' que se relaciona com auth.uid()
-- (Este é o cenário mais comum quando temos a tabela public.users espelhando o auth)
CREATE POLICY "Permitir SELECT em escalas para não-formandos (via tabela users)"
ON public.escalas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role != 'em_formacao'
  )
);
