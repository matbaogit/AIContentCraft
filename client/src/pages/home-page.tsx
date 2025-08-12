import { useLanguage } from "@/hooks/use-language";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { FeedbackForm } from "@/components/landing/FeedbackForm";
import { Footer } from "@/components/landing/Footer";
import Head from "@/components/head";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { t, language } = useLanguage();

  // Fetch appearance settings for dynamic site title
  const { data: appearanceSettings } = useQuery({
    queryKey: ['/api/appearance/settings', 'header', language],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Get dynamic site name from SEO meta settings first, then header settings
  const seoSiteTitle = (appearanceSettings as any)?.data?.find((s: any) => s.type === 'seo_meta' && s.key === 'site_title' && s.language === language)?.value;
  const headerSiteName = (appearanceSettings as any)?.data?.find((s: any) => s.type === 'header' && s.key === 'site_name' && s.language === language)?.value;
  const siteName = seoSiteTitle || headerSiteName || t("common.appName");

  return (
    <>
      <Head>
        <title>{siteName}</title>
        <meta name="description" content={t("landing.hero.subtitle")} />
      </Head>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Hero />
        <Features />
        <Pricing />
        <Faq />
        <FeedbackForm />
        <Footer />
      </div>
    </>
  );
}
