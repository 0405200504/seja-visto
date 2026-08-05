/**
 * Recomprime as fotos de public/ no lugar.
 *
 * Por que isso importa mesmo com o next/image: o otimizador da Vercel gera
 * AVIF/WebP sob demanda, mas a PRIMEIRA pessoa a abrir cada foto paga o tempo
 * dessa transformação — e quanto maior o arquivo de origem, mais demora. Fotos
 * de 700KB a 1120x1400 são muito maiores do que qualquer tela precisa.
 *
 * Uso:
 *   node scripts/otimizar-fotos.mjs --dry     (só relatório, não escreve nada)
 *   node scripts/otimizar-fotos.mjs           (aplica)
 *
 * É idempotente: só substitui o arquivo quando o resultado fica menor.
 */
import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const PASTAS = [
  "public/estilos",
  "public/mais-procurados",
  "public/images",
  "public/bonus",
];

/**
 * Maior largura que a foto chega a ocupar: no celular são 50vw de ~430px em
 * tela 3x (~645px) e no desktop 25vw de 1280px em tela 2x (~640px). 1200px
 * deixa folga de sobra para telas grandes sem carregar peso à toa.
 */
const LARGURA_MAX = 1200;
const QUALIDADE = 80;

const aplicar = !process.argv.includes("--dry");

async function listarFotos(dir) {
  const achados = [];
  let entradas;
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch {
    return achados;
  }
  for (const e of entradas) {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) achados.push(...(await listarFotos(caminho)));
    else if ([".jpg", ".jpeg", ".png"].includes(extname(e.name).toLowerCase())) {
      achados.push(caminho);
    }
  }
  return achados;
}

const kb = (bytes) => `${Math.round(bytes / 1024)}KB`;

let totalAntes = 0;
let totalDepois = 0;
let alterados = 0;

for (const pasta of PASTAS) {
  const fotos = await listarFotos(pasta);
  for (const caminho of fotos) {
    const antes = (await stat(caminho)).size;
    const original = await readFile(caminho);
    const meta = await sharp(original).metadata();
    const ehPng = extname(caminho).toLowerCase() === ".png";

    // PNG com transparência vira PNG (virar JPEG poria fundo preto).
    const pipeline = sharp(original).resize({
      width: Math.min(meta.width ?? LARGURA_MAX, LARGURA_MAX),
      withoutEnlargement: true,
    });

    const saida =
      ehPng && meta.hasAlpha
        ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
        : await pipeline
            .jpeg({ quality: QUALIDADE, mozjpeg: true, progressive: true })
            .toBuffer();

    totalAntes += antes;

    // Só troca se realmente ficou menor — recomprimir por recomprimir só perde
    // qualidade de graça.
    if (saida.length < antes * 0.95) {
      if (aplicar) await writeFile(caminho, saida);
      totalDepois += saida.length;
      alterados++;
      console.log(`${caminho}: ${kb(antes)} → ${kb(saida.length)}`);
    } else {
      totalDepois += antes;
    }
  }
}

const economia = totalAntes - totalDepois;
console.log(
  `\n${alterados} fotos ${aplicar ? "otimizadas" : "otimizáveis"} · ` +
    `${kb(totalAntes)} → ${kb(totalDepois)} ` +
    `(-${Math.round((economia / totalAntes) * 100)}%)`
);
if (!aplicar) console.log("Rodou em --dry: nenhum arquivo foi alterado.");
