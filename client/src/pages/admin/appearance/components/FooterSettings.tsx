import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, FileText, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const footerFormSchema = z.object({
  copyright: z.string().min(1, "Copyright text is required").max(500, "Copyright text too long"),
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

  // Fetch footer settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/appearance/settings', { type: 'footer' }],
    queryFn: () => apiRequest('/api/admin/appearance/settings?type=footer'),
  });

  // Form setup
  const form = useForm<FooterFormData>({
    resolver: zodResolver(footerFormSchema),
    defaultValues: {
      copyright: '',
    },
  });

  // Update form when settings change
  useEffect(() => {
    if (settings?.data) {
      const languageSettings = settings.data.filter(
        (setting: AppearanceSetting) => setting.language === activeLanguage
      );
      
      const formData: FooterFormData = {
        copyright: languageSettings.find((s: AppearanceSetting) => s.key === 'copyright')?.value || '',
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
      // Update each setting
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          await updateMutation.mutateAsync({
            type: 'footer',
            key,
            value: value as string,
            language: activeLanguage,
          });
        }
      }
    } catch (error) {
      console.error('Error updating footer settings:', error);
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

  const currentYear = new Date().getFullYear();

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
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Globe className="h-3 w-3 mr-1" />
            {activeLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
          </Badge>
        </div>

        {/* Vietnamese Settings */}
        <TabsContent value="vi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Footer Content - Tiếng Việt</CardTitle>
              <CardDescription>
                Cấu hình nội dung footer, copyright và thông tin bản quyền
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Copyright Text */}
                <div>
                  <Label htmlFor="copyright">Thông tin bản quyền</Label>
                  <Textarea
                    id="copyright"
                    {...form.register('copyright')}
                    placeholder={`VD: © ${currentYear} SEO AI Writer. Tất cả quyền được bảo lưu. Phát triển bởi [Tên công ty].`}
                    className="mt-1"
                    rows={4}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.copyright && (
                      <span className="text-red-500">{form.formState.errors.copyright.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('copyright')?.length || 0}/500 ký tự
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Có thể sử dụng HTML đơn giản như &lt;br&gt;, &lt;a&gt;, &lt;strong&gt;
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
              <CardTitle className="text-lg">Footer Content - English</CardTitle>
              <CardDescription>
                Configure footer content, copyright and legal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Copyright Text */}
                <div>
                  <Label htmlFor="copyright_en">Copyright information</Label>
                  <Textarea
                    id="copyright_en"
                    {...form.register('copyright')}
                    placeholder={`e.g: © ${currentYear} SEO AI Writer. All rights reserved. Developed by [Company Name].`}
                    className="mt-1"
                    rows={4}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    {form.formState.errors.copyright && (
                      <span className="text-red-500">{form.formState.errors.copyright.message}</span>
                    )}
                    <span className="ml-auto">
                      {form.watch('copyright')?.length || 0}/500 characters
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can use simple HTML like &lt;br&gt;, &lt;a&gt;, &lt;strong&gt;
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
            <FileText className="h-4 w-4" />
            Footer Preview
          </CardTitle>
          <CardDescription>
            Xem trước footer sẽ hiển thị như thế nào
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-800 text-white p-6 rounded-lg">
            <div className="text-center">
              <div 
                className="text-sm text-gray-300"
                dangerouslySetInnerHTML={{ 
                  __html: form.watch('copyright') || `© ${currentYear} SEO AI Writer. Tất cả quyền được bảo lưu.`
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mẫu nhanh</CardTitle>
          <CardDescription>
            Click để sử dụng các mẫu copyright có sẵn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.setValue('copyright', `© ${currentYear} SEO AI Writer. Tất cả quyền được bảo lưu.`)}
            >
              Mẫu cơ bản (VI)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.setValue('copyright', `© ${currentYear} SEO AI Writer. All rights reserved.`)}
            >
              Basic template (EN)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.setValue('copyright', `© ${currentYear} SEO AI Writer. Tất cả quyền được bảo lưu.<br>Phát triển bởi <a href="#" class="text-blue-400 hover:underline">[Tên công ty]</a>`)}
            >
              Mẫu có link (VI)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.setValue('copyright', `© ${currentYear} SEO AI Writer. All rights reserved.<br>Developed by <a href="#" class="text-blue-400 hover:underline">[Company Name]</a>`)}
            >
              Template with link (EN)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}