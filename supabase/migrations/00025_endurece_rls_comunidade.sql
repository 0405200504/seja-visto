-- Auditoria de seguranca final pre-lancamento.
--
-- Fecha uma lacuna onde uma conta autenticada mas SEM assinatura ativa
-- (gratuita, cancelada, nunca paga) conseguia ler comentarios, curtidas e
-- salvamentos de TODA a comunidade, e ler QUALQUER foto do bucket privado
-- "fits" -- inclusive fotos ainda pendentes de moderacao de outro aluno --
-- chamando a API do Supabase diretamente com a propria sessao. A pagina do
-- app ja bloqueava via requirePaidAccess(), mas isso e so a fachada: a
-- policy do banco e a fronteira real, e ela aceitava "true" para qualquer
-- autenticado.
--
-- Reverter (se algo quebrar): recriar as tres policies como estavam nas
-- migrations 00018 e 00021, com "using (true)" / sem checar status.

-- ---------- fit_comments / fit_reactions ----------
-- Mesmo padrao ja usado em looks/lessons/modules/wardrobe_items: dono da
-- linha, admin, ou assinatura ativa.

drop policy if exists "comments: read for members" on public.fit_comments;
create policy "comments: read for members" on public.fit_comments
  for select to authenticated
  using ((user_id = auth.uid()) or public.is_admin() or public.tem_acesso_base());

drop policy if exists "reactions: read for members" on public.fit_reactions;
create policy "reactions: read for members" on public.fit_reactions
  for select to authenticated
  using ((user_id = auth.uid()) or public.is_admin() or public.tem_acesso_base());

-- ---------- storage.objects (bucket "fits") ----------
-- Antes: qualquer assinante ativo lia QUALQUER arquivo do bucket so por
-- conhecer o caminho, mesmo de um fit ainda "pending" de outra pessoa.
-- Agora, fora da propria pasta e do admin, so libera se o fit correspondente
-- ja estiver aprovado.

drop policy if exists "fits storage: leitura para membros" on storage.objects;
create policy "fits storage: leitura para membros" on storage.objects
  for select
  using (
    bucket_id = 'fits' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or (
        public.tem_acesso_base()
        and exists (
          select 1 from public.community_fits cf
          where cf.image_path = storage.objects.name
            and cf.status = 'approved'
        )
      )
    )
  );
