import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Upload, Image, Globe, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const footerFormSchema = z.object({
  footer_logo_url: z.string().optional(),
  footer_logo_height: z.string().optional().default("32"),
  footer_logo_width: z.string().optional().default("auto"),
  footer_site_name: z.string().min(1, "Tên trang là bắt buộc").max(50, "Tên quá dài"),
  footer_description: z.string().max(200, "Mô tả quá dài").optional(),
  footer_copyright: z.string().max(100, "Copyright quá dài").optional(),
});

type FooterFormData = z.infer<typeof footerFormSchema>;

interface AppearanceSetting {
  id: number;
  type: string;
  key: string;
  value: string;
  language: string;
  isActive: boolean;
}

export default function FooterSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeLanguage, setActiveLanguage] = useState<'vi' | 'en'>('vi');
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Fetch footer settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/appearance/settings', { type: 'footer' }],
    queryFn: () => apiRequest('GET', '/api/admin/appearance/settings?type=footer'),
  });

  // Form setup
  const form = useForm<FooterFormData>({
    resolver: zodResolver(footerFormSchema),
    defaultValues: {
      footer_logo_url: '',
      footer_logo_height: '32',
      footer_logo_width: 'auto',
      footer_site_name: '',
      footer_description: '',
      footer_copyright: '',
    },
  });

  // Update form when settings change
  useEffect(() => {
    if (settings?.data) {
      const languageSettings = settings.data.filter(
        (setting: AppearanceSetting) => setting.language === activeLanguage
      );
      
      const formData: FooterFormData = {
        footer_logo_url: languageSettings.find((s: AppearanceSetting) => s.key === 'footer_logo_url')?.value || '',
        footer_logo_height: languageSettings.find((s: AppearanceSetting) => s.key === 'footer_logo_height')?.value || '32',
        footer_logo_width: languageSettings.find((s: AppearanceSetting) => s.key === 'footer_logo_width')?.value || 'auto',
        footer_site_name: languageSettings.find((s: AppearanceSetting) => s.key === 'footer_site_name')?.value || '',
        footer_description: languageSettings.find((s: AppearanceSetting) => s.key === 'footer_description')?.value || '',
        footer_copyright: languageSettings.find((s: AppearanceSetting) => s.key === 'footer_copyright')?.value || '',
      };
      
      form.reset(formData);
      setLogoPreview(formData.footer_logo_url || '');
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
        description: "Cài đặt footer đã được lưu",
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

  const onSubmit = async (data: FooterFormData) => {
    try {
      // Array of setting updates to be performed
      const updates = [
        { type: 'footer', key: 'footer_logo_url', value: data.footer_logo_url || '', language: activeLanguage },
        { type: 'footer', key: 'footer_logo_height', value: data.footer_logo_height || '32', language: activeLanguage },
        { type: 'footer', key: 'footer_logo_width', value: data.footer_logo_width || 'auto', language: activeLanguage },
        { type: 'footer', key: 'footer_site_name', value: data.footer_site_name, language: activeLanguage },
        { type: 'footer', key: 'footer_description', value: data.footer_description || '', language: activeLanguage },
        { type: 'footer', key: 'footer_copyright', value: data.footer_copyright || '', language: activeLanguage },
      ];

      // Execute all updates
      for (const update of updates) {
        await updateMutation.mutateAsync(update);
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật cài đặt footer",
      });

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appearance/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appearance/settings'] });
    } catch (error) {
      console.error('Error updating footer settings:', error);
      toast({
        title: "Lỗi", 
        description: "Không thể cập nhật cài đặt footer",
        variant: "destructive",
      });
    }
  };

  const handleLogoUrlChange = (url: string) => {
    form.setValue('footer_logo_url', url);
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
                <FileText className="h-4 w-4" />
                Footer Settings - Tiếng Việt
              </CardTitle>
              <CardDescription>
                Cấu hình logo, tên trang và nội dung footer cho phiên bản tiếng Việt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label>Logo footer</Label>
                  
                  {/* Logo Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Preview Logo Footer:</span>
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
                          alt="Footer logo preview"
                          className="max-h-12 max-w-32 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/100x40?text=Footer+Logo";
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">Chưa có logo footer</div>
                      )}
                    </div>
                  </div>

                  {/* Logo URL Input */}
                  <div>
                    <Label htmlFor="footer_logo_url">URL Logo Footer</Label>
                    <Input
                      id="footer_logo_url"
                      {...form.register('footer_logo_url')}
                      placeholder="https://ftp.toolbox.vn/img/logo-toolboxvn-white.png"
                      className="mt-1"
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Nhập URL logo riêng cho footer. Kích thước khuyến nghị: 160x40px. 
                      <br />Ví dụ: https://ftp.toolbox.vn/img/logo-toolboxvn-white.png
                    </p>
                  </div>

                  {/* Logo Size Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="footer_logo_height">Chiều cao (px)</Label>
                      <Input
                        id="footer_logo_height"
                        {...form.register('footer_logo_height')}
                        placeholder="32"
                        className="mt-1"
                        type="number"
                        min="16"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">16-100px</p>
                    </div>
                    <div>
                      <Label htmlFor="footer_logo_width">Chiều rộng</Label>
                      <Input
                        id="footer_logo_width"
                        {...form.register('footer_logo_width')}
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
                    Upload Logo Footer (Sắp có)
                  </Button>
                </div>

                {/* Site Name */}
                <div>
                  <Label htmlFor="footer_site_name">Tên trang trong footer</Label>
                  <Input
                    id="footer_site_name"
                    {...form.register('footer_site_name')}
                    placeholder="VD: ToolBox.vn - Viết bài SEO chuẩn AIO"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.footer_site_name && (
                      <span className="text-red-500">{form.formState.errors.footer_site_name.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('footer_site_name')?.length || 0}/50 ký tự
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="footer_description">Mô tả footer</Label>
                  <Textarea
                    id="footer_description"
                    {...form.register('footer_description')}
                    placeholder="Mô tả ngắn gọn về website..."
                    className="mt-1"
                    rows={3}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.footer_description && (
                      <span className="text-red-500">{form.formState.errors.footer_description.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('footer_description')?.length || 0}/200 ký tự
                    </span>
                  </div>
                </div>

                {/* Copyright */}
                <div>
                  <Label htmlFor="footer_copyright">Copyright</Label>
                  <Input
                    id="footer_copyright"
                    {...form.register('footer_copyright')}
                    placeholder="© 2025 ToolBox.vn. Tất cả quyền được bảo lưu."
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.footer_copyright && (
                      <span className="text-red-500">{form.formState.errors.footer_copyright.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('footer_copyright')?.length || 0}/100 ký tự
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
                      Lưu cài đặt Footer
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
                <FileText className="h-4 w-4" />
                Footer Settings - English
              </CardTitle>
              <CardDescription>
                Configure footer logo, site name and content for English version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label>Footer Logo</Label>
                  
                  {/* Logo Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Footer Logo Preview:</span>
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
                          alt="Footer logo preview"
                          className="max-h-12 max-w-32 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/100x40?text=Footer+Logo";
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">No footer logo</div>
                      )}
                    </div>
                  </div>

                  {/* Logo URL Input */}
                  <div>
                    <Label htmlFor="footer_logo_url_en">Footer Logo URL</Label>
                    <Input
                      id="footer_logo_url_en"
                      {...form.register('footer_logo_url')}
                      placeholder="https://example.com/footer-logo.png"
                      className="mt-1"
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter footer logo URL. Recommended size: 160x40px
                    </p>
                  </div>

                  {/* Logo Size Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="footer_logo_height_en">Height (px)</Label>
                      <Input
                        id="footer_logo_height_en"
                        {...form.register('footer_logo_height')}
                        placeholder="32"
                        className="mt-1"
                        type="number"
                        min="16"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">16-100px</p>
                    </div>
                    <div>
                      <Label htmlFor="footer_logo_width_en">Width</Label>
                      <Input
                        id="footer_logo_width_en"
                        {...form.register('footer_logo_width')}
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
                    Upload Footer Logo (Coming Soon)
                  </Button>
                </div>

                {/* Site Name */}
                <div>
                  <Label htmlFor="footer_site_name_en">Footer Site Name</Label>
                  <Input
                    id="footer_site_name_en"
                    {...form.register('footer_site_name')}
                    placeholder="e.g: ToolBox.vn - Professional SEO Content Writer"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.footer_site_name && (
                      <span className="text-red-500">{form.formState.errors.footer_site_name.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('footer_site_name')?.length || 0}/50 characters
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="footer_description_en">Footer Description</Label>
                  <Textarea
                    id="footer_description_en"
                    {...form.register('footer_description')}
                    placeholder="Brief description about the website..."
                    className="mt-1"
                    rows={3}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.footer_description && (
                      <span className="text-red-500">{form.formState.errors.footer_description.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('footer_description')?.length || 0}/200 characters
                    </span>
                  </div>
                </div>

                {/* Copyright */}
                <div>
                  <Label htmlFor="footer_copyright_en">Copyright</Label>
                  <Input
                    id="footer_copyright_en"
                    {...form.register('footer_copyright')}
                    placeholder="© 2025 ToolBox.vn. All rights reserved."
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.footer_copyright && (
                      <span className="text-red-500">{form.formState.errors.footer_copyright.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('footer_copyright')?.length || 0}/100 characters
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
                      Save Footer Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}