import { notFound } from "next/navigation";
import { HeroSection } from "@/components/public/HeroSection";
import { FeaturesSection } from "@/components/public/FeaturesSection";
import { StatsSection } from "@/components/public/StatsSection";
import { AboutSection } from "@/components/public/AboutSection";
import { GallerySection } from "@/components/public/GallerySection";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { ContactSection } from "@/components/public/ContactSection";
import { VideoSection } from "@/components/public/VideoSection";
import { SocialsSection } from "@/components/public/SocialsSection";
import { PricingSection } from "@/components/public/PricingSection";
import { FAQSection } from "@/components/public/FAQSection";
import { CTASection } from "@/components/public/CTASection";
import { CheckoutSection } from "@/components/public/CheckoutSection";
import { PageViewTracker } from "@/components/public/PageViewTracker";
import { CookieBanner } from "@/components/public/CookieBanner";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { AnimatedSectionWrapper } from "@/components/public/AnimatedSectionWrapper";
import { cookies, headers } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getLandingPage(slug: string, visitorId?: string, lang?: string) {
  try {
    const url = new URL(`${API}/pages/slug/${slug}`);
    if (visitorId) url.searchParams.append('visitor_id', visitorId);
    if (lang) url.searchParams.append('lang', lang);
    
    const res = await fetch(url.toString(), {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch data");
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitor_id')?.value;
  const lang = cookieStore.get('NEXT_LOCALE')?.value;
  const page = await getLandingPage(slug, visitorId, lang);
  if (!page) return { title: "Not Found" };
  return {
    title: page.seo_title || page.name,
    description: page.seo_description,
    keywords: page.meta_keywords,
    openGraph: {
      title: page.seo_title || page.name,
      description: page.seo_description,
      images: page.og_image_url ? [page.og_image_url] : [],
    },
  };
}

export default async function LandingPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams?.preview === 'true';
  const cookieStore = await cookies();
  const headersList = await headers();
  const visitorId = cookieStore.get('visitor_id')?.value;
  
  // 1. Try cookie
  let lang = cookieStore.get('NEXT_LOCALE')?.value;
  // 2. Try accept-language header if no cookie
  if (!lang) {
    const acceptLang = headersList.get('accept-language');
    if (acceptLang) {
      lang = acceptLang.split(',')[0].split('-')[0].toLowerCase();
    }
  }

  const page = await getLandingPage(slug, visitorId, lang);

  if (!page || (page.status !== "PUBLISHED" && !isPreview)) {
    notFound();
  }

  const renderSection = (section: any) => {
    switch (section.type) {
      case "Hero": return <HeroSection key={section.id} config={section.config} />;
      case "Features": return <FeaturesSection key={section.id} config={section.config} />;
      case "Stats": return <StatsSection key={section.id} config={section.config} />;
      case "About": return <AboutSection key={section.id} config={section.config} />;
      case "Gallery": return <GallerySection key={section.id} config={section.config} />;
      case "Testimonials": return <TestimonialsSection key={section.id} config={section.config} />;
      case "Contact": return <ContactSection key={section.id} config={section.config} pageId={page.id} />;
      case "Video": return <VideoSection key={section.id} config={section.config} />;
      case "Socials": return <SocialsSection key={section.id} config={section.config} />;
      case "Pricing": return <PricingSection key={section.id} config={section.config} />;
      case "FAQ": return <FAQSection key={section.id} config={section.config} />;
      case "CTA": return <CTASection key={section.id} config={section.config} />;
      case "Checkout": return <CheckoutSection key={section.id} config={section.config} pageId={page.id} />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <PageViewTracker pageId={page.id} />
      {page.logo_url && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.logo_url} alt={page.name} className="h-8 object-contain" />
            <div className="flex items-center gap-4">
              <LanguageSwitcher availableLanguages={page.available_languages} currentLang={page.language_code} />
              <a href="#contact" className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </nav>
      )}

      {!page.logo_url && page.available_languages?.length > 1 && (
        <div className="fixed top-4 right-6 z-50">
          <LanguageSwitcher availableLanguages={page.available_languages} currentLang={page.language_code} />
        </div>
      )}

      <div className={page.logo_url ? "pt-16" : ""}>
        {page.sections?.map((section: any) => (
          <AnimatedSectionWrapper key={section.id}>
            {renderSection(section)}
          </AnimatedSectionWrapper>
        ))}
      </div>

      {/* Footer */}
      <footer className="py-10 px-6 bg-zinc-900 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4">
          <p className="text-zinc-500 text-sm">
            {page.client_name ? `© ${new Date().getFullYear()} ${page.client_name}. All rights reserved.` : `© ${new Date().getFullYear()} ${page.name}`}
          </p>
          {(page.privacy_policy_url || page.tos_url) && (
            <div className="flex items-center gap-4 text-sm font-medium">
              {page.privacy_policy_url && (
                <a href={page.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              )}
              {page.privacy_policy_url && page.tos_url && <span className="text-zinc-700">•</span>}
              {page.tos_url && (
                <a href={page.tos_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              )}
            </div>
          )}
        </div>
      </footer>

      {page.enable_cookie_consent && <CookieBanner />}

      {page.custom_css && <style dangerouslySetInnerHTML={{ __html: page.custom_css }} />}
      {page.custom_js && <script dangerouslySetInnerHTML={{ __html: page.custom_js }} />}

      {/* Tracking Pixels */}
      {page.gtm_id && (
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${page.gtm_id}');` }} />
      )}
      {page.fb_pixel_id && (
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${page.fb_pixel_id}');
fbq('track', 'PageView');` }} />
      )}
      {page.tiktok_pixel_id && (
        <script dangerouslySetInnerHTML={{ __html: `!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${page.tiktok_pixel_id}');
ttq.page();
}(window, document, 'ttq');` }} />
      )}
      {page.ga4_id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${page.ga4_id}`}></script>
          <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${page.ga4_id}');` }} />
        </>
      )}
    </main>
  );
}
