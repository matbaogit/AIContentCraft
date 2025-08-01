import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Facebook, Users, Shield, CheckCircle } from 'lucide-react';
import { useDbTranslations } from '@/hooks/use-db-translations';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookUser {
  id: string;
  name: string;
  picture: {
    data: {
      url: string;
    };
  };
}

interface FacebookConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'login' | 'selectPages' | 'confirm' | 'success';

export function FacebookConnectionWizard({ isOpen, onClose }: FacebookConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('login');
  const [userAccessToken, setUserAccessToken] = useState<string>('');
  const [userInfo, setUserInfo] = useState<FacebookUser | null>(null);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useDbTranslations();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('login');
      setUserAccessToken('');
      setUserInfo(null);
      setAvailablePages([]);
      setSelectedPages([]);
      setSdkReady(false);
      
      // Check SDK status periodically
      const checkSDK = () => {
        if (typeof window !== 'undefined' && (window as any).FB) {
          setSdkReady(true);
        }
      };
      
      checkSDK();
      const interval = setInterval(checkSDK, 1000);
      
      // Cleanup interval when component unmounts or isOpen changes
      setTimeout(() => {
        clearInterval(interval);
      }, 10000); // Stop checking after 10 seconds
    }
  }, [isOpen]);

  // Check if Facebook SDK is loaded
  const checkFacebookSDK = (): boolean => {
    if (typeof window !== 'undefined' && (window as any).FB) {
      return true;
    }
    toast({
      title: "Lỗi Facebook SDK",
      description: "Facebook SDK chưa được tải. Vui lòng thử lại sau vài giây.",
      variant: "destructive",
    });
    return false;
  };

  // Step 1: Facebook Login
  const handleFacebookLogin = () => {
    setIsLoading(true);
    
    if (!checkFacebookSDK()) {
      setIsLoading(false);
      return;
    }

    const FB = (window as any).FB;

    FB.login((response: any) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        setUserAccessToken(accessToken);
        
        // Get user info
        FB.api('/me', { fields: 'id,name,picture' }, (userResponse: any) => {
          if (userResponse && !userResponse.error) {
            setUserInfo(userResponse);
            setCurrentStep('selectPages');
            fetchUserPages(accessToken);
          } else {
            toast({
              title: "Lỗi lấy thông tin user",
              description: "Không thể lấy thông tin tài khoản Facebook.",
              variant: "destructive",
            });
          }
          setIsLoading(false);
        });
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: "Bạn đã hủy đăng nhập hoặc có lỗi xảy ra.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }, { 
      scope: 'public_profile,email,pages_manage_posts,pages_read_engagement,pages_show_list'
    });
  };

  // Step 2: Fetch user's pages
  const fetchUserPages = (accessToken: string) => {
    setIsLoading(true);
    
    if (!checkFacebookSDK()) {
      setIsLoading(false);
      return;
    }

    const FB = (window as any).FB;
    
    FB.api('/me/accounts', { access_token: accessToken }, (response: any) => {
      if (response && response.data && !response.error) {
        setAvailablePages(response.data);
      } else {
        toast({
          title: "Lỗi lấy danh sách Pages",
          description: "Không thể lấy danh sách Pages của bạn.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    });
  };

  // Step 3: Handle page selection
  const handlePageToggle = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  // Step 4: Save connections
  const handleSaveConnections = async () => {
    if (selectedPages.length === 0) {
      toast({
        title: "Chọn ít nhất 1 Page",
        description: "Vui lòng chọn ít nhất một Page để kết nối.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedPagesData = availablePages.filter(page => 
        selectedPages.includes(page.id)
      );

      // Save each selected page as a separate connection
      const savePromises = selectedPagesData.map(page => 
        apiRequest('POST', '/api/social-connections', {
          platform: 'facebook',
          accountName: `Facebook Page - ${page.name}`,
          accountId: page.id,
          accessToken: page.access_token, // Page access token with posting permissions
          settings: {
            userInfo,
            pageInfo: {
              id: page.id,
              name: page.name,
              category: page.category,
              tasks: page.tasks,
              picture: page.picture
            },
            connectedAt: new Date().toISOString(),
            method: 'oauth_wizard',
            permissions: ['pages_manage_posts', 'pages_read_engagement']
          }
        })
      );

      await Promise.all(savePromises);

      // Invalidate social connections cache
      queryClient.invalidateQueries({ queryKey: ['/api/social-connections'] });

      setCurrentStep('success');
      
      toast({
        title: "Kết nối thành công",
        description: `Đã kết nối ${selectedPages.length} Facebook Page(s).`,
      });

    } catch (error) {
      console.error('Error saving Facebook connections:', error);
      toast({
        title: "Lỗi lưu kết nối",
        description: "Có lỗi xảy ra khi lưu kết nối Facebook.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('login');
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'login':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Facebook className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('facebookWizard.connectAccount', 'Kết nối tài khoản Facebook')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('facebookWizard.loginDescription', 'Đăng nhập vào Facebook để lấy danh sách Pages bạn quản lý')}
              </p>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${sdkReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm ${sdkReady ? 'text-green-600' : 'text-yellow-600'}`}>
                  {sdkReady ? t('facebookWizard.sdkReady', 'Facebook SDK sẵn sàng') : t('facebookWizard.sdkLoading', 'Đang tải Facebook SDK...')}
                </span>
              </div>
            </div>
            <Button 
              onClick={handleFacebookLogin}
              disabled={isLoading || !sdkReady}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <Facebook className="w-4 h-4 mr-2" />
                  {t('facebookWizard.loginWithFacebook', 'Đăng nhập với Facebook')}
                </>
              )}
            </Button>
          </div>
        );

      case 'selectPages':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('facebookWizard.selectPages', 'Chọn Pages muốn kết nối')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('facebookWizard.selectPagesDescription', 'Chọn các Facebook Pages bạn muốn kết nối để đăng bài')}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availablePages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không tìm thấy Pages nào. Bạn cần là admin của ít nhất một Facebook Page.
                  </div>
                ) : (
                  availablePages.map((page) => (
                    <Card key={page.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedPages.includes(page.id)}
                            onCheckedChange={() => handlePageToggle(page.id)}
                          />
                          {page.picture && (
                            <img 
                              src={page.picture.data.url} 
                              alt={page.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{page.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{page.category}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {page.tasks?.map((task) => (
                                <Badge key={task} variant="secondary" className="text-xs">
                                  {task}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep('login')}>
                {t('facebookWizard.goBack', 'Quay lại')}
              </Button>
              <Button 
                onClick={() => setCurrentStep('confirm')}
                disabled={selectedPages.length === 0}
              >
                {t('facebookWizard.nextStepSelected', 'Tiếp theo ({count} được chọn)').replace('{count}', selectedPages.length.toString())}
              </Button>
            </div>
          </div>
        );

      case 'confirm':
        const selectedPagesData = availablePages.filter(page => 
          selectedPages.includes(page.id)
        );

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Xác nhận kết nối</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Xác nhận các Pages sẽ được kết nối với quyền đăng bài
              </p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedPagesData.map((page) => (
                <Card key={page.id} className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      {page.picture && (
                        <img 
                          src={page.picture.data.url} 
                          alt={page.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{page.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{page.category}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400">
                        Có quyền đăng bài
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Quyền được cấp:</p>
                  <ul className="mt-1 text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Đăng bài lên Pages được chọn</li>
                    <li>• Đọc engagement metrics</li>
                    <li>• Quản lý nội dung Posts</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep('selectPages')}>
                {t('facebookWizard.goBack', 'Quay lại')}
              </Button>
              <Button 
                onClick={handleSaveConnections}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Hoàn tất kết nối
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Kết nối thành công!</h3>
              <p className="text-gray-600">
                Đã kết nối {selectedPages.length} Facebook Page(s). Bạn có thể sử dụng chúng để đăng bài tự động.
              </p>
            </div>
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              Hoàn tất
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('facebookWizard.title', 'Kết nối Facebook Pages')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}