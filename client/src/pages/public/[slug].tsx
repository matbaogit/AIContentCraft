import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/providers/LanguageProvider";
import { Helmet } from "react-helmet";

interface PublicPage {
  id: number;
  slug: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  metaDescription?: string;
  metaDescriptionEn?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function PublicPage() {
  const [match, params] = useRoute("/:slug");
  const slug = params?.slug;
  const { currentLanguage } = useLanguage();

  const { data: pageResponse, isLoading, error } = useQuery({
    queryKey: ['/api/public-pages', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Page slug is required');
      return await apiRequest(`/api/public-pages/${slug}`);
    },
    enabled: !!slug,
  });

  const page = pageResponse?.data as PublicPage;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {currentLanguage === 'vi' ? 'Không tìm thấy trang' : 'Page Not Found'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentLanguage === 'vi' 
                  ? 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'
                  : 'The page you are looking for does not exist or has been removed.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get content based on current language
  const title = currentLanguage === 'en' && page.titleEn ? page.titleEn : page.title;
  const content = currentLanguage === 'en' && page.contentEn ? page.contentEn : page.content;
  const metaDescription = currentLanguage === 'en' && page.metaDescriptionEn 
    ? page.metaDescriptionEn 
    : page.metaDescription;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet>
        <title>{title} - SEO AI Writer</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={`${title} - SEO AI Writer`} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`${window.location.origin}/${page.slug}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{currentLanguage === 'vi' ? 'Trang công khai' : 'Public Page'}</Badge>
                  <span className="text-sm text-gray-500">
                    {currentLanguage === 'vi' ? 'Cập nhật' : 'Updated'}: {' '}
                    {new Date(page.updatedAt).toLocaleDateString(
                      currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }
                    )}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h1>
                
                {metaDescription && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {metaDescription}
                  </p>
                )}
              </div>

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div 
                  dangerouslySetInnerHTML={{ __html: content }}
                  className="text-gray-700 dark:text-gray-300"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}