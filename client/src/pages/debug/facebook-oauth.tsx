import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface FacebookOAuthDebugInfo {
  isEnabled: boolean;
  hasAppId: boolean;
  hasAppSecret: boolean;
  appId?: string;
  redirectUri: string;
  authUrl: string;
  callbackUrl: string;
  requiredScopes: string[];
  facebookConsoleUrl: string;
}

export default function FacebookOAuthDebug() {
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<FacebookOAuthDebugInfo | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['/api/admin/settings']
  });

  useEffect(() => {
    if (!settings?.success) return;
    
    const socialSettings = (settings as any)?.data?.socialOAuth || {};
    const currentDomain = window.location.host;
    const protocol = window.location.protocol;
    const redirectUri = `${protocol}//${currentDomain}/api/auth/facebook/callback`;
    
    const info: FacebookOAuthDebugInfo = {
      isEnabled: socialSettings.enableFacebookOAuth === true,
      hasAppId: !!socialSettings.facebookAppId,
      hasAppSecret: !!socialSettings.facebookAppSecret,
      appId: socialSettings.facebookAppId,
      redirectUri,
      authUrl: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${socialSettings.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile,email&response_type=code&state=1`,
      callbackUrl: redirectUri,
      requiredScopes: ['public_profile', 'email'],
      facebookConsoleUrl: 'https://developers.facebook.com/apps/'
    };
    
    setDebugInfo(info);
  }, [settings]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: `${label} đã được sao chép vào clipboard`
    });
  };

  const testFacebookOAuth = () => {
    if (debugInfo?.authUrl) {
      window.open(debugInfo.authUrl, '_blank');
    }
  };

  if (!debugInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Đang tải thông tin debug...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Facebook OAuth Debug</h1>
        <Badge variant={debugInfo.isEnabled ? "default" : "destructive"}>
          {debugInfo.isEnabled ? "Đã bật" : "Đã tắt"}
        </Badge>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái cấu hình</CardTitle>
          <CardDescription>Kiểm tra tình trạng cấu hình Facebook OAuth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${debugInfo.isEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">OAuth {debugInfo.isEnabled ? 'Đã bật' : 'Đã tắt'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${debugInfo.hasAppId ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">App ID {debugInfo.hasAppId ? 'Có' : 'Thiếu'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${debugInfo.hasAppSecret ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">App Secret {debugInfo.hasAppSecret ? 'Có' : 'Thiếu'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết cấu hình</CardTitle>
          <CardDescription>Thông tin chi tiết về cấu hình OAuth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo.appId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Facebook App ID</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md font-mono text-sm">
                <span className="flex-1">{debugInfo.appId}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(debugInfo.appId!, 'App ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Redirect URI</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md font-mono text-sm">
              <span className="flex-1 break-all">{debugInfo.redirectUri}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(debugInfo.redirectUri, 'Redirect URI')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Required Scopes</label>
            <div className="flex flex-wrap gap-2">
              {debugInfo.requiredScopes.map((scope) => (
                <Badge key={scope} variant="secondary">{scope}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">OAuth Auth URL</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md font-mono text-sm">
              <span className="flex-1 break-all">{debugInfo.authUrl}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(debugInfo.authUrl, 'Auth URL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing & Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Testing & Khắc phục sự cố</CardTitle>
          <CardDescription>Công cụ test và hướng dẫn khắc phục</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={testFacebookOAuth}
              disabled={!debugInfo.isEnabled || !debugInfo.hasAppId}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Test OAuth Flow
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(debugInfo.facebookConsoleUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Facebook Console
            </Button>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Hướng dẫn khắc phục lỗi
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>1. Vào Facebook Developers Console</li>
              <li>2. Chọn app của bạn</li>
              <li>3. Vào Settings → Basic</li>
              <li>4. Thêm Redirect URI: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">{debugInfo.redirectUri}</code></li>
              <li>5. Kiểm tra App ID và App Secret có đúng không</li>
              <li>6. Đảm bảo app đã được approve (nếu cần)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Common Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Các lỗi thường gặp</CardTitle>
          <CardDescription>Nguyên nhân và cách khắc phục</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-600 dark:text-red-400">
                "App Not Setup: This app is still in development mode"
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                App chưa được switch sang Live mode hoặc thiếu Privacy Policy URL
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-600 dark:text-red-400">
                "Invalid redirect_uri"
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Redirect URI không khớp với cấu hình trong Facebook Console
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-600 dark:text-red-400">
                "Invalid app_id"
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                App ID không đúng hoặc app đã bị xóa
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium text-yellow-600 dark:text-yellow-400">
                "This app is requesting permissions that are not approved"
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Hiện tại chỉ sử dụng permissions cơ bản (public_profile, email)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}