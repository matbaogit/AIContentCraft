import { useLanguage } from "@/hooks/use-language";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { FeedbackForm } from "@/components/landing/FeedbackForm";
import { Footer } from "@/components/landing/Footer";
import Head from "@/components/head";
import { useQuery } from "@tanstack/react-query";
import { ZaloConfirmModal } from "@/components/ZaloConfirmModal";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { t, language } = useLanguage();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [zaloData, setZaloData] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>("");

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

  // Handle Zalo OAuth confirmation
  useEffect(() => {
    // Check for Zalo confirmation parameter
    const params = new URLSearchParams(window.location.search);
    const zaloConfirm = params.get('zalo_confirm');
    const refParam = params.get('ref');
    
    if (zaloConfirm) {
      // Get stored OAuth data
      const storedData = sessionStorage.getItem('zalo_oauth_data');
      if (storedData) {
        try {
          const oauthData = JSON.parse(JSON.parse(storedData));
          setZaloData(oauthData);
          setShowZaloModal(true);
          
          // Set referral code if available
          if (refParam) {
            setReferralCode(refParam);
          } else {
            // Check if stored in session
            const storedRef = sessionStorage.getItem('referralCode');
            if (storedRef) {
              setReferralCode(storedRef);
            }
          }
          
          // Clean up URL
          window.history.replaceState({}, document.title, '/');
        } catch (error) {
          console.error('Error parsing Zalo OAuth data:', error);
        }
      }
    }
    
    // Listen for messages from popup window
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ZALO_OAUTH_SUCCESS' && event.data.needsConfirmation) {
        // Try multiple data sources with retry
        const tryLoadData = () => {
          // Try sessionStorage first
          let storedData = sessionStorage.getItem('zalo_oauth_data');
          if (!storedData) {
            // Try localStorage
            storedData = localStorage.getItem('zalo_oauth_data');
          }
          
          if (storedData) {
            try {
              const oauthData = typeof storedData === 'string' && storedData.startsWith('"{') 
                ? JSON.parse(JSON.parse(storedData))  // Double-parsed format
                : JSON.parse(storedData);  // Single-parsed format
              
              setZaloData(oauthData);
              setShowZaloModal(true);
              
              if (event.data.referralCode) {
                setReferralCode(event.data.referralCode);
              }
              return true;
            } catch (error) {
              console.error('Error parsing Zalo OAuth data:', error);
            }
          }
          return false;
        };

        // Immediate attempt
        if (!tryLoadData()) {
          // Retry after delay for race condition
          setTimeout(() => {
            if (!tryLoadData()) {
              console.error('Failed to load Zalo data after retry');
              // Still show modal, it will handle data loading internally
              setShowZaloModal(true);
              if (event.data.referralCode) {
                setReferralCode(event.data.referralCode);
              }
            }
          }, 300);
        }
      } else if (event.data.type === 'ZALO_LOGIN_SUCCESS') {
        // Existing user logged in
        window.location.reload(); // Refresh to update auth state
        navigate('/dashboard');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

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

      {/* Zalo Confirmation Modal */}
      <ZaloConfirmModal
        isOpen={showZaloModal}
        onClose={() => setShowZaloModal(false)}
        zaloData={zaloData}
        referralCode={referralCode}
        onSuccess={() => {
          window.location.reload(); // Refresh to update auth state
          navigate('/dashboard');
        }}
      />
    </>
  );
}
