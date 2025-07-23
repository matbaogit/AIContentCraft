import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Facebook, ExternalLink, AlertCircle } from "lucide-react";
import { FacebookSDKPopup } from './FacebookSDKPopup';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from "@/lib/queryClient";

interface FacebookConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSaved?: (connection: any) => void;
}

export function FacebookConnectModal({ open, onOpenChange, onConnectionSaved }: FacebookConnectModalProps) {
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleServerOAuth = () => {
    setConnecting(true);
    // Redirect to server OAuth endpoint
    window.location.href = '/api/auth/facebook?redirect=social-connections';
  };

  const handleManualSetup = () => {
    // Close modal and let parent handle manual form
    onOpenChange(false);
  };

  const handlePopupSuccess = async (accessToken: string, userInfo: any) => {
    try {
      setSaving(true);
      
      // Save connection to database
      const connectionData = {
        platform: 'facebook',
        accountName: `Facebook - ${userInfo.name}`,
        accessToken: accessToken,
        accountId: userInfo.id,
        settings: {
          userInfo: userInfo,
          connectedAt: new Date().toISOString(),
          method: 'popup_sdk'
        }
      };

      const response = await fetch('/api/social-connections', {
        method: 'POST',
        body: JSON.stringify(connectionData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Thành công",
          description: `Đã lưu kết nối Facebook cho ${userInfo.name}`,
        });

        if (onConnectionSaved) {
          onConnectionSaved(result.data);
        }
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Lỗi không xác định');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi lưu kết nối",
        description: error.message || 'Không thể lưu kết nối Facebook',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePopupError = (error: any) => {
    toast({
      title: "Lỗi kết nối",
      description: error.message || 'Không thể kết nối với Facebook',
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-600" />
            Kết nối Facebook
          </DialogTitle>
          <DialogDescription>
            Chọn phương thức kết nối Facebook phù hợp với bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Popup SDK Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phương thức 1: Facebook SDK Popup</CardTitle>
              <CardDescription>
                Sử dụng popup Facebook JavaScript SDK để kết nối (Khuyến nghị)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Badge variant="secondary">Nhanh chóng</Badge>
                <Badge variant="secondary">Popup</Badge>
                <Badge variant="secondary">SDK</Badge>
              </div>
              
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Mở popup Facebook trong trang hiện tại</li>
                <li>• Lấy Access Token tự động</li>
                <li>• Hỗ trợ quyền cơ bản public_profile (email cần app review)</li>
                <li>• Không cần chuyển trang</li>
              </ul>

              <FacebookSDKPopup 
                onSuccess={handlePopupSuccess}
                onError={handlePopupError}
                loading={saving}
              />
            </CardContent>
          </Card>

          {/* OAuth Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phương thức 2: OAuth tự động</CardTitle>
              <CardDescription>
                Sử dụng Facebook OAuth để kết nối tự động
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Badge variant="secondary">Dễ dàng</Badge>
                <Badge variant="secondary">An toàn</Badge>
                <Badge variant="secondary">Tự động</Badge>
              </div>
              
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Tự động lấy Access Token</li>
                <li>• Hiển thị danh sách trang Facebook</li>
                <li>• Không cần nhập thông tin thủ công</li>
              </ul>

              <Button 
                onClick={handleServerOAuth}
                disabled={connecting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Facebook className="w-4 h-4 mr-2" />
                {connecting ? 'Đang kết nối...' : 'Kết nối với Facebook OAuth'}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phương thức 3: Nhập thủ công</CardTitle>
              <CardDescription>
                Nhập Access Token và thông tin trang Facebook thủ công
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Badge variant="outline">Thủ công</Badge>
                <Badge variant="outline">Linh hoạt</Badge>
              </div>

              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Cần có sẵn Page Access Token</li>
                <li>• Phù hợp khi OAuth gặp lỗi</li>
                <li>• Có thể sử dụng token từ Facebook Developers</li>
              </ul>

              <Button 
                variant="outline" 
                onClick={handleManualSetup}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Nhập thông tin thủ công
              </Button>
            </CardContent>
          </Card>

          {/* Demo Method */}
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Phương thức 4: Test Demo
              </CardTitle>
              <CardDescription>
                Sử dụng trang demo để test Facebook JavaScript SDK
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Demo</Badge>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Test only</Badge>
              </div>

              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Chỉ để test và debug</li>
                <li>• Có thể gặp lỗi CORS</li>
                <li>• Hiển thị thông tin debug chi tiết</li>
              </ul>

              <Button 
                variant="outline"
                onClick={() => window.open('/demo/facebook-connect', '_blank')}
                className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Mở trang Demo Facebook Connect
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              💡 Lưu ý quan trọng:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Facebook App phải được cấu hình đúng domain</li>
              <li>• Hiện chỉ sử dụng quyền cơ bản: public_profile, email</li>
              <li>• Account Facebook phải là Business Account</li>
              <li>• Nếu gặp lỗi, hãy thử phương thức nhập thủ công</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}