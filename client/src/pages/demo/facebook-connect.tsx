import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function FacebookConnectDemo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const { toast } = useToast();

  const initializeFacebookSDK = () => {
    // Initialize Facebook SDK exactly like user's HTML
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '665827136508049', // Exact App ID from user's HTML
        cookie: true,
        xfbml: true,
        version: 'v21.0' // Exact version from user's HTML, not v23.0
      });
      
      setIsSDKLoaded(true);
      console.log('Facebook SDK initialized with v21.0');
    };

    // Load SDK script exactly like user's HTML
    (function(d, s, id) {
      var js: any, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); 
      js.id = id;
      js.src = "https://connect.facebook.net/vi_VN/sdk.js";
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    }(document, 'script', 'facebook-jssdk'));
  };

  const loginWithFacebook = () => {
    if (!window.FB) {
      toast({
        title: "Lỗi",
        description: "Facebook SDK chưa tải xong",
        variant: "destructive",
      });
      return;
    }

    // Use FB.login exactly like user's HTML
    window.FB.login(function(response: any) {
      console.log('Facebook login response:', response);
      
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        setAccessToken(token);
        
        // Get user info exactly like user's HTML
        window.FB.api('/me', { fields: 'name,email,id' }, function(userResponse: any) {
          console.log('User info:', userResponse);
          setUserInfo(userResponse);
          
          toast({
            title: "Đăng nhập thành công",
            description: `Chào mừng ${userResponse.name}!`,
          });
        });
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: "Người dùng đã hủy đăng nhập hoặc không cấp quyền",
          variant: "destructive",
        });
      }
    }, {
      scope: 'public_profile,email' // Basic permissions that work
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Facebook Connect Demo Test</CardTitle>
            <CardDescription>
              Test Facebook SDK popup với cấu hình đúng từ HTML mẫu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSDKLoaded && (
              <Button onClick={initializeFacebookSDK} className="w-full">
                Tải Facebook SDK (v21.0)
              </Button>
            )}

            {isSDKLoaded && (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    ✅ Facebook SDK đã tải xong (v21.0)
                    <br />
                    App ID: 665827136508049
                  </p>
                </div>

                <Button 
                  onClick={loginWithFacebook}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Đăng nhập Facebook (Popup)
                </Button>
              </div>
            )}

            {userInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin người dùng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Tên:</strong> {userInfo.name}</p>
                  <p><strong>Email:</strong> {userInfo.email || 'N/A'}</p>
                  <p><strong>ID:</strong> {userInfo.id}</p>
                  <div className="mt-3">
                    <p><strong>Access Token (rút gọn):</strong></p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
                      {accessToken.substring(0, 50)}...
                    </code>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <p><strong>Cấu hình test:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>App ID: 665827136508049 (từ HTML mẫu)</li>
                <li>API Version: v21.0 (từ HTML mẫu)</li>
                <li>Domain: connect.facebook.net/vi_VN/sdk.js</li>
                <li>Permissions: public_profile,email</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}