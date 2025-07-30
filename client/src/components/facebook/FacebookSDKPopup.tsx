import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Facebook } from 'lucide-react';

interface FacebookSDKPopupProps {
  onSuccess: (accessToken: string, userInfo: any) => void;
  onError: (error: any) => void;
  loading?: boolean;
}

// Declare Facebook SDK types
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookSDKPopup({ onSuccess, onError, loading }: FacebookSDKPopupProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      // Check if SDK is already loaded
      if (window.FB) {
        setIsSDKLoaded(true);
        return;
      }

      // Initialize Facebook SDK
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '665827136508049',
          cookie: true,
          xfbml: true,
          version: 'v21.0'
        });
        
        // Override the getLoginStatus to prevent CORS errors
        const originalGetLoginStatus = window.FB.getLoginStatus;
        window.FB.getLoginStatus = function(callback: any, forceRefresh?: boolean) {
          try {
            originalGetLoginStatus.call(this, function(response: any) {
              callback(response);
            }, forceRefresh);
          } catch (error) {
            console.log('Error retrieving login status, fetch cancelled.');
            // Return a default "unknown" status to prevent errors
            callback({ status: 'unknown', authResponse: null });
          }
        };
        
        setIsSDKLoaded(true);
        console.log('Facebook SDK initialized with v21.0 (from user HTML)');
      };

      // Load SDK script
      (function(d, s, id) {
        let js: any, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); 
        js.id = id;
        js.src = "https://connect.facebook.net/vi_VN/sdk.js";
        if (fjs && fjs.parentNode) {
          fjs.parentNode.insertBefore(js, fjs);
        }
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();
  }, []);

  const handleFacebookLogin = () => {
    if (!isSDKLoaded || !window.FB) {
      toast({
        title: "Lỗi",
        description: "Facebook SDK chưa được tải. Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    window.FB.login(function(response: any) {
      setIsConnecting(false);
      
      if (response.authResponse) {
        const { accessToken } = response.authResponse;
        
        // Get user info (removed email field - requires app review)
        window.FB.api('/me', { fields: 'id,name,picture' }, function(userInfo: any) {
          if (userInfo && !userInfo.error) {
            // Check permissions
            window.FB.api('/me/permissions', function(permResponse: any) {
              console.log('Access Token:', accessToken);
              console.log('User Info:', userInfo);
              console.log('Permissions:', permResponse.data);
              
              onSuccess(accessToken, {
                ...userInfo,
                permissions: permResponse.data
              });

              toast({
                title: "Thành công",
                description: `Đã kết nối với Facebook thành công cho ${userInfo.name}`,
                variant: "default",
              });
            });
          } else {
            const error = userInfo?.error || 'Không thể lấy thông tin người dùng';
            onError(error);
            toast({
              title: "Lỗi",
              description: `Lỗi lấy thông tin: ${error.message || error}`,
              variant: "destructive",
            });
          }
        });
      } else {
        const error = response.error || 'Đăng nhập thất bại';
        onError(error);
        toast({
          title: "Đăng nhập thất bại",
          description: error.message || 'Người dùng đã hủy đăng nhập hoặc không cấp quyền',
          variant: "destructive",
        });
      }
    }, {
      scope: 'public_profile,pages_manage_posts,pages_read_engagement,publish_to_groups'
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Kết nối Facebook</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Nhấn vào nút bên dưới để mở popup đăng nhập Facebook và cấp quyền cho ứng dụng
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Lưu ý:</strong> Để đăng bài lên Facebook, bạn cần cấp các quyền: pages_manage_posts, pages_read_engagement, và publish_to_groups. 
            Nếu popup yêu cầu permissions bị từ chối, bạn có thể thử lại hoặc liên hệ admin.
          </p>
        </div>
      </div>

      <Button
        onClick={handleFacebookLogin}
        disabled={!isSDKLoaded || isConnecting || loading}
        className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white"
        size="lg"
      >
        {isConnecting || loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang kết nối...
          </>
        ) : !isSDKLoaded ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải Facebook SDK...
          </>
        ) : (
          <>
            <Facebook className="mr-2 h-4 w-4" />
            Đăng nhập bằng Facebook
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong>Quyền yêu cầu:</strong></p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>public_profile - Truy cập thông tin cơ bản (tên, ID, ảnh đại diện)</li>
        </ul>
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          <strong>Lưu ý:</strong> Scope 'email' và permissions nâng cao cần Facebook App Review để sử dụng
        </p>
      </div>
    </div>
  );
}