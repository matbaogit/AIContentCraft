import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ZaloTest() {
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Parse current URL parameters
    const params = new URLSearchParams(window.location.search);
    setUrlParams(params);
  }, []);

  const handleZaloAuth = () => {
    setIsTestingAuth(true);
    // Open Zalo OAuth in current window for testing
    window.location.href = '/api/auth/zalo';
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Đã sao chép",
      description: "Giá trị đã được sao chép vào clipboard",
    });
  };

  const clearParams = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setUrlParams(new URLSearchParams());
  };

  const getCurrentUrl = () => {
    return window.location.href;
  };

  const params = urlParams ? Array.from(urlParams.entries()) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Zalo OAuth Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test and debug Zalo authentication flow
          </p>
        </div>

        {/* Auth Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Authentication Test
            </CardTitle>
            <CardDescription>
              Test Zalo OAuth flow and check callback parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleZaloAuth}
              disabled={isTestingAuth}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isTestingAuth ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing Zalo OAuth...
                </>
              ) : (
                'Test Zalo Authentication'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current URL */}
        <Card>
          <CardHeader>
            <CardTitle>Current URL</CardTitle>
            <CardDescription>
              The current page URL and parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm break-all">
              {getCurrentUrl()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyValue(getCurrentUrl())}
              className="mt-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
          </CardContent>
        </Card>

        {/* URL Parameters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>URL Parameters</CardTitle>
              <CardDescription>
                OAuth callback parameters received from Zalo
              </CardDescription>
            </div>
            {params.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearParams}>
                Clear Parameters
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {params.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No URL parameters found
              </div>
            ) : (
              <div className="space-y-3">
                {params.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{key}</Badge>
                        {key === 'code' && <Badge variant="default">Authorization Code</Badge>}
                        {key === 'state' && <Badge variant="default">State</Badge>}
                        {key === 'error' && <Badge variant="destructive">Error</Badge>}
                      </div>
                      <div className="font-mono text-sm text-gray-600 dark:text-gray-300 break-all">
                        {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyValue(value)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Technical details for debugging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Expected Flow:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>User clicks "Test Zalo Authentication"</li>
                <li>Redirects to <code>/api/auth/zalo</code></li>
                <li>Server redirects to Zalo OAuth</li>
                <li>Zalo redirects to <code>/zalo-callback?code=...</code></li>
                <li>React component processes and redirects to <code>/api/auth/zalo/callback</code></li>
                <li>Server completes OAuth and redirects to dashboard</li>
              </ol>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Callback URLs:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Development:</strong> <code>https://replit-domain/zalo-callback</code></div>
                <div><strong>Production:</strong> <code>https://toolbox.vn/zalo-callback</code></div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Environment:</h4>
              <Badge variant="outline">
                {window.location.hostname.includes('toolbox.vn') ? 'Production' : 'Development'}
              </Badge>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}