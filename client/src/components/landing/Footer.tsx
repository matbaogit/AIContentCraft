import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  LinkedinIcon,
  ScrollIcon
} from "lucide-react";

interface FooterSection {
  id: number;
  title: string;
  sectionKey: string;
  isActive: boolean;
  order: number;
  links: FooterLink[];
}

interface FooterLink {
  id: number;
  sectionId: number;
  label: string;
  href: string;
  isActive: boolean;
  order: number;
}

interface FooterSocialLink {
  id: number;
  platform: string;
  url: string;
  isActive: boolean;
  order: number;
}

interface FooterSettings {
  id: number;
  description: string;
  copyrightText: string;
}

interface FooterData {
  sections: FooterSection[];
  socialLinks: FooterSocialLink[];
  settings: FooterSettings | null;
}

export function Footer() {
  const { t } = useLanguage();
  
  const { data: footerData, isLoading } = useQuery<{ success: boolean; data: FooterData }>({
    queryKey: ['/api/public/footer'],
    retry: false,
  });

  // Fallback data if database fails
  const fallbackData = {
    sections: [
      {
        id: 1,
        title: t("landing.footer.links.product"),
        sectionKey: "product",
        isActive: true,
        order: 1,
        links: [
          { id: 1, sectionId: 1, label: t("landing.footer.links.createSeoContent"), href: "#", isActive: true, order: 1 },
          { id: 2, sectionId: 1, label: t("landing.footer.links.wordpressConnect"), href: "#", isActive: true, order: 2 },
          { id: 3, sectionId: 1, label: t("landing.footer.links.socialShare"), href: "#", isActive: true, order: 3 },
          { id: 4, sectionId: 1, label: t("landing.footer.links.seoAnalysis"), href: "#", isActive: true, order: 4 },
        ]
      },
      {
        id: 2,
        title: t("landing.footer.links.company"),
        sectionKey: "company",
        isActive: true,
        order: 2,
        links: [
          { id: 5, sectionId: 2, label: t("landing.footer.links.about"), href: "#", isActive: true, order: 1 },
          { id: 6, sectionId: 2, label: t("landing.footer.links.blog"), href: "#", isActive: true, order: 2 },
          { id: 7, sectionId: 2, label: t("landing.footer.links.partners"), href: "#", isActive: true, order: 3 },
          { id: 8, sectionId: 2, label: t("landing.footer.links.careers"), href: "#", isActive: true, order: 4 },
        ]
      },
      {
        id: 3,
        title: t("landing.footer.links.support"),
        sectionKey: "support",
        isActive: true,
        order: 3,
        links: [
          { id: 9, sectionId: 3, label: t("landing.footer.links.helpCenter"), href: "#", isActive: true, order: 1 },
          { id: 10, sectionId: 3, label: t("landing.footer.links.terms"), href: "/terms-of-service", isActive: true, order: 2 },
          { id: 11, sectionId: 3, label: t("landing.footer.links.privacy"), href: "/privacy-policy", isActive: true, order: 3 },
          { id: 12, sectionId: 3, label: t("landing.footer.links.contact"), href: "#contact", isActive: true, order: 4 },
        ]
      }
    ],
    socialLinks: [
      { id: 1, platform: "Facebook", url: "#", isActive: true, order: 1 },
      { id: 2, platform: "Twitter", url: "#", isActive: true, order: 2 },
      { id: 3, platform: "Instagram", url: "#", isActive: true, order: 3 },
      { id: 4, platform: "LinkedIn", url: "#", isActive: true, order: 4 },
    ],
    settings: {
      id: 1,
      description: t("landing.footer.description"),
      copyrightText: t("landing.footer.copyright"),
    }
  };

  const sections = footerData?.data?.sections || fallbackData.sections;
  const socialLinks = footerData?.data?.socialLinks || fallbackData.socialLinks;
  const settings = footerData?.data?.settings || fallbackData.settings;

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <FacebookIcon className="h-5 w-5" />;
      case 'twitter':
      case 'x':
        return <TwitterIcon className="h-5 w-5" />;
      case 'instagram':
        return <InstagramIcon className="h-5 w-5" />;
      case 'linkedin':
        return <LinkedinIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <footer className="bg-secondary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">Loading footer...</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-secondary-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center">
              <ScrollIcon className="h-8 w-auto text-white" />
              <span className="ml-2 text-xl font-bold text-white font-heading">
                {t("common.appName")}
              </span>
            </div>
            <p className="mt-4 text-slate-200">
              {settings?.description || t("landing.footer.description")}
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.id} 
                  href={social.url} 
                  className="text-slate-300 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialIcon(social.platform)}
                  <span className="sr-only">{social.platform}</span>
                </a>
              ))}
            </div>
          </div>
          
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.id}>
                    {link.href.startsWith('http') || link.href.startsWith('#') ? (
                      <a 
                        href={link.href} 
                        className="text-slate-300 hover:text-white transition-colors"
                        target={link.href.startsWith('http') ? "_blank" : undefined}
                        rel={link.href.startsWith('http') ? "noopener noreferrer" : undefined}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>
                        <a className="text-slate-300 hover:text-white transition-colors">
                          {link.label}
                        </a>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-secondary-700 text-center text-slate-300">
          <p>{settings?.copyrightText || t("landing.footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}