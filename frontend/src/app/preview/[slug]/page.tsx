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
import { AnimatedSectionWrapper } from "@/components/public/AnimatedSectionWrapper";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getLandingPage(slug: string) {
  try {
    const res = await fetch(`${API}/pages/slug/${slug}`, {
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
  const page = await getLandingPage(slug);
  if (!page) return { title: "Preview — Not Found" };
  return {
    title: `[Preview] ${page.seo_title || page.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLandingPage(slug);

  // Preview route: show page regardless of status, but 404 if not found at all
  if (!page) {
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
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* Preview Banner */}
      <div className="sticky top-0 z-[100] w-full bg-amber-400 text-amber-900 text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-md">
        <span>👁️</span>
        <span>
          Preview Mode — Status:{" "}
          <span className="font-bold uppercase">{page.status}</span>. This page
          is not visible to the public until it is published.
        </span>
      </div>

      {page.logo_url && (
        <nav className="fixed top-10 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.logo_url} alt={page.name} className="h-8 object-contain" />
            <a href="#contact" className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
              Contact Us
            </a>
          </div>
        </nav>
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
        <div className="max-w-7xl mx-auto">
          <p className="text-zinc-500 text-sm">
            {page.client_name
              ? `© ${new Date().getFullYear()} ${page.client_name}. All rights reserved.`
              : `© ${new Date().getFullYear()} ${page.name}`}
          </p>
        </div>
      </footer>

      {page.custom_css && <style dangerouslySetInnerHTML={{ __html: page.custom_css }} />}
    </main>
  );
}
