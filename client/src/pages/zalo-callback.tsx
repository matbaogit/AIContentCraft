import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function ZaloCallbackPage() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setMessage('Đăng nhập Zalo bị hủy hoặc có lỗi xảy ra.');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Không nhận được mã xác thực từ Zalo.');
      return;
    }

    // The actual callback processing is handled by server-side route
    // This page just shows loading state and handles client-side redirect
    setStatus('loading');
    setMessage('Đang xử lý thông tin từ Zalo...');

    // Add a timeout in case the server redirect doesn't work
    const timeout = setTimeout(() => {
      setStatus('error');
      setMessage('Xử lý quá lâu. Vui lòng thử lại.');
    }, 10000);

    // Cleanup timeout if component unmounts
    return () => clearTimeout(timeout);
  }, []);

  const handleRetry = () => {
    window.location.href = '/api/auth/zalo';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
            
            {status === 'loading' && 'Đang xử lý...'}
            {status === 'success' && 'Thành công!'}
            {status === 'error' && 'Có lỗi xảy ra'}
          </CardTitle>
          <CardDescription>
            Đăng nhập/Đăng ký bằng Zalo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <Alert className={
            status === 'loading' ? 'border-blue-200 bg-blue-50' :
            status === 'success' ? 'border-green-200 bg-green-50' :
            'border-red-200 bg-red-50'
          }>
            <AlertDescription className={
              status === 'loading' ? 'text-blue-800' :
              status === 'success' ? 'text-green-800' :
              'text-red-800'
            }>
              {message}
            </AlertDescription>
          </Alert>

          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Thử lại
              </Button>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Đăng ký bằng email
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="ghost" className="w-full">
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          )}

          {status === 'success' && (
            <Link href="/dashboard">
              <Button className="w-full">
                Đi đến Dashboard
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}