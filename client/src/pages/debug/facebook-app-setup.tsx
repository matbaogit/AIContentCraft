import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function FacebookAppSetup() {
  const { toast } = useToast();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: `${label} đã được sao chép vào clipboard`
    });
  };

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const redirectUri = `${window.location.protocol}//${window.location.host}/api/auth/facebook/callback`;

  const requiredFields = [
    {
      id: "app-icon",
      title: "Biểu tượng ứng dụng (1024 x 1024)",
      description: "Logo của ứng dụng với kích thước chính xác 1024x1024 pixel",
      action: "Tạo/Upload logo",
      details: [
        "Kích thước: 1024 x 1024 pixel",
        "Định dạng: PNG hoặc JPG",
        "Chất lượng cao, không bị mờ",
        "Nền trong suốt (khuyến nghị)"
      ]
    },
    {
      id: "privacy-policy",
      title: "URL chính sách quyền riêng tư",
      description: "Link đến trang chính sách bảo mật của ứng dụng",
      action: "Sử dụng URL có sẵn",
      details: [
        "✅ Trang đã được tạo sẵn tại: /privacy-policy",
        `🔗 URL đầy đủ: ${window.location.protocol}//${window.location.host}/privacy-policy`,
        "Nội dung đầy đủ về việc xử lý dữ liệu người dùng",
        "Bao gồm thông tin về Facebook data usage"
      ]
    },
    {
      id: "data-deletion",
      title: "Xóa dữ liệu người dùng",
      description: "URL hoặc hướng dẫn cho phép người dùng xóa dữ liệu",
      action: "Sử dụng URL có sẵn",
      details: [
        "✅ Trang đã được tạo sẵn tại: /data-deletion",
        `🔗 URL đầy đủ: ${window.location.protocol}//${window.location.host}/data-deletion`,
        "Form xử lý yêu cầu xóa dữ liệu tự động",
        "Backup: email privacy@seoaiwriter.com"
      ]
    },
    {
      id: "category",
      title: "Hạng mục ứng dụng",
      description: "Chọn danh mục phù hợp cho ứng dụng",
      action: "Chọn category",
      details: [
        "Business and Pages",
        "Productivity", 
        "Social Media Management",
        "Marketing Tools"
      ]
    }
  ];

  const setupSteps = [
    {
      id: "basic-info",
      title: "1. Cấu hình thông tin cơ bản",
      items: [
        "App Name: SEO AI Writer",
        "App Description: AI-powered content creation and social media management platform",
        "Contact Email: admin@your-domain.com"
      ]
    },
    {
      id: "oauth-settings",
      title: "2. Cấu hình OAuth Settings",
      items: [
        `Valid OAuth Redirect URIs: ${redirectUri}`,
        "Client OAuth Settings: Web",
        "Login với Facebook: Enabled"
      ]
    },
    {
      id: "permissions",
      title: "3. Yêu cầu Permissions",
      items: [
        "public_profile - Để truy cập thông tin profile cơ bản",
        "email - Để lấy địa chỉ email người dùng",
        "Lưu ý: Các permissions khác cần App Review từ Facebook"
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Facebook App Setup Guide</h1>
        <Badge variant="outline">Required for OAuth</Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Facebook yêu cầu các thông tin này để app có thể hoạt động trong production mode. 
          Hiện tại app đang ở development mode nên chỉ admin có thể test.
        </AlertDescription>
      </Alert>

      {/* Required Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Các trường bắt buộc cần bổ sung</CardTitle>
          <CardDescription>Facebook yêu cầu các thông tin sau để phê duyệt app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requiredFields.map((field) => (
            <div key={field.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{field.title}</h3>
                    {completedSteps.includes(field.id) && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{field.description}</p>
                </div>
                <Button
                  size="sm"
                  variant={completedSteps.includes(field.id) ? "outline" : "default"}
                  onClick={() => markStepCompleted(field.id)}
                >
                  {completedSteps.includes(field.id) ? "Completed" : field.action}
                </Button>
              </div>
              
              <div className="space-y-1">
                {field.details.map((detail, index) => (
                  <div key={index} className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <span className="flex-1">{detail}</span>
                    {detail.includes('URL đầy đủ:') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const url = detail.split('URL đầy đủ: ')[1];
                          copyToClipboard(url, 'URL');
                        }}
                        className="ml-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Các bước cấu hình Facebook App</CardTitle>
          <CardDescription>Hướng dẫn chi tiết từng bước</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupSteps.map((step) => (
            <div key={step.id} className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">{step.title}</h3>
              <div className="space-y-2">
                {step.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1 h-1 bg-blue-500 rounded-full" />
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {item}
                    </span>
                    {item.includes(redirectUri) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(redirectUri, 'Redirect URI')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy Policy Template */}
      <Card>
        <CardHeader>
          <CardTitle>Template Privacy Policy</CardTitle>
          <CardDescription>Mẫu chính sách quyền riêng tư cho Facebook App</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm space-y-2">
            <p><strong>Privacy Policy for SEO AI Writer</strong></p>
            <p>Last updated: {new Date().toLocaleDateString('vi-VN')}</p>
            <br />
            <p><strong>1. Data Collection</strong></p>
            <p>We collect Facebook Page access tokens to enable content posting to your Facebook Pages.</p>
            <br />
            <p><strong>2. Data Usage</strong></p>
            <p>Facebook data is used solely for posting content to your authorized Pages and reading engagement metrics.</p>
            <br />
            <p><strong>3. Data Storage</strong></p>
            <p>Access tokens are stored securely and can be deleted by the user at any time.</p>
            <br />
            <p><strong>4. Data Deletion</strong></p>
            <p>Users can request data deletion by contacting admin@your-domain.com</p>
          </div>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => copyToClipboard(
              "Privacy Policy template copied - customize it for your domain",
              "Privacy Policy Template"
            )}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Template
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Các link hữu ích cho việc setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Facebook Console
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://www.canva.com/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Canva (Tạo Logo)
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://privacypolicygenerator.info/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Privacy Policy Generator
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Sau khi hoàn thành tất cả yêu cầu, bạn có thể submit app để Facebook review. 
          Quá trình review thường mất 3-7 ngày làm việc.
        </AlertDescription>
      </Alert>
    </div>
  );
}