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
      no: "Không"
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
      no: "No"
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