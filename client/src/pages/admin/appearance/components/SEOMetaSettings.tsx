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
import { Loader2, Save, Globe, Languages, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const seoFormSchema = z.object({
  site_title: z.string().min(1, "Tiêu đề trang là bắt buộc").max(60, "Tiêu đề quá dài"),
  site_description: z.string().min(1, "Mô tả trang là bắt buộc").max(160, "Mô tả quá dài"),
  site_keywords: z.string().optional(),
});

type SEOFormData = z.infer<typeof seoFormSchema>;

interface AppearanceSetting {
  id: number;
  type: string;
  key: string;
  value: string;
  language: string;
  isActive: boolean;
}

export default function SEOMetaSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeLanguage, setActiveLanguage] = useState<'vi' | 'en'>('vi');

  // Fetch SEO settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/appearance/settings', { type: 'seo_meta' }],
    queryFn: () => apiRequest('/api/admin/appearance/settings?type=seo_meta'),
  });

  // Form setup
  const form = useForm<SEOFormData>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      site_title: '',
      site_description: '',
      site_keywords: '',
    },
  });

  // Update form when settings change
  useEffect(() => {
    if (settings?.data) {
      const languageSettings = settings.data.filter(
        (setting: AppearanceSetting) => setting.language === activeLanguage
      );
      
      const formData: SEOFormData = {
        site_title: languageSettings.find((s: AppearanceSetting) => s.key === 'site_title')?.value || '',
        site_description: languageSettings.find((s: AppearanceSetting) => s.key === 'site_description')?.value || '',
        site_keywords: languageSettings.find((s: AppearanceSetting) => s.key === 'site_keywords')?.value || '',
      };
      
      form.reset(formData);
    }
  }, [settings, activeLanguage, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { type: string; key: string; value: string; language: string }) => {
      return apiRequest('/api/admin/appearance/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appearance/settings'] });
      toast({
        title: "Cập nhật thành công",
        description: "Cài đặt SEO đã được lưu",
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

  const onSubmit = async (data: SEOFormData) => {
    try {
      // Update each setting
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          await updateMutation.mutateAsync({
            type: 'seo_meta',
            key,
            value: value as string,
            language: activeLanguage,
          });
        }
      }
    } catch (error) {
      console.error('Error updating SEO settings:', error);
    }
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
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Globe className="h-3 w-3 mr-1" />
            {activeLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
          </Badge>
        </div>

        {/* Vietnamese Settings */}
        <TabsContent value="vi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Meta Tags - Tiếng Việt</CardTitle>
              <CardDescription>
                Cấu hình thông tin SEO cho phiên bản tiếng Việt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="site_title">Tiêu đề trang web</Label>
                  <Input
                    id="site_title"
                    {...form.register('site_title')}
                    placeholder="VD: SEO AI Writer - Công cụ tạo nội dung SEO"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.site_title && (
                      <span className="text-red-500">{form.formState.errors.site_title.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('site_title')?.length || 0}/60 ký tự
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="site_description">Mô tả trang web</Label>
                  <Textarea
                    id="site_description"
                    {...form.register('site_description')}
                    placeholder="Mô tả ngắn gọn về website, sử dụng cho meta description"
                    className="mt-1"
                    rows={3}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.site_description && (
                      <span className="text-red-500">{form.formState.errors.site_description.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('site_description')?.length || 0}/160 ký tự
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="site_keywords">Từ khóa SEO</Label>
                  <Input
                    id="site_keywords"
                    {...form.register('site_keywords')}
                    placeholder="VD: SEO, AI, content, writer, công cụ viết"
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Các từ khóa phân cách bởi dấu phẩy
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
              <CardTitle className="text-lg">SEO Meta Tags - English</CardTitle>
              <CardDescription>
                Configure SEO information for English version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="site_title_en">Website Title</Label>
                  <Input
                    id="site_title_en"
                    {...form.register('site_title')}
                    placeholder="e.g: SEO AI Writer - AI-powered Content Creation Tool"
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.site_title && (
                      <span className="text-red-500">{form.formState.errors.site_title.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('site_title')?.length || 0}/60 characters
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="site_description_en">Website Description</Label>
                  <Textarea
                    id="site_description_en"
                    {...form.register('site_description')}
                    placeholder="Brief description of your website for meta description"
                    className="mt-1"
                    rows={3}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.site_description && (
                      <span className="text-red-500">{form.formState.errors.site_description.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('site_description')?.length || 0}/160 characters
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="site_keywords_en">SEO Keywords</Label>
                  <Input
                    id="site_keywords_en"
                    {...form.register('site_keywords')}
                    placeholder="e.g: SEO, AI, content, writer, tool"
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Keywords separated by commas
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
            <RefreshCw className="h-4 w-4" />
            Preview
          </CardTitle>
          <CardDescription>
            Xem trước cách thông tin SEO sẽ hiển thị trên search engines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border">
            <div className="space-y-1">
              <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                {form.watch('site_title') || 'Tiêu đề trang web'}
              </div>
              <div className="text-green-700 text-sm">
                https://yourwebsite.com
              </div>
              <div className="text-gray-600 text-sm">
                {form.watch('site_description') || 'Mô tả trang web sẽ hiển thị ở đây...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}