import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function ZaloCallback() {
  const [status, setStatus] = useState<'processing' | 'redirecting' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract OAuth parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        console.log('Zalo OAuth Callback - Processing parameters:', {
          code: code ? 'received' : 'missing',
          state: state ? 'received' : 'missing',
          error: error || 'none'
        });

        if (error) {
          setError(`OAuth error: ${error}`);
          setStatus('error');
          return;
        }

        if (!code) {
          setError('Missing authorization code');
          setStatus('error');
          return;
        }

        setStatus('redirecting');

        // Build redirect URL to server callback
        let redirectUrl = '/api/auth/zalo/callback?';
        if (code) redirectUrl += 'code=' + encodeURIComponent(code) + '&';
        if (state) redirectUrl += 'state=' + encodeURIComponent(state) + '&';
        
        // Remove trailing &
        redirectUrl = redirectUrl.replace(/&$/, '');

        console.log('Redirecting to server callback:', redirectUrl);

        // Wait a moment for UI feedback then redirect
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);

      } catch (err) {
        console.error('Error processing Zalo callback:', err);
        setError('Failed to process OAuth callback');
        setStatus('error');
      }
    };

    processCallback();
  }, []);

  const handleRetry = () => {
    setLocation('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Đang xử lý Zalo OAuth...
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Vui lòng đợi trong giây lát
              </p>
            </>
          )}

          {status === 'redirecting' && (
            <>
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Đang chuyển hướng...
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                OAuth thành công, đang hoàn tất đăng nhập
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Có lỗi xảy ra
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Thử lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}