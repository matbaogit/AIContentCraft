import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useEffect, useMemo } from 'react';

interface Translation {
  key: string;
  vi: string;
  en: string;
  category?: string;
}

interface UseDbTranslationsResult {
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
  language: string;
}

export function useDbTranslations(): UseDbTranslationsResult {
  const { user } = useAuth();
  const { language: currentLanguage } = useLanguage();
  const language = currentLanguage;
  const queryClient = useQueryClient();

  // Clear all translation cache and refetch on language change or component mount
  useEffect(() => {
    console.log(`[useDbTranslations] Language changed to: ${language}, clearing all cache and refetching translations`);
    queryClient.removeQueries({ queryKey: ['/api/admin/translations'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/translations'] });
  }, [language, queryClient]);

  const { data: translations = [], isLoading } = useQuery({
    queryKey: ['/api/admin/translations', language], // Use stable query key
    select: (response: any) => {
      const translationData = response?.data?.translations || [];
      console.log(`[useDbTranslations] Loaded ${translationData.length} translations for language: ${language}`);
      return translationData;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: !!user, // Only fetch when user is loaded
    retry: false,
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const t = useMemo(() => {
    // Hard-coded translations for immediate testing
    const hardcodedTranslations: Record<string, { vi: string; en: string }> = {
      'dashboard.create.socialContent.stepExtract': {
        vi: 'Trích xuất',
        en: 'Extract'
      },
      'dashboard.create.socialContent.stepGenerate': {
        vi: 'Tạo nội dung', 
        en: 'Generate Content'
      },
      'dashboard.create.socialContent.stepComplete': {
        vi: 'Hoàn thành',
        en: 'Complete'
      },
      'dashboard.create.socialContent.step2Title': {
        vi: 'Bước 2: Tạo nội dung',
        en: 'Step 2: Generate Content'
      },
      'dashboard.create.socialContent.editContent': {
        vi: 'Chỉnh sửa nội dung',
        en: 'Edit Content'
      },
      'dashboard.create.socialContent.reExtract': {
        vi: 'Trích xuất lại',
        en: 'Re-extract'
      },
      'dashboard.create.socialContent.goBack': {
        vi: 'Quay lại',
        en: 'Go Back'
      },
      'dashboard.create.socialContent.generateForAllPlatforms': {
        vi: 'Tạo nội dung cho tất cả nền tảng',
        en: 'Generate content for all platforms'
      },
      'dashboard.create.socialContent.step3Title': {
        vi: 'Bước 3: Hình ảnh & Xem trước',
        en: 'Step 3: Images & Preview'
      },
      'dashboard.create.socialContent.attachImages': {
        vi: 'Đăng kèm hình ảnh',
        en: 'Attach images'
      },
      'dashboard.create.socialContent.selectImageSource': {
        vi: 'Chọn nguồn hình ảnh',
        en: 'Select image source'
      },
      'dashboard.create.socialContent.library': {
        vi: 'Thư viện',
        en: 'Library'
      },
      'dashboard.create.socialContent.createNew': {
        vi: 'Tạo mới',
        en: 'Create New'
      },
      'dashboard.create.socialContent.previewContent': {
        vi: 'Xem trước nội dung',
        en: 'Preview content'
      },
      'dashboard.create.socialContent.saveToLibrary': {
        vi: 'Lưu vào thư viện',
        en: 'Save to library'
      },
      'dashboard.create.socialContent.extracting': {
        vi: 'Đang trích xuất...',
        en: 'Extracting...'
      },
      'dashboard.create.socialContent.extractedContent': {
        vi: 'Đã trích xuất nội dung ({{count}} ký tự)',
        en: 'Extracted content ({{count}} characters)'
      },
      'dashboard.create.socialContent.generatedSuccess': {
        vi: 'Đã tạo nội dung social media thành công',
        en: 'Social media content generated successfully'
      },
      'dashboard.create.socialContent.imageGeneratedSuccess': {
        vi: 'Đã tạo ảnh mới thành công',
        en: 'Image generated successfully'
      },
      'dashboard.create.socialContent.uploadSuccess': {
        vi: 'Đã upload ảnh thành công',
        en: 'Image uploaded successfully'
      },
      'dashboard.create.socialContent.allPlatformsSuccess': {
        vi: 'Đã tạo nội dung cho tất cả nền tảng',
        en: 'Content generated for all platforms'
      },
      'common.success': {
        vi: 'Thành công',
        en: 'Success'
      },
      'dashboard.create.socialContent.generatingContent': {
        vi: 'Đang tạo nội dung...',
        en: 'Generating content...'
      },
      'dashboard.create.socialContent.nextStep': {
        vi: 'Tiếp theo',
        en: 'Next'
      },
      'dashboard.create.socialContent.justNow': {
        vi: 'Vừa xong',
        en: 'Just now'
      },
      'dashboard.create.socialContent.like': {
        vi: 'Thích',
        en: 'Like'
      },
      'dashboard.create.socialContent.comment': {
        vi: 'Bình luận',
        en: 'Comment'
      },
      'dashboard.create.socialContent.share': {
        vi: 'Chia sẻ',
        en: 'Share'
      },
      'dashboard.create.socialContent.selectedImages': {
        vi: 'Ảnh đã chọn',
        en: 'Selected Images'
      },
      'dashboard.create.socialContent.failedToLoad': {
        vi: 'Không thể tải',
        en: 'Failed to load'
      },
      'dashboard.create.socialContent.upload': {
        vi: 'Upload',
        en: 'Upload'
      },
      'dashboard.create.socialContent.noDescription': {
        vi: 'Không có mô tả',
        en: 'No description'
      },
      'dashboard.create.socialContent.saving': {
        vi: 'Đang lưu...',
        en: 'Saving...'
      },
      'dashboard.create.socialContent.posting': {
        vi: 'Đang đăng...',
        en: 'Posting...'
      },
      'dashboard.create.socialContent.viewPost': {
        vi: 'Xem bài đăng',
        en: 'View Post'
      },
      'dashboard.create.socialContent.viewArticle': {
        vi: 'Xem bài viết',
        en: 'View Article'
      },
      'dashboard.create.socialContent.createNewContent': {
        vi: 'Tạo nội dung mới',
        en: 'Create New Content'
      },
      'dashboard.create.socialContent.content': {
        vi: 'Nội dung:',
        en: 'Content:'
      },
      'dashboard.create.socialContent.creatingImage': {
        vi: 'Đang tạo ảnh...',
        en: 'Creating image...'
      },
      'dashboard.create.socialContent.createImage': {
        vi: 'Tạo hình ảnh',
        en: 'Create Image'
      },
      'dashboard.create.socialContent.selectImageFile': {
        vi: 'Chọn file ảnh từ máy tính',
        en: 'Select image file from computer'
      },
      'dashboard.create.socialContent.uploading': {
        vi: 'Đang upload...',
        en: 'Uploading...'
      },
      'dashboard.create.socialContent.posted': {
        vi: 'Đã đăng',
        en: 'Posted'
      },
      'dashboard.create.socialContent.postNow': {
        vi: 'Đăng ngay',
        en: 'Post Now'
      },
      'dashboard.create.socialContent.postAndSchedule': {
        vi: 'Đăng bài và Lên lịch',
        en: 'Post and Schedule'
      },
      'dashboard.create.socialContent.choosePostOrSchedule': {
        vi: 'Chọn đăng ngay hoặc lên lịch cho từng nền tảng',
        en: 'Choose to post now or schedule for each platform'
      },
      'dashboard.create.socialContent.connected': {
        vi: 'Đã kết nối',
        en: 'Connected'
      },
      'dashboard.create.socialContent.schedule': {
        vi: 'Đặt lịch',
        en: 'Schedule'
      },
      'dashboard.create.socialContent.scheduledArticle': {
        vi: 'Bài viết đã lên lịch',
        en: 'Scheduled Article'
      },
      'dashboard.create.socialContent.scheduled': {
        vi: 'Đã lên lịch',
        en: 'Scheduled'
      },
      'dashboard.create.socialContent.scheduleFor': {
        vi: 'Lên lịch cho',
        en: 'Schedule for'
      },
      'dashboard.create.socialContent.postError': {
        vi: 'Lỗi đăng bài',
        en: 'Post Error'
      },
      'dashboard.create.socialContent.noContentError': {
        vi: 'Không có nội dung đã tạo cho nền tảng này. Vui lòng tạo nội dung trước khi đăng bài.',
        en: 'No content created for this platform. Please create content before posting.'
      },
      'dashboard.create.socialContent.noContentScheduleError': {
        vi: 'Không có nội dung đã tạo cho nền tảng này. Vui lòng tạo nội dung trước khi lên lịch.',
        en: 'No content created for this platform. Please create content before scheduling.'
      },
      'dashboard.create.socialContent.error': {
        vi: 'Lỗi',
        en: 'Error'
      },
      'dashboard.create.socialContent.selectTimeError': {
        vi: 'Vui lòng chọn thời gian đăng',
        en: 'Please select a posting time'
      },
      'dashboard.create.socialContent.futureTimeError': {
        vi: 'Thời gian đăng phải sau thời điểm hiện tại',
        en: 'Posting time must be in the future'
      },
      'dashboard.create.socialContent.scheduleError': {
        vi: 'Lỗi lên lịch',
        en: 'Schedule Error'
      },
      'dashboard.create.socialContent.publishSuccess': {
        vi: 'Đăng thành công',
        en: 'Posted Successfully'
      },
      'dashboard.create.socialContent.publishSuccessMessage': {
        vi: 'Bài viết đã được đăng lên',
        en: 'Post has been published to'
      },
      'dashboard.create.socialContent.publishSuccessFull': {
        vi: 'Đăng bài thành công!',
        en: 'Post published successfully!'
      },
      'dashboard.create.socialContent.image': {
        vi: 'Hình ảnh:',
        en: 'Image:'
      },
      'dashboard.create.socialContent.scheduleSuccessFull': {
        vi: 'Lên lịch thành công!',
        en: 'Scheduled successfully!'
      },
      'dashboard.create.socialContent.step1.title': {
        vi: 'Bước 1: Trích xuất nội dung',
        en: 'Step 1: Content Extraction'
      },
      'dashboard.create.socialContent.contentSourceLabel': {
        vi: 'Nguồn nội dung',
        en: 'Content Source'
      },
      'dashboard.create.socialContent.contentSource.existingArticle': {
        vi: 'Từ bài viết có sẵn',
        en: 'From Existing Article'
      },
      'dashboard.create.socialContent.contentSource.manual': {
        vi: 'Nhập thủ công',
        en: 'Manual Input'
      },
      'dashboard.create.socialContent.contentSource.createNew': {
        vi: 'Tạo bài viết mới',
        en: 'Create New Article'
      },
      'dashboard.create.socialContent.briefDescriptionRequired': {
        vi: 'Mô tả nội dung *',
        en: 'Content Description *'
      },
      'dashboard.create.socialContent.briefDescriptionPlaceholder': {
        vi: 'Nhập mô tả ngắn gọn về nội dung bạn muốn tạo...',
        en: 'Enter a brief description of the content you want to create...'
      },
      'dashboard.create.socialContent.referenceUrlOptional': {
        vi: 'URL tham khảo (tùy chọn)',
        en: 'Reference URL (optional)'
      },
      'dashboard.create.socialContent.urlPlaceholder': {
        vi: 'https://example.com/bai-viet-tham-khao',
        en: 'https://example.com/reference-article'
      },
      'dashboard.create.socialContent.targetPlatformsRequired': {
        vi: 'Nền tảng mục tiêu *',
        en: 'Target Platforms *'
      },
      'dashboard.create.socialContent.extractAndContinue': {
        vi: 'Trích xuất & Tiếp tục',
        en: 'Extract & Continue'
      },
      'dashboard.create.socialContent.selectSeoArticle': {
        vi: 'Chọn bài viết SEO',
        en: 'Select SEO Article'
      },
      'dashboard.create.socialContent.foundArticles': {
        vi: 'Tìm thấy 23 bài viết SEO trong "Bài viết của tôi"',
        en: 'Found 23 SEO articles in "My Articles"'
      },
      'dashboard.create.socialContent.selectSeoPlaceholder': {
        vi: 'Chọn bài viết SEO...',
        en: 'Select SEO article...'
      },
      'dashboard.create.socialContent.searchArticlePlaceholder': {
        vi: 'Tìm kiếm bài viết...',
        en: 'Search articles...'
      },
      'dashboard.create.socialContent.mainTopicRequired': {
        vi: 'Chủ đề chính *',
        en: 'Main Topic *'
      },
      'dashboard.create.socialContent.topicPlaceholder': {
        vi: 'Ví dụ: Cây cảnh xanh trong nhà',
        en: 'Example: Indoor green plants'
      },
      'dashboard.create.socialContent.keywordsRequired': {
        vi: 'Từ khóa *',
        en: 'Keywords *'
      },
      'dashboard.create.socialContent.keywordsPlaceholder': {
        vi: 'Ví dụ: cây cảnh xanh, chăm sóc cây, không gian xanh',
        en: 'Example: green plants, plant care, green space'
      },
      'dashboard.create.socialContent.createAndExtract': {
        vi: 'Tạo bài viết & Trích xuất',
        en: 'Create Article & Extract'
      },
      'dashboard.create.socialContent.noSeoArticles': {
        vi: 'Chưa có bài viết SEO nào',
        en: 'No SEO articles yet'
      },
      'dashboard.create.socialContent.createSeoFirst': {
        vi: 'Hãy tạo bài viết SEO trước trong mục "Tạo nội dung"',
        en: 'Please create SEO articles first in the "Create Content" section'
      },
      'common.loading': {
        vi: 'Đang tải...',
        en: 'Loading...'
      },
      'dashboard.create.socialContent.selectFromLibrary': {
        vi: 'Chọn ảnh từ thư viện',
        en: 'Select from library'
      },
      'dashboard.create.socialContent.saveSuccess': {
        vi: 'Nội dung và hình ảnh đã được lưu thành công',
        en: 'Content and images saved successfully'
      },
      'common.completed': {
        vi: 'Hoàn thành',
        en: 'Completed'
      },
      'dashboard.create.socialContent.noContentToPost': {
        vi: 'Không có nội dung để đăng',
        en: 'No content to post'
      },
      'common.error': {
        vi: 'Lỗi',
        en: 'Error'
      },
      'dashboard.imageLibrary.title': {
        vi: 'Thư viện hình ảnh AI',
        en: 'AI Image Library'
      },
      'dashboard.imageLibrary.description': {
        vi: 'Quản lý và xem lại tất cả hình ảnh đã tạo bằng AI',
        en: 'Manage and review all AI-generated images'
      },
      'dashboard.imageLibrary.imageCount': {
        vi: 'hình ảnh',
        en: 'images'
      },
      'common.search': {
        vi: 'Tìm kiếm',
        en: 'Search'
      },
      'common.status': {
        vi: 'Trạng thái',
        en: 'Status'
      },
      'dashboard.imageLibrary.noImages': {
        vi: 'Chưa có hình ảnh nào',
        en: 'No images yet'
      },
      'dashboard.imageLibrary.noImagesFiltered': {
        vi: 'Không tìm thấy hình ảnh nào phù hợp với bộ lọc.',
        en: 'No images found matching the filter criteria.'
      },
      'dashboard.imageLibrary.noImagesYet': {
        vi: 'Bạn chưa tạo hình ảnh nào. Hãy bắt đầu tạo hình ảnh đầu tiên!',
        en: 'You haven\'t created any images yet. Start creating your first image!'
      },
      'dashboard.imageLibrary.searchPlaceholder': {
        vi: 'Tìm theo tiêu đề hoặc mô tả...',
        en: 'Search by title or description...'
      },
      'dashboard.imageLibrary.statusAll': {
        vi: 'Tất cả',
        en: 'All'
      },
      'dashboard.imageLibrary.statusCreated': {
        vi: 'Đã tạo',
        en: 'Created'
      },
      'dashboard.imageLibrary.statusSaved': {
        vi: 'Đã lưu',
        en: 'Saved'
      },
      'dashboard.imageLibrary.statusCompleted': {
        vi: 'Hoàn thành',
        en: 'Completed'
      },
      // Credits page translations
      'dashboard.credits.title': {
        vi: 'Tín dụng',
        en: 'Credits'
      },
      'dashboard.credits.currentBalance': {
        vi: 'Số dư hiện tại',
        en: 'Current Balance'
      },
      'dashboard.credits.usageDescription': {
        vi: 'Sử dụng tín dụng để tạo nội dung SEO. Mỗi lần tạo nội dung tốn 1-3 tín dụng tùy thuộc vào độ dài.',
        en: 'Use credits to create SEO content. Each content creation costs 1-3 credits depending on length.'
      },
      'dashboard.credits.specialPromotion': {
        vi: 'Khuyến mãi đặc biệt',
        en: 'Special Promotion'
      },
      'dashboard.credits.limitedOffer': {
        vi: 'Ưu đãi có thời hạn',
        en: 'Limited Time Offer'
      },
      'dashboard.credits.bonusOffer': {
        vi: 'Nhận thêm 5 tín dụng khi mua bất kỳ gói nào!',
        en: 'Get 5 extra credits when you buy any package!'
      },
      'dashboard.credits.validUntil': {
        vi: 'Có hiệu lực đến cuối tháng này',
        en: 'Valid until the end of this month'
      },
      'dashboard.credits.basicPlan': {
        vi: 'Gói Cơ Bản',
        en: 'Basic Plan'
      },
      'dashboard.credits.professionalPlan': {
        vi: 'Gói Chuyên Nghiệp',
        en: 'Professional Plan'
      },
      'dashboard.credits.enterprisePlan': {
        vi: 'Gói Doanh Nghiệp',
        en: 'Enterprise Plan'
      },
      'dashboard.credits.freePlan': {
        vi: 'Gói Miễn Phí',
        en: 'Free Plan'
      },
      'dashboard.credits.wordsPerCredit': {
        vi: 'từ/tín dụng',
        en: 'words/credit'
      },
      'dashboard.credits.loadingPlans': {
        vi: 'Đang tải gói dịch vụ...',
        en: 'Loading plans...'
      },
      'dashboard.credits.purchaseSuccess': {
        vi: 'Mua thành công',
        en: 'Purchase Successful'
      },
      'dashboard.credits.purchaseSuccessDesc': {
        vi: 'Bạn đã mua {amount} tín dụng',
        en: 'You have purchased {amount} credits'
      },
      'dashboard.credits.purchaseFailed': {
        vi: 'Mua không thành công',
        en: 'Purchase Failed'
      },
      'common.generating': {
        vi: 'Đang tạo...',
        en: 'Generating...'
      }
    };

    return (key: string, fallback?: string): string => {
      // Check hard-coded translations first
      const hardcoded = hardcodedTranslations[key];
      if (hardcoded) {
        const result = language === 'en' ? hardcoded.en : hardcoded.vi;
        console.log(`[useDbTranslations] Using hardcoded translation for ${key}: "${result}" (language: ${language})`);
        return result;
      }

      // Fall back to database translations
      if (!translations || translations.length === 0) {
        console.log(`[useDbTranslations] No translations loaded, returning fallback for ${key} (current language: ${language})`);
        return fallback || key;
      }

      const translation = translations.find((t: Translation) => t.key === key);
      
      if (translation) {
        const result = language === 'en' ? translation.en : translation.vi;
        console.log(`[useDbTranslations] Found database translation for ${key}: "${result}" (language: ${language})`);
        return result || fallback || key;
      }
      
      console.log(`[useDbTranslations] No translation found for ${key}, returning fallback (current language: ${language})`);
      return fallback || key;
    };
  }, [translations, language]);

  return { t, isLoading, language };
}