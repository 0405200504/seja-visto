-- =============================================================
-- Capa do estilo Opium: a 01.jpg era um plano aberto em que a
-- pessoa ocupa a metade de baixo do quadro. Como os cards cortam
-- em 4:3 a partir do topo (object-top), o card mostrava só a
-- parede. Os arquivos 01.jpg e 05.jpg foram trocados em
-- public/estilos/opium/ — aqui as refs seguem suas fotos.
-- =============================================================

update public.looks set image_url = '/estilos/opium/00_tmp.jpg' where image_url = '/estilos/opium/01.jpg';
update public.looks set image_url = '/estilos/opium/01.jpg'     where image_url = '/estilos/opium/05.jpg';
update public.looks set image_url = '/estilos/opium/05.jpg'     where image_url = '/estilos/opium/00_tmp.jpg';
