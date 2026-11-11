import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";

/**
 * Injects Meta Pixel base code using Next.js Script component.
 */
export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
          fbq('optOut', '${META_PIXEL_ID}', 'ESTRuleEngine');
          fbq('optOut', '${META_PIXEL_ID}', 'InferredEvents');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
          try { window.dispatchEvent(new Event('meta-pixel-ready')); } catch (e) {}
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
