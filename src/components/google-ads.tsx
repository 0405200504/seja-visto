import { GoogleAdsRoutes } from "./google-ads-routes";

export const GOOGLE_ADS_ID = "AW-18382573776";

const SNIPPET = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`;

/**
 * Tag do Google (gtag.js) da conta do Google Ads.
 *
 * Igual ao pixel do Meta e à tag do Pinterest: o snippet vai cru no HTML, e não
 * pelo `next/script`, pra aparecer no view-source — é assim que o verificador
 * do Google acha a tag. Não pesa no carregamento: o gtag.js é baixado de forma
 * assíncrona.
 */
export function GoogleAds() {
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      />
      <script dangerouslySetInnerHTML={{ __html: SNIPPET }} />
      <GoogleAdsRoutes />
    </>
  );
}
