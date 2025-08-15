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
import { Loader2, Save, Upload, Image, Globe, Layout, Code } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const headerFormSchema = z.object({
  logo_url: z.string().optional(),
  logo_height: z.string().optional().default("32"),
  logo_width: z.string().optional().default("auto"),
  site_name: z.string().min(1, "Tên trang là bắt buộc").max(50, "Tên quá dài"),
  custom_head_tags: z.string().optional(),
});

type HeaderFormData = z.infer<typeof headerFormSchema>;

interface AppearanceSetting {
  id: number;
  type: string;
  key: string;
  value: string;
  language: string;
  isActive: boolean;
}

export default function HeaderSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeLanguage, setActiveLanguage] = useState<'vi' | 'en'>('vi');
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Fetch header settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/appearance/settings', { type: 'header' }],
    queryFn: () => apiRequest('GET', '/api/admin/appearance/settings?type=header'),
  });

  // Form setup
  const form = useForm<HeaderFormData>({
    resolver: zodResolver(headerFormSchema),
    defaultValues: {
      logo_url: '',
      logo_height: '32',
      logo_width: 'auto',
      site_name: '',
      custom_head_tags: '',
    },
  });

  // Update form when settings change
  useEffect(() => {
    if (settings?.data) {
      const languageSettings = settings.data.filter(
        (setting: AppearanceSetting) => setting.language === activeLanguage
      );
      
      const formData: HeaderFormData = {
        logo_url: languageSettings.find((s: AppearanceSetting) => s.key === 'logo_url')?.value || '',
        logo_height: languageSettings.find((s: AppearanceSetting) => s.key === 'logo_height')?.value || '32',
        logo_width: languageSettings.find((s: AppearanceSetting) => s.key === 'logo_width')?.value || 'auto',
        site_name: languageSettings.find((s: AppearanceSetting) => s.key === 'site_name')?.value || '',
        custom_head_tags: languageSettings.find((s: AppearanceSetting) => s.key === 'custom_head_tags')?.value || '',
      };
      
      form.reset(formData);
      setLogoPreview(formData.logo_url || '');
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
        description: "Cài đặt header đã được lưu",
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

  const onSubmit = async (data: HeaderFormData) => {
    try {
      // Array of setting updates to be performed (including logo dimensions)
      const updates = [
        { type: 'header', key: 'logo_url', value: data.logo_url || '', language: activeLanguage },
        { type: 'header', key: 'logo_height', value: data.logo_height || '32', language: activeLanguage },
        { type: 'header', key: 'logo_width', value: data.logo_width || 'auto', language: activeLanguage },
        { type: 'header', key: 'site_name', value: data.site_name, language: activeLanguage },
        { type: 'header', key: 'custom_head_tags', value: data.custom_head_tags || '', language: activeLanguage },
      ];

      // Execute all updates
      for (const update of updates) {
        await updateMutation.mutateAsync(update);
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật cài đặt header và kích thước logo",
      });

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appearance/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appearance/settings'] });
    } catch (error) {
      console.error('Error updating header settings:', error);
      toast({
        title: "Lỗi", 
        description: "Không thể cập nhật cài đặt header",
        variant: "destructive",
      });
    }
  };

  const handleLogoUrlChange = (url: string) => {
    form.setValue('logo_url', url);
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
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Globe className="h-3 w-3 mr-1" />
            {activeLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
          </Badge>
        </div>

        {/* Vietnamese Settings */}
        <TabsContent value="vi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Header & Branding - Tiếng Việt
              </CardTitle>
              <CardDescription>
                Cấu hình logo và tên trang cho phiên bản tiếng Việt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label>Logo trang web</Label>
                  
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
                    <div className="flex items-center justify-center h-16 bg-white border rounded">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-12 max-w-32 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/100x40?text=Logo";
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">Chưa có logo</div>
                      )}
                    </div>
                  </div>

                  {/* Logo URL Input */}
                  <div>
                    <Label htmlFor="logo_url">URL Logo</Label>
                    <Input
                      id="logo_url"
                      {...form.register('logo_url')}
                      placeholder="https://example.com/logo.png hoặc /path/to/logo.png"
                      className="mt-1"
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Nhập URL đầy đủ hoặc đường dẫn tương đối. Kích thước khuyến nghị: 200x60px
                    </p>
                  </div>

                  {/* Logo Size Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logo_height">Chiều cao (px)</Label>
                      <Input
                        id="logo_height"
                        {...form.register('logo_height')}
                        placeholder="32"
                        className="mt-1"
                        type="number"
                        min="16"
                        max="200"
                      />
                      <p className="text-xs text-muted-foreground mt-1">16-200px</p>
                    </div>
                    <div>
                      <Label htmlFor="logo_width">Chiều rộng</Label>
                      <Input
                        id="logo_width"
                        {...form.register('logo_width')}
                        placeholder="auto"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">auto hoặc số px</p>
                    </div>
                  </div>

                  {/* Upload Button (placeholder for future file upload) */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    disabled
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo (Sắp có)
                  </Button>
                </div>

                {/* Site Name */}
                <div>
                  <Label htmlFor="site_name">Tên trang web</Label>
                  <Input
                    id="site_name"
                    {...form.register('site_name')}
                    placeholder="VD: SEO AI Writer"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.site_name && (
                      <span className="text-red-500">{form.formState.errors.site_name.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('site_name')?.length || 0}/50 ký tự
                    </span>
                  </div>
                </div>

                {/* Custom Head Tags */}
                <div>
                  <Label htmlFor="custom_head_tags" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Thẻ Meta & Script tùy chỉnh
                  </Label>
                  <Textarea
                    id="custom_head_tags"
                    {...form.register('custom_head_tags')}
                    placeholder="Nhập các thẻ meta hoặc script tùy chỉnh...&#10;&#10;VD:&#10;<meta name=&quot;google-site-verification&quot; content=&quot;your-verification-code&quot; />&#10;<script async src=&quot;https://analytics.google.com/script.js&quot;></script>&#10;<meta property=&quot;og:image&quot; content=&quot;https://yoursite.com/image.jpg&quot; />"
                    className="mt-1 min-h-[120px] font-mono text-sm"
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Các thẻ meta, script hoặc HTML khác sẽ được chèn vào phần &lt;head&gt; của trang. 
                    Hỗ trợ: Google Analytics, Facebook Pixel, meta tags SEO, v.v.
                  </p>
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Header & Branding - English
              </CardTitle>
              <CardDescription>
                Configure logo and site name for English version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label>Website Logo</Label>
                  
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
                    <div className="flex items-center justify-center h-16 bg-white border rounded">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-12 max-w-32 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/100x40?text=Logo";
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">No logo</div>
                      )}
                    </div>
                  </div>

                  {/* Logo URL Input */}
                  <div>
                    <Label htmlFor="logo_url_en">Logo URL</Label>
                    <Input
                      id="logo_url_en"
                      {...form.register('logo_url')}
                      placeholder="https://example.com/logo.png or /path/to/logo.png"
                      className="mt-1"
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter full URL or relative path. Recommended size: 200x60px
                    </p>
                  </div>

                  {/* Logo Size Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logo_height_en">Height (px)</Label>
                      <Input
                        id="logo_height_en"
                        {...form.register('logo_height')}
                        placeholder="32"
                        className="mt-1"
                        type="number"
                        min="16"
                        max="200"
                      />
                      <p className="text-xs text-muted-foreground mt-1">16-200px</p>
                    </div>
                    <div>
                      <Label htmlFor="logo_width_en">Width</Label>
                      <Input
                        id="logo_width_en"
                        {...form.register('logo_width')}
                        placeholder="auto"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">auto or px value</p>
                    </div>
                  </div>

                  {/* Upload Button (placeholder for future file upload) */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    disabled
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo (Coming Soon)
                  </Button>
                </div>

                {/* Site Name */}
                <div>
                  <Label htmlFor="site_name_en">Website Name</Label>
                  <Input
                    id="site_name_en"
                    {...form.register('site_name')}
                    placeholder="e.g: SEO AI Writer"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.site_name && (
                      <span className="text-red-500">{form.formState.errors.site_name.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('site_name')?.length || 0}/50 characters
                    </span>
                  </div>
                </div>

                {/* Custom Head Tags */}
                <div>
                  <Label htmlFor="custom_head_tags_en" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Custom Meta Tags & Scripts
                  </Label>
                  <Textarea
                    id="custom_head_tags_en"
                    {...form.register('custom_head_tags')}
                    placeholder="Enter custom meta tags or scripts...&#10;&#10;Example:&#10;<meta name=&quot;google-site-verification&quot; content=&quot;your-verification-code&quot; />&#10;<script async src=&quot;https://analytics.google.com/script.js&quot;></script>&#10;<meta property=&quot;og:image&quot; content=&quot;https://yoursite.com/image.jpg&quot; />"
                    className="mt-1 min-h-[120px] font-mono text-sm"
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Meta tags, scripts or other HTML that will be inserted into the &lt;head&gt; section. 
                    Supports: Google Analytics, Facebook Pixel, SEO meta tags, etc.
                  </p>
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
            <Image className="h-4 w-4" />
            Header Preview
          </CardTitle>
          <CardDescription>
            Xem trước header sẽ hiển thị như thế nào
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/80x30?text=Logo";
                  }}
                />
              ) : (
                <div className="h-8 w-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  Logo
                </div>
              )}
              <span className="text-xl font-bold">
                {form.watch('site_name') || 'Tên trang web'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}