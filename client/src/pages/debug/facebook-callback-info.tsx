import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FacebookCallbackInfo() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Get current domain
  const currentDomain = window.location.host;
  const protocol = window.location.protocol;
  const callbackUrl = `${protocol}//${currentDomain}/api/auth/facebook/callback`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Đã sao chép",
      description: "Callback URL đã được sao chép vào clipboard"
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const openFacebookConsole = () => {
    window.open('https://developers.facebook.com/apps/', '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Facebook Callback URL Info</h1>
        <Badge variant="outline">OAuth Configuration</Badge>
      </div>

      {/* Current Callback URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Callback URL</CardTitle>
          <CardDescription>
            Sử dụng URL này trong Facebook App Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <code className="flex-1 text-sm font-mono break-all">
              {callbackUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(callbackUrl)}
              className="shrink-0"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={openFacebookConsole} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Mở Facebook Console
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn cấu hình</CardTitle>
          <CardDescription>
            Làm theo các bước này để cấu hình Facebook App
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="shrink-0">1</Badge>
              <div>
                <p className="font-medium">Truy cập Facebook Developer Console</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vào https://developers.facebook.com/apps/ và chọn app của bạn
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge className="shrink-0">2</Badge>
              <div>
                <p className="font-medium">Cấu hình OAuth Settings</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  App Settings → Basic → Add Platform → Website
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge className="shrink-0">3</Badge>
              <div>
                <p className="font-medium">Thêm Valid OAuth Redirect URIs</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Facebook Login → Settings → Valid OAuth Redirect URIs
                </p>
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <code className="text-sm text-blue-600 dark:text-blue-400">
                    {callbackUrl}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge className="shrink-0">4</Badge>
              <div>
                <p className="font-medium">Kiểm tra App Domain</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  App Settings → Basic → App Domains
                </p>
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <code className="text-sm text-blue-600 dark:text-blue-400">
                    {currentDomain}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hiện tại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Protocol</p>
              <p className="font-mono">{protocol}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Domain</p>
              <p className="font-mono">{currentDomain}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Callback Path</p>
              <p className="font-mono">/api/auth/facebook/callback</p>
            </div>
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Facebook API Version</p>
              <p className="font-mono">v21.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="text-yellow-700 dark:text-yellow-300">💡 Lưu ý quan trọng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• URL callback phải khớp chính xác với cấu hình trong Facebook Console</p>
          <p>• Facebook App phải ở Live mode để người dùng khác có thể sử dụng</p>
          <p>• Hiện tại chỉ sử dụng permissions cơ bản: public_profile, email</p>
          <p>• Nếu cần permissions khác (pages_*), phải qua App Review</p>
        </CardContent>
      </Card>
    </div>
  );
}