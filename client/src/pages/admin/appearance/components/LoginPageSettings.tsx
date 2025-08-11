import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload, Eye, Save } from "lucide-react";

const loginPageSchema = z.object({
  logo_url: z.string().optional(),
  logo_width: z.string().optional(),
  logo_height: z.string().optional(),
  page_title: z.string().min(1, "Tiêu đề trang web không được để trống"),
  site_title: z.string().min(1, "Tiêu đề trang không được để trống"),
  login_title: z.string().min(1, "Tiêu đề đăng nhập không được để trống"),
  login_subtitle: z.string().optional(),
  username_label: z.string().min(1, "Label tên đăng nhập không được để trống"),
  username_placeholder: z.string().optional(),
  password_label: z.string().min(1, "Label mật khẩu không được để trống"),
  password_placeholder: z.string().optional(),
  remember_me_label: z.string().optional(),
  forgot_password_text: z.string().optional(),
  login_button_text: z.string().min(1, "Text nút đăng nhập không được để trống"),
  register_title: z.string().min(1, "Tiêu đề đăng ký không được để trống"),
  register_subtitle: z.string().optional(),
  footer_text: z.string().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
  button_color: z.string().optional(),
  language: z.enum(["vi", "en"]),
});

type LoginPageData = z.infer<typeof loginPageSchema>;

export default function LoginPageSettings() {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState<"vi" | "en">("vi");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/appearance/settings", "login_page", currentLanguage],
    queryFn: () => apiRequest("GET", `/api/admin/appearance/settings?type=login_page&language=${currentLanguage}`),
    retry: false,
  });

  const form = useForm<LoginPageData>({
    resolver: zodResolver(loginPageSchema),
    defaultValues: {
      logo_url: "",
      logo_width: "48",
      logo_height: "48",
      page_title: "SEO AI Writer",
      site_title: "",
      login_title: "",
      login_subtitle: "",
      username_label: "Tên đăng nhập hoặc Email",
      username_placeholder: "",
      password_label: "Mật khẩu",
      password_placeholder: "",
      remember_me_label: "Ghi nhớ đăng nhập",
      forgot_password_text: "Quên mật khẩu?",
      login_button_text: "Đăng nhập",
      register_title: "",
      register_subtitle: "",
      footer_text: "",
      background_color: "#ffffff",
      text_color: "#000000",
      button_color: "#3b82f6",
      language: currentLanguage,
    },
  });

  // Update form when data changes
  React.useEffect(() => {
    if (settings && settings.success && Array.isArray(settings.data) && settings.data.length > 0) {
      const loginPageSettings = settings.data.filter((s: any) => s.type === "login_page" && s.language === currentLanguage);
      
      if (loginPageSettings.length > 0) {
        // Convert array of settings back to object
        const formData: any = { language: currentLanguage };
        loginPageSettings.forEach((setting: any) => {
          formData[setting.key] = setting.value;
        });
        
        // Set default values for any missing fields
        const defaultValues = {
          logo_url: "",
          page_title: "SEO AI Writer",
          site_title: "",
          login_title: "",
          login_subtitle: "",
          username_label: "Tên đăng nhập hoặc Email",
          username_placeholder: "",
          password_label: "Mật khẩu",
          password_placeholder: "",
          remember_me_label: "Ghi nhớ đăng nhập",
          forgot_password_text: "Quên mật khẩu?",
          login_button_text: "Đăng nhập",
          register_title: "",
          register_subtitle: "",
          footer_text: "",
          background_color: "#ffffff",
          text_color: "#000000",
          button_color: "#3b82f6",
        };
        
        form.reset({
          ...defaultValues,
          ...formData,
        });
      }
    }
  }, [settings, currentLanguage, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: LoginPageData) => {
      // Update each setting individually as the API expects
      const updates = Object.entries(data).map(([key, value]) => {
        if (key === 'language') return Promise.resolve(); // Skip language field
        return apiRequest("PATCH", `/api/admin/appearance/settings`, {
          type: "login_page",
          key: key,
          value: value,
          language: currentLanguage,
        });
      });

      // Wait for all updates to complete
      return Promise.all(updates.filter(Boolean));
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt trang đăng nhập đã được cập nhật",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/appearance/settings"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginPageData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={currentLanguage} onValueChange={(value) => setCurrentLanguage(value as "vi" | "en")}>
        <TabsList>
          <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>

        <TabsContent value={currentLanguage} className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo và Branding */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Logo & Branding</CardTitle>
                    <CardDescription>Logo và thông tin branding trang đăng nhập</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com/logo.png" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="logo_width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chiều rộng logo (px)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="48" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logo_height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chiều cao logo (px)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="48" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="page_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiêu đề trang web (HTML Title)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SEO AI Writer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="site_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên trang web hiển thị</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SEO AI Writer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Nội dung đăng nhập */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nội dung đăng nhập</CardTitle>
                    <CardDescription>Text hiển thị trong form đăng nhập</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="login_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiêu đề đăng nhập</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Đăng nhập vào tài khoản" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="login_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả đăng nhập</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Nhập thông tin để truy cập hệ thống" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label tên đăng nhập</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tên đăng nhập hoặc Email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username_placeholder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placeholder tên đăng nhập</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nhập tên đăng nhập..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label mật khẩu</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Mật khẩu" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password_placeholder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placeholder mật khẩu</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nhập mật khẩu..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="remember_me_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text "Ghi nhớ đăng nhập"</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ghi nhớ đăng nhập" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="forgot_password_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text "Quên mật khẩu"</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Quên mật khẩu?" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="login_button_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text nút đăng nhập</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Đăng nhập" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Nội dung đăng ký */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nội dung đăng ký</CardTitle>
                    <CardDescription>Text hiển thị trong form đăng ký</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="register_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiêu đề đăng ký</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tạo tài khoản mới" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="register_subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả đăng ký</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Điền thông tin để tạo tài khoản" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Tùy chỉnh giao diện */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tùy chỉnh giao diện</CardTitle>
                    <CardDescription>Màu sắc và footer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="background_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Màu nền</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="text_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Màu chữ</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="button_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Màu nút</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="footer_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text footer</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="© 2024 SEO AI Writer. All rights reserved." rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="min-w-[140px]"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Lưu cài đặt
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}