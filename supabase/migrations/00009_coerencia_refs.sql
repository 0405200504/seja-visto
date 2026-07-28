-- =============================================================
-- Coerência dos filtros da aba Refs: looks statement/editoriais
-- que estavam marcados como "dia-a-dia" passam para a ocasião
-- que combina de verdade com o peso do look.
-- Aplicada em produção via Management API em 2026-07-28.
-- =============================================================

-- Looks de proporção editorial ou peça statement não são "dia a dia":
-- viram "evento-casual" (rolê, festa, encontro descontraído).
update public.looks set occasion = 'evento-casual' where title in (
  'Camadas & Baggy Gigante',    -- "proporção máxima" com bota e correntes
  'Estampa Koi',                -- shell estampada como peça única de destaque
  'Flanela & Cargo Gigante',    -- "proporções raras de arquivo"
  'Jaqueta Estampada',          -- "peça única de garimpo"
  'Mountain Jacket Vermelha',   -- statement vermelho + camo + boné estampado
  'Vermelho & Digi-Camo',       -- "contraste dos anos 2000 sem medo"
  'Cowboy em Cinza',            -- cropped com gráfico western e ball chain
  'Shell Tech'                  -- tênis de corrida chamativo como destaque
);

-- All black futurista com cinto tático: cara de noite, não de dia a dia.
update public.looks set occasion = 'noite' where title = 'Utility Slim & Cargo';
