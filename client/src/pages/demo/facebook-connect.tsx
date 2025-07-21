import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Facebook, CheckCircle, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface FacebookUser {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    }
  };
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

export default function FacebookConnect() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<FacebookUser | null>(null);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const FACEBOOK_APP_ID = '665827136508049';

  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0'
      });
      
      setIsSDKLoaded(true);
      
      // Check if user is already logged in with error handling
      try {
        window.FB.getLoginStatus(function(response: any) {
          if (response && response.status === 'connected') {
            setIsLoggedIn(true);
            setAccessToken(response.authResponse.accessToken);
            getUserInfo();
            getPermissions();
          }
        }, { force: false }); // Don't force roundtrip to server
      } catch (error) {
        console.log('Facebook login status check failed:', error);
        // Ignore the error and continue
      }
    };

    // Load Facebook SDK script
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.head.appendChild(script);
    }
  }, []);

  const getUserInfo = () => {
    try {
      window.FB.api('/me', { fields: 'id,name,picture' }, function(response: FacebookUser) {
        if (response && !response.error) {
          setUser(response);
        } else {
          console.error('Error getting user info:', response.error);
        }
      });
    } catch (error) {
      console.error('Error calling FB API for user info:', error);
    }
  };

  const getPermissions = () => {
    try {
      window.FB.api('/me/permissions', function(response: any) {
        if (response && response.data && !response.error) {
          const grantedPermissions = response.data
            .filter((perm: any) => perm.status === 'granted')
            .map((perm: any) => perm.permission);
          setPermissions(grantedPermissions);
        } else {
          console.error('Error getting permissions:', response.error);
        }
      });
    } catch (error) {
      console.error('Error calling FB API for permissions:', error);
    }
  };

  const getPages = () => {
    setLoading(true);
    try {
      window.FB.api('/me/accounts', { fields: 'id,name,access_token,category' }, function(response: any) {
        if (response && response.data && !response.error) {
          setPages(response.data);
        } else {
          console.error('Error getting pages:', response.error);
          alert('Lỗi khi lấy danh sách trang: ' + (response.error?.message || 'Unknown error'));
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error calling FB API for pages:', error);
      setLoading(false);
    }
  };

  const login = () => {
    setLoading(true);
    try {
      window.FB.login(function(response: any) {
        setLoading(false);
        if (response && response.authResponse) {
          setIsLoggedIn(true);
          setAccessToken(response.authResponse.accessToken);
          getUserInfo();
          getPermissions();
          getPages();
        } else {
          console.error('Facebook login failed:', response);
          alert('Đăng nhập Facebook thất bại: ' + (response.error?.message || 'Người dùng từ chối đăng nhập'));
        }
      }, { 
        scope: 'public_profile,pages_manage_posts,pages_read_engagement,manage_pages,pages_show_list',
        return_scopes: true
      });
    } catch (error) {
      setLoading(false);
      console.error('Error during Facebook login:', error);
      alert('Lỗi khi đăng nhập Facebook: ' + error);
    }
  };

  const logout = () => {
    try {
      window.FB.logout(function() {
        setIsLoggedIn(false);
        setUser(null);
        setPages([]);
        setAccessToken('');
        setPermissions([]);
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Reset state anyway
      setIsLoggedIn(false);
      setUser(null);
      setPages([]);
      setAccessToken('');
      setPermissions([]);
    }
  };

  const saveConnection = async (page: FacebookPage) => {
    try {
      const response = await fetch('/api/social-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'facebook',
          name: page.name,
          config: {
            accountId: page.id,
            accessToken: page.access_token,
            category: page.category,
            userAccessToken: accessToken
          }
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Đã lưu kết nối cho trang: ${page.name}`);
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving connection:', error);
      alert('Có lỗi xảy ra khi lưu kết nối');
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang tải Facebook SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Facebook Connect Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test kết nối Facebook với App ID: {FACEBOOK_APP_ID}
          </p>
        </div>

        {/* Login Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-blue-600" />
              Trạng thái đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isLoggedIn ? (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Chưa đăng nhập Facebook
                </p>
                <Button 
                  onClick={login} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập Facebook'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">Đã đăng nhập thành công</span>
                </div>
                
                {user && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {user.picture && (
                      <img 
                        src={user.picture.data.url} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-500">ID: {user.id}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={getPages} disabled={loading}>
                    {loading ? 'Đang tải...' : 'Lấy danh sách trang'}
                  </Button>
                  <Button variant="outline" onClick={logout}>
                    Đăng xuất
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access Token */}
        {accessToken && (
          <Card>
            <CardHeader>
              <CardTitle>Access Token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <code className="text-sm break-all">{accessToken}</code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permissions */}
        {permissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quyền đã cấp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => (
                  <Badge key={permission} variant="secondary">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pages */}
        {pages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách trang Facebook</CardTitle>
              <CardDescription>
                Chọn trang bạn muốn kết nối để đăng bài tự động
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{page.name}</h4>
                      <p className="text-sm text-gray-500">
                        ID: {page.id} • Loại: {page.category}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => saveConnection(page)}
                    >
                      Lưu kết nối
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>SDK Loaded:</strong> {isSDKLoaded ? 'Yes' : 'No'}</p>
              <p><strong>Logged In:</strong> {isLoggedIn ? 'Yes' : 'No'}</p>
              <p><strong>App ID:</strong> {FACEBOOK_APP_ID}</p>
              <p><strong>Pages Count:</strong> {pages.length}</p>
              <p><strong>Permissions Count:</strong> {permissions.length}</p>
              <p><strong>User:</strong> {user ? user.name : 'Not loaded'}</p>
              <p><strong>Access Token:</strong> {accessToken ? 'Present' : 'None'}</p>
            </div>
            
            {/* Help section */}
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Lưu ý quan trọng:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Facebook App cần được cấu hình đúng domain</li>
                <li>• Cần có quyền pages_manage_posts để đăng bài</li>
                <li>• Account Facebook phải là Business Account</li>
                <li>• Nếu lỗi CORS, hãy thử trên domain chính thức</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}