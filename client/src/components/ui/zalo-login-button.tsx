import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface ZaloLoginButtonProps {
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export const ZaloLoginButton: React.FC<ZaloLoginButtonProps> = ({
  className = '',
  disabled = false,
  children,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleZaloLogin = () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    // Open popup window for Zalo OAuth
    console.log('Opening Zalo OAuth popup...');
    const popup = window.open(
      '/api/auth/zalo/login',
      'zaloLogin',
      'width=500,height=600,scrollbars=yes,resizable=yes,location=yes,status=yes,menubar=no,toolbar=no'
    );

    if (!popup || popup.closed) {
      toast({
        title: "Lỗi Popup",
        description: "Không thể mở popup. Vui lòng cho phép popup cho trang web này hoặc thử đăng nhập trực tiếp.",
        variant: "destructive",
      });
      setIsLoading(false);
      
      // Fallback to direct redirect
      setTimeout(() => {
        const fallback = confirm("Popup bị chặn. Bạn có muốn chuyển hướng trực tiếp để đăng nhập Zalo không?");
        if (fallback) {
          window.location.href = '/api/auth/zalo/login';
        }
      }, 1000);
      return;
    }

    console.log('Popup opened successfully, waiting for OAuth...');

    // Listen for messages from popup
    const messageListener = (event: MessageEvent) => {
      // Security check - only accept messages from same origin
      console.log('Received message from popup:', event.data, 'from origin:', event.origin);
      if (event.origin !== window.location.origin) {
        console.log('Ignoring message from different origin');
        return;
      }

      if (event.data.type === 'ZALO_LOGIN_SUCCESS') {
        console.log('Zalo login successful!');
        popup.close();
        window.removeEventListener('message', messageListener);
        setIsLoading(false);
        
        toast({
          title: "Thành công",
          description: "Đăng nhập Zalo thành công!",
          variant: "default",
        });
        
        // Refresh auth data and call success callback
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to dashboard
          window.location.href = "/dashboard";
        }
      } else if (event.data.type === 'ZALO_LOGIN_ERROR') {
        console.error('Zalo login error:', event.data.message);
        popup.close();
        window.removeEventListener('message', messageListener);
        setIsLoading(false);
        
        toast({
          title: "Lỗi đăng nhập",
          description: event.data.message || "Đăng nhập Zalo thất bại. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', messageListener);

    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        console.log('Popup was closed manually');
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        setIsLoading(false);
      }
    }, 1000);

    // Timeout handler - in case popup hangs
    const timeout = setTimeout(() => {
      if (!popup.closed) {
        console.log('OAuth popup timeout, closing...');
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        setIsLoading(false);
        
        toast({
          title: "Timeout",
          description: "Đăng nhập Zalo mất quá nhiều thời gian. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    }, 60000); // 60 seconds timeout
  };

  return (
    <Button
      onClick={handleZaloLogin}
      disabled={disabled || isLoading}
      className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors ${className}`}
      type="button"
    >
      <div className="flex items-center justify-center gap-2">
        {/* Zalo Logo SVG */}
        <svg 
          className="w-5 h-5" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
        {isLoading ? 'Đang đăng nhập...' : (children || 'Đăng nhập bằng Zalo')}
      </div>
    </Button>
  );
};