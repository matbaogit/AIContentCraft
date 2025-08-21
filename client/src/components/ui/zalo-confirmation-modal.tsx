import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, Clock, User, Mail, Phone, Image, Calendar, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ZaloData {
  token: {
    access_token: string;
    refresh_token: string;
    expires_in: string;
    refresh_token_expires_in: string;
  };
  userInfo: {
    id?: string;
    name?: string;
    picture?: {
      data?: {
        url?: string;
      };
    };
    gender?: string;
    birthday?: string;
    locale?: string;
    error?: number;
    message?: string;
  };
  timestamp: number;
}

interface ZaloConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function ZaloConfirmationModal({ isOpen, onClose, onSuccess }: ZaloConfirmationModalProps) {
  const [zaloData, setZaloData] = useState<ZaloData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });
  const { toast } = useToast();

  // Load Zalo data from session storage
  useEffect(() => {
    if (isOpen) {
      console.log('=== ZALO MODAL OPENING ===');
      const sessionData = sessionStorage.getItem('zalo_oauth_data');
      console.log('Session data from storage:', sessionData);
      
      if (sessionData) {
        try {
          const data = JSON.parse(sessionData);
          console.log('Parsed Zalo data:', data);
          
          // Check if data is expired (15 minutes)
          const isExpired = Date.now() - data.timestamp > 15 * 60 * 1000;
          if (isExpired) {
            console.log('Data expired, removing...');
            sessionStorage.removeItem('zalo_oauth_data');
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            return;
          }
          
          setZaloData(data);
          
          // Pre-fill form with Zalo data if available
          if (data.userInfo?.name) {
            console.log('Pre-filling form with name:', data.userInfo.name);
            setFormData(prev => ({
              ...prev,
              fullName: data.userInfo.name,
              email: data.userInfo.email || ''
            }));
          } else {
            console.log('No userInfo.name found in data');
          }
        } catch (err) {
          console.error('Error parsing session data:', err);
          setError('Lỗi đọc dữ liệu đăng nhập. Vui lòng thử lại.');
        }
      } else {
        console.log('No session data found');
        setError('Không tìm thấy dữ liệu đăng nhập. Vui lòng đăng nhập lại.');
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zaloData) {
      setError('Không có dữ liệu Zalo để xử lý.');
      return;
    }

    // Validation
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập tên đầy đủ.');
      return;
    }

    if (formData.fullName.trim().length < 2) {
      setError('Tên phải có ít nhất 2 ký tự.');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email không hợp lệ.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/auth/zalo-confirm/confirm', {
        zaloData,
        userInfo: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim() || null,
        }
      });

      if (response.success) {
        // Clear session data
        sessionStorage.removeItem('zalo_oauth_data');
        
        toast({
          title: "Đăng ký thành công!",
          description: "Tài khoản của bạn đã được tạo thành công.",
        });

        onSuccess(response.data);
        onClose();
      } else {
        throw new Error(response.error || 'Lỗi tạo tài khoản');
      }
    } catch (err: any) {
      console.error('Error confirming Zalo account:', err);
      setError(err.message || 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    // Clear session and force re-login
    sessionStorage.removeItem('zalo_oauth_data');
    onClose();
    
    // Trigger Zalo login again
    window.location.href = '/api/auth/zalo';
  };

  const formatZaloField = (key: string, value: any) => {
    if (value === null || value === undefined) return 'Không có dữ liệu';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderZaloInfo = () => {
    if (!zaloData) return null;

    const { userInfo, token } = zaloData;
    const isIPRestricted = userInfo.error === -501;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">🔍 Toàn bộ dữ liệu từ Zalo API</h3>
          {isIPRestricted ? (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              Hạn chế IP
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Đầy đủ
            </Badge>
          )}
        </div>

        {isIPRestricted && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Do hạn chế địa lý, một số thông tin từ Zalo không thể lấy được. 
              Bạn có thể nhập thông tin bổ sung bên dưới.
            </AlertDescription>
          </Alert>
        )}

        {/* Token Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-blue-600 dark:text-blue-400">🔑 Token Information</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {Object.entries(token || {}).map(([key, value]) => (
              <div key={`token-${key}`} className="flex items-start gap-3 p-2 rounded-md border bg-blue-50 dark:bg-blue-950/30">
                <div className="font-medium text-blue-600 dark:text-blue-400 min-w-[120px]">
                  {key}:
                </div>
                <div className="flex-1 break-all text-xs">
                  {key.includes('token') && typeof value === 'string' && value.length > 20 
                    ? `${value.substring(0, 20)}...` 
                    : formatZaloField(key, value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-green-600 dark:text-green-400">👤 User Information</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {Object.entries(userInfo || {}).map(([key, value]) => (
              <div key={`user-${key}`} className="flex items-start gap-3 p-2 rounded-md border bg-green-50 dark:bg-green-950/30">
                <div className="font-medium text-green-600 dark:text-green-400 min-w-[120px]">
                  {key}:
                </div>
                <div className="flex-1 break-all">
                  {formatZaloField(key, value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Metadata */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-600 dark:text-purple-400">📊 Session Metadata</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-start gap-3 p-2 rounded-md border bg-purple-50 dark:bg-purple-950/30">
              <div className="font-medium text-purple-600 dark:text-purple-400 min-w-[120px]">
                timestamp:
              </div>
              <div className="flex-1">
                {new Date(zaloData.timestamp).toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-md border bg-purple-50 dark:bg-purple-950/30">
              <div className="font-medium text-purple-600 dark:text-purple-400 min-w-[120px]">
                raw_data:
              </div>
              <div className="flex-1 text-xs">
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32 text-xs">
                  {JSON.stringify(zaloData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Phiên đăng nhập có hiệu lực trong 15 phút
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Xác nhận thông tin tài khoản Zalo
          </DialogTitle>
          <DialogDescription>
            Vui lòng xem lại và bổ sung thông tin để hoàn tất việc tạo tài khoản.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zalo Information Display */}
          {renderZaloInfo()}

          <Separator />

          {/* User Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-lg">Thông tin bổ sung</h3>
            
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Tên đầy đủ *
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nhập tên đầy đủ của bạn"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email (tùy chọn)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetry}
                disabled={isLoading}
                className="flex-1"
              >
                Đăng nhập lại
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.fullName.trim()}
                className="flex-1"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận tạo tài khoản'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}