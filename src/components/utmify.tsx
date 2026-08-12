export const UTMIFY_PIXEL_ID = "6a7cc6d1f27b310842fbeae8";
export const UTMIFY_GOOGLE_PIXEL_ID = "6a7ccec6a16e2bcfe935e009";

const SNIPPET = `window.pixelId = "${UTMIFY_PIXEL_ID}";`;
const GOOGLE_SNIPPET = `window.googlePixelId = "${UTMIFY_GOOGLE_PIXEL_ID}";`;

/**
 * Pixel da Utmify (atribuição de UTM das vendas da Cakto).
 *
 * O instalador que a Utmify entrega vem ofuscado em base64+XOR, mas por dentro
 * ele só faz duas coisas: define `window.pixelId` e injeta o `pixel.js` deles.
 * É exatamente isso aqui embaixo, em texto claro — mesmo comportamento, sem o
 * blob ilegível no meio do site.
 *
 * O segundo par é o pixel do Google da Utmify (conta separada de trackeamento):
 * mesma ideia, define `window.googlePixelId` e injeta o `pixel-google.js`. Ele
 * é independente da tag do Google Ads em `google-ads.tsx` — os dois convivem.
 *
 * A ordem importa: cada `pixel*.js` lê o `window.*PixelId` ao carregar, então o
 * snippet inline precisa vir antes. Como os scripts são `async`/`defer`, não
 * pesam no carregamento.
 */
export function Utmify() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SNIPPET }} />
      <script
        async
        defer
        src="https://cdn.utmify.com.br/scripts/pixel/pixel.js"
      />
      <script dangerouslySetInnerHTML={{ __html: GOOGLE_SNIPPET }} />
      <script
        async
        defer
        src="https://cdn.utmify.com.br/scripts/pixel/pixel-google.js"
      />
    </>
  );
}
