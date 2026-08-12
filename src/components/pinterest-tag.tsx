import { PinterestTagRoutes } from "./pinterest-tag-routes";

export const PINTEREST_TAG_ID = "2612939238671";

const SNIPPET = `!function(e){if(!window.pintrk){window.pintrk = function () {
window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
  n=window.pintrk;n.queue=[],n.version="3.0";var
  t=document.createElement("script");t.async=!0,t.src=e;var
  r=document.getElementsByTagName("script")[0];
  r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load', '${PINTEREST_TAG_ID}');
pintrk('page');`;

/**
 * Tag do Pinterest (Pinterest Ads).
 *
 * Igual ao pixel do Meta: o snippet vai cru no HTML, e não pelo `next/script`,
 * pra aparecer no view-source — é assim que o verificador do Pinterest acha a
 * tag. Não pesa no carregamento: o core.js é baixado de forma assíncrona.
 *
 * O parâmetro `em` (e-mail pra casar melhor o público) do exemplo oficial ficou
 * de fora de propósito: o layout é servido igual pra visitante deslogado, que é
 * quem vê a página de vendas — não há e-mail pra passar aqui.
 */
export function PinterestTag() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SNIPPET }} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://ct.pinterest.com/v3/?event=init&tid=${PINTEREST_TAG_ID}&noscript=1`}
        />
      </noscript>
      <PinterestTagRoutes />
    </>
  );
}
