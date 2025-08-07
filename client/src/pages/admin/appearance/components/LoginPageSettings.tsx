import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Eye, LogIn, Globe, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(50, "Tiêu đề quá dài"),
  welcome_text: z.string().min(1, "Văn bản chào mừng là bắt buộc").max(200, "Văn bản quá dài"),
  login_logo_url: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

interface AppearanceSetting {
  id: number;
  type: string;
  key: string;
  value: string;
  language: string;
  isActive: boolean;
}

export default function LoginPageSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeLanguage, setActiveLanguage] = useState<'vi' | 'en'>('vi');
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Fetch login page settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/appearance/settings', { type: 'login_page' }],
    queryFn: () => apiRequest('GET', '/api/admin/appearance/settings?type=login_page'),
  });

  // Form setup
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      title: '',
      welcome_text: '',
      login_logo_url: '',
    },
  });

  // Update form when settings change
  useEffect(() => {
    if (settings?.data) {
      const languageSettings = settings.data.filter(
        (setting: AppearanceSetting) => setting.language === activeLanguage
      );
      
      const formData: LoginFormData = {
        title: languageSettings.find((s: AppearanceSetting) => s.key === 'title')?.value || '',
        welcome_text: languageSettings.find((s: AppearanceSetting) => s.key === 'welcome_text')?.value || '',
        login_logo_url: languageSettings.find((s: AppearanceSetting) => s.key === 'login_logo_url')?.value || '',
      };
      
      form.reset(formData);
      setLogoPreview(formData.login_logo_url || '');
    }
  }, [settings, activeLanguage, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { type: string; key: string; value: string; language: string }) => {
      return apiRequest('PATCH', '/api/admin/appearance/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appearance/settings'] });
      toast({
        title: "Cập nhật thành công",
        description: "Cài đặt trang đăng nhập đã được lưu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Có lỗi xảy ra",
        description: error.message || "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Update each setting
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          await updateMutation.mutateAsync({
            type: 'login_page',
            key,
            value: value as string,
            language: activeLanguage,
          });
        }
      }
    } catch (error) {
      console.error('Error updating login page settings:', error);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    form.setValue('login_logo_url', url);
    setLogoPreview(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Đang tải cài đặt...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as 'vi' | 'en')}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="vi" className="flex items-center gap-2">
              🇻🇳 Tiếng Việt
            </TabsTrigger>
            <TabsTrigger value="en" className="flex items-center gap-2">
              🇺🇸 English
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Globe className="h-3 w-3 mr-1" />
            {activeLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
          </Badge>
        </div>

        {/* Vietnamese Settings */}
        <TabsContent value="vi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trang đăng nhập - Tiếng Việt</CardTitle>
              <CardDescription>
                Tùy chỉnh logo, tiêu đề và nội dung text cho trang đăng nhập và đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label>Logo cho trang đăng nhập</Label>
                  
                  {/* Logo Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Preview Logo:</span>
                      {logoPreview && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Image className="h-3 w-3 mr-1" />
                          Đã có logo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-center h-20 bg-white border rounded">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Login logo preview"
                          className="max-h-16 max-w-40 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/120x60?text=Login+Logo";
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">Chưa có logo cho trang đăng nhập</div>
                      )}
                    </div>
                  </div>

                  {/* Logo URL Input */}
                  <div>
                    <Label htmlFor="login_logo_url">URL Logo đăng nhập</Label>
                    <Input
                      id="login_logo_url"
                      {...form.register('login_logo_url')}
                      placeholder="https://example.com/login-logo.png hoặc /path/to/login-logo.png"
                      className="mt-1"
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Logo riêng cho trang đăng nhập (có thể khác với logo header). Kích thước khuyến nghị: 240x120px
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Tiêu đề trang đăng nhập</Label>
                  <Input
                    id="title"
                    {...form.register('title')}
                    placeholder="VD: Đăng nhập"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.title && (
                      <span className="text-red-500">{form.formState.errors.title.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('title')?.length || 0}/50 ký tự
                    </span>
                  </div>
                </div>

                {/* Welcome Text */}
                <div>
                  <Label htmlFor="welcome_text">Văn bản chào mừng</Label>
                  <Textarea
                    id="welcome_text"
                    {...form.register('welcome_text')}
                    placeholder="VD: Chào mừng bạn đến với SEO AI Writer. Đăng nhập để bắt đầu tạo nội dung SEO chuyên nghiệp."
                    className="mt-1"
                    rows={3}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.welcome_text && (
                      <span className="text-red-500">{form.formState.errors.welcome_text.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('welcome_text')?.length || 0}/200 ký tự
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu cài đặt
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* English Settings */}
        <TabsContent value="en" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Login Page - English</CardTitle>
              <CardDescription>
                Customize logo, title and text content for login and registration pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label>Login page logo</Label>
                  
                  {/* Logo Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Logo Preview:</span>
                      {logoPreview && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Image className="h-3 w-3 mr-1" />
                          Logo Available
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-center h-20 bg-white border rounded">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Login logo preview"
                          className="max-h-16 max-w-40 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/120x60?text=Login+Logo";
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">No login page logo</div>
                      )}
                    </div>
                  </div>

                  {/* Logo URL Input */}
                  <div>
                    <Label htmlFor="login_logo_url_en">Login Logo URL</Label>
                    <Input
                      id="login_logo_url_en"
                      {...form.register('login_logo_url')}
                      placeholder="https://example.com/login-logo.png or /path/to/login-logo.png"
                      className="mt-1"
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Dedicated logo for login page (can be different from header logo). Recommended size: 240x120px
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title_en">Login page title</Label>
                  <Input
                    id="title_en"
                    {...form.register('title')}
                    placeholder="e.g: Sign In"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.title && (
                      <span className="text-red-500">{form.formState.errors.title.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('title')?.length || 0}/50 characters
                    </span>
                  </div>
                </div>

                {/* Welcome Text */}
                <div>
                  <Label htmlFor="welcome_text_en">Welcome text</Label>
                  <Textarea
                    id="welcome_text_en"
                    {...form.register('welcome_text')}
                    placeholder="e.g: Welcome to SEO AI Writer. Sign in to start creating professional SEO content."
                    className="mt-1"
                    rows={3}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.welcome_text && (
                      <span className="text-red-500">{form.formState.errors.welcome_text.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('welcome_text')?.length || 0}/200 characters
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Card */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Login Page Preview
          </CardTitle>
          <CardDescription>
            Xem trước trang đăng nhập sẽ hiển thị như thế nào
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-8 rounded-lg border max-w-md mx-auto">
            {/* Logo */}
            <div className="text-center mb-6">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Login logo preview"
                  className="h-12 w-auto mx-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/120x60?text=Logo";
                  }}
                />
              ) : (
                <div className="h-12 w-24 bg-gray-200 rounded mx-auto flex items-center justify-center text-xs text-gray-500">
                  Logo
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center mb-2">
              {form.watch('title') || 'Đăng nhập'}
            </h1>

            {/* Welcome Text */}
            <p className="text-gray-600 text-center mb-6 text-sm">
              {form.watch('welcome_text') || 'Chào mừng bạn đến với SEO AI Writer'}
            </p>

            {/* Mock Login Form */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Email</Label>
                <div className="mt-1 h-10 bg-gray-100 rounded border"></div>
              </div>
              <div>
                <Label className="text-sm">Mật khẩu</Label>
                <div className="mt-1 h-10 bg-gray-100 rounded border"></div>
              </div>
              <div className="h-10 bg-blue-500 rounded flex items-center justify-center text-white text-sm font-medium">
                <LogIn className="h-4 w-4 mr-2" />
                {activeLanguage === 'vi' ? 'Đăng nhập' : 'Sign In'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}