import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface LegalPage {
  id: string;
  title_vi: string;
  title_en: string;
  content_vi: string;
  content_en: string;
  lastUpdated: string;
  path: string;
  description: string;
}

export default function TermsOfService() {
  const { language } = useLanguage();

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ["/api/legal-pages/terms-of-service"],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Đang tải nội dung...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pageData?.success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center">
            <CardContent className="py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Không thể tải nội dung
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Xin lỗi, chúng tôi không thể tải điều khoản dịch vụ lúc này.
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const page: LegalPage = pageData.data;
  const title = language === 'vi' ? page.title_vi : page.title_en;
  const content = language === 'vi' ? page.content_vi : page.content_en;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
          </Link>
          
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300">
            Cập nhật lần cuối: {new Date(page.lastUpdated).toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}