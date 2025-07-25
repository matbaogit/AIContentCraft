import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

export type Language = 'vi' | 'en';
export type TranslationKey = string;

// Define translations type structure
type TranslationData = {
  [key: string]: string | TranslationData | Array<any>;
};

type TranslationsType = {
  vi: TranslationData;
  en: TranslationData;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Hardcoded translations for essential UI elements
const translations: TranslationsType = {
  vi: {
    common: {
      loading: "Đang gửi...",
      error: "Lỗi",
      success: "Thành công",
      cancel: "Hủy",
      save: "Lưu",
      edit: "Chỉnh sửa",
      delete: "Xóa",
      view: "Xem",
      create: "Tạo mới",
      update: "Cập nhật",
      loadingData: "Đang tải dữ liệu...",
      viewAll: "Xem tất cả",
      close: "Đóng",
      manage: "Quản lý",
      actions: "Hành động",
      status: "Trạng thái",
      submit: "Gửi",
      back: "Quay lại",
      next: "Tiếp theo",
      confirm: "Xác nhận",
      yes: "Có",
      no: "Không",
      appName: "SEO AI Writer"
    },
    admin: {
      dashboard: "Bảng điều khiển",
      users: "Người dùng",
      articles: "Bài viết",
      plans: "Gói dịch vụ",
      payments: "Thanh toán",
      performance: "Hiệu suất",
      integrations: "Tích hợp",
      settings: "Cài đặt"
    },
    dashboard: {
      title: "Bảng điều khiển",
      myArticles: "Bài viết của tôi",
      imageLibrary: "Thư viện hình ảnh"
    },
    landing: {
      hero: {
        badge: "Công cụ AI tạo nội dung hàng đầu",
        title: "Tạo nội dung SEO chuyên nghiệp với AI",
        subtitle: "Tạo bài viết SEO chất lượng cao, tối ưu từ khóa và đăng tự động lên mạng xã hội với sức mạnh trí tuệ nhân tạo",
        tryFree: "Dùng thử miễn phí",
        viewDemo: "Xem demo",
        features: {
          aiContent: {
            title: "Nội dung AI",
            description: "Tạo bài viết chất lượng cao với AI"
          },
          multilingual: {
            title: "Đa ngôn ngữ",
            description: "Hỗ trợ tiếng Việt và tiếng Anh"
          },
          integration: {
            title: "Tích hợp",
            description: "Kết nối với mạng xã hội và WordPress"
          },
          analytics: {
            title: "Phân tích",
            description: "Theo dõi hiệu suất và SEO"
          }
        }
      },
      features: {
        title: "Tính năng mạnh mẽ",
        subtitle: "Khám phá các công cụ AI tiên tiến để tạo nội dung chuyên nghiệp",
        description: "Bộ công cụ toàn diện giúp bạn tạo, tối ưu và quản lý nội dung hiệu quả",
        benefits: "Lợi ích",
        viewServices: "Xem dịch vụ"
      },
      pricing: {
        title: "Bảng giá linh hoạt",
        subtitle: "Chọn gói phù hợp với nhu cầu của bạn",
        packages: {
          basic: "Cơ bản",
          advanced: "Nâng cao", 
          professional: "Chuyên nghiệp",
          storageBasic: "Lưu trữ cơ bản",
          storageAdvanced: "Lưu trữ nâng cao",
          storagePro: "Lưu trữ chuyên nghiệp"
        },
        features: {
          credits: "tín dụng",
          wordsPerCredit: "từ/tín dụng",
          seoOptimization: "Tối ưu SEO",
          support: "Hỗ trợ",
          supportEmail: "email",
          supportPriority: "ưu tiên",
          support247: "24/7",
          saving: "tiết kiệm",
          maxArticles: "bài viết tối đa",
          storage: "dung lượng",
          backup: "sao lưu tự động",
          analytics: "phân tích nâng cao"
        }
      },
      faq: {
        title: "Câu hỏi thường gặp",
        subtitle: "Tìm câu trả lời cho những thắc mắc phổ biến"
      },
      feedback: {
        title: "Góp ý & Phản hồi",
        subtitle: "Ý kiến của bạn rất quan trọng với chúng tôi"
      },
      stats: {
        articles: "Bài viết đã tạo",
        users: "Người dùng hài lòng", 
        keywords: "Từ khóa được tối ưu",
        languages: "Ngôn ngữ hỗ trợ"
      }
    },
    nav: {
      features: "tính năng",
      pricing: "giá cả",
      faq: "câu hỏi",
      contact: "liên hệ"
    }
  },
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      create: "Create",
      update: "Update",
      loadingData: "Loading data...",
      viewAll: "View all",
      close: "Close",
      manage: "Manage",
      actions: "Actions",
      status: "Status",
      submit: "Submit",
      back: "Back",
      next: "Next",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      appName: "SEO AI Writer"
    },
    admin: {
      dashboard: "Dashboard",
      users: "Users",
      articles: "Articles",
      plans: "Plans",
      payments: "Payments",
      performance: "Performance",
      integrations: "Integrations",
      settings: "Settings"
    },
    dashboard: {
      title: "Dashboard",
      myArticles: "My Articles",
      imageLibrary: "Image Library"
    },
    landing: {
      hero: {
        badge: "Leading AI Content Creation Tool",
        title: "Create Professional SEO Content with AI",
        subtitle: "Generate high-quality SEO articles, optimize keywords, and automatically post to social media with the power of artificial intelligence",
        tryFree: "Try Free",
        viewDemo: "View Demo",
        features: {
          aiContent: {
            title: "AI Content",
            description: "Generate high-quality articles with AI"
          },
          multilingual: {
            title: "Multilingual",
            description: "Support for Vietnamese and English"
          },
          integration: {
            title: "Integration",
            description: "Connect with social media and WordPress"
          },
          analytics: {
            title: "Analytics",
            description: "Track performance and SEO"
          }
        }
      },
      features: {
        title: "Powerful Features",
        subtitle: "Discover advanced AI tools for professional content creation",
        description: "Comprehensive toolkit to help you create, optimize and manage content effectively",
        benefits: "Benefits",
        viewServices: "View Services"
      },
      pricing: {
        title: "Flexible Pricing",
        subtitle: "Choose a plan that fits your needs",
        packages: {
          basic: "Basic",
          advanced: "Advanced",
          professional: "Professional", 
          storageBasic: "Basic Storage",
          storageAdvanced: "Advanced Storage",
          storagePro: "Pro Storage"
        },
        features: {
          credits: "credits",
          wordsPerCredit: "words/credit",
          seoOptimization: "SEO Optimization",
          support: "Support",
          supportEmail: "email",
          supportPriority: "priority",
          support247: "24/7",
          saving: "savings",
          maxArticles: "max articles",
          storage: "storage",
          backup: "auto backup",
          analytics: "advanced analytics"
        }
      },
      faq: {
        title: "Frequently Asked Questions",
        subtitle: "Find answers to common questions"
      },
      feedback: {
        title: "Feedback & Suggestions",
        subtitle: "Your opinion matters to us"
      },
      stats: {
        articles: "Articles Created",
        users: "Happy Users",
        keywords: "Keywords Optimized", 
        languages: "Languages Supported"
      }
    },
    nav: {
      features: "features",
      pricing: "pricing",
      faq: "faq",
      contact: "contact"
    }
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi' as Language,
  setLanguage: () => {},
  t: (key: string) => key
});

// Export context for use in hooks
export { LanguageContext };

// Export the provider component
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    console.log('[LanguageProvider] Initial language from localStorage:', savedLanguage);
    return savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi') 
      ? savedLanguage 
      : 'vi';
  });

  // Effect to update language preference
  useEffect(() => {
    console.log('[LanguageProvider] Language changed to:', language);
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    console.log('[LanguageProvider] setLanguage called with:', lang);
    setLanguage(lang);
  };

  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: any = translations[language];

      for (const k of keys) {
        if (value === undefined || value[k] === undefined) {
          // Nếu không tìm thấy, trả về phần cuối của key để dễ đọc
          return keys[keys.length - 1].replace(/([A-Z])/g, ' $1').trim();
        }
        value = value[k];
      }

      if (typeof value === 'string') {
        return value;
      } else {
        // Nếu value không phải string (có thể là object), trả về phần cuối của key
        return keys[keys.length - 1].replace(/([A-Z])/g, ' $1').trim();
      }
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      // Trả về phần cuối của key với định dạng cải thiện khi có lỗi
      const lastKey = key.split('.').pop() || '';
      return lastKey.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return {
    currentLanguage: context.language,
    setLanguage: context.setLanguage,
    t: context.t
  };
};