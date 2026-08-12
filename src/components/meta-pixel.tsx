import { MetaPixelRoutes } from "./meta-pixel-routes";

export const META_PIXEL_ID = "1365875731720008";

const SNIPPET = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`;

/**
 * Pixel do Meta (Facebook/Instagram Ads).
 *
 * O snippet vai cru no HTML, e não pelo `next/script`, de propósito: o
 * verificador do Meta lê o código-fonte da página sem rodar o React, então com
 * o `next/script` ele não achava o pixel e ficava pedindo pra "configurar".
 * Aqui o snippet aparece no view-source. Não pesa no carregamento — o
 * fbevents.js em si continua sendo baixado de forma assíncrona.
 */
export function MetaPixel() {
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
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <MetaPixelRoutes />
    </>
  );
}
