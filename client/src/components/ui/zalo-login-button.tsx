import React from 'react';
import { Button } from '@/components/ui/button';

interface ZaloLoginButtonProps {
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ZaloLoginButton: React.FC<ZaloLoginButtonProps> = ({
  className = '',
  disabled = false,
  children
}) => {
  const handleZaloLogin = () => {
    if (disabled) return;
    window.location.href = '/api/auth/zalo/login';
  };

  return (
    <Button
      onClick={handleZaloLogin}
      disabled={disabled}
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
        {children || 'Đăng nhập bằng Zalo'}
      </div>
    </Button>
  );
};