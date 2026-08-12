export const UTMIFY_PIXEL_ID = "6a7cc6d1f27b310842fbeae8";

const SNIPPET = `window.pixelId = "${UTMIFY_PIXEL_ID}";`;

/**
 * Pixel da Utmify (atribuição de UTM das vendas da Cakto).
 *
 * O instalador que a Utmify entrega vem ofuscado em base64+XOR, mas por dentro
 * ele só faz duas coisas: define `window.pixelId` e injeta o `pixel.js` deles.
 * É exatamente isso aqui embaixo, em texto claro — mesmo comportamento, sem o
 * blob ilegível no meio do site.
 *
 * A ordem importa: o `pixel.js` lê `window.pixelId` ao carregar, então o
 * snippet inline precisa vir antes. Como o script é `async`/`defer`, não pesa
 * no carregamento.
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
    </>
  );
}
