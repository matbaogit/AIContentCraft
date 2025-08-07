import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const footerSchema = z.object({
  copyright_text: z.string().optional(),
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().optional(),
  links: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).optional(),
  social_links: z.array(z.object({
    platform: z.string(),
    url: z.string(),
  })).optional(),
  additional_content: z.string().optional(),
  language: z.enum(["vi", "en"]),
});

type FooterData = z.infer<typeof footerSchema>;

export default function FooterSettings() {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState<"vi" | "en">("vi");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/appearance/settings", "footer", currentLanguage],
    retry: false,
  });

  const form = useForm<FooterData>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      copyright_text: "",
      company_name: "",
      company_address: "",
      company_phone: "",
      company_email: "",
      links: [{ title: "", url: "" }],
      social_links: [{ platform: "facebook", url: "" }],
      additional_content: "",
      language: currentLanguage,
    },
  });

  // Update form when data changes
  React.useEffect(() => {
    if (settings && Array.isArray(settings.data) && settings.data.length > 0) {
      const footerData = settings.data.find((s: any) => s.type === "footer" && s.language === currentLanguage);
      if (footerData?.content) {
        form.reset({
          ...footerData.content,
          language: currentLanguage,
        });
      }
    }
  }, [settings, currentLanguage, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FooterData) => {
      return apiRequest("PATCH", `/api/admin/appearance/settings`, {
        type: "footer",
        language: currentLanguage,
        content: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt footer đã được cập nhật",
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

  const onSubmit = (data: FooterData) => {
    updateMutation.mutate(data);
  };

  const addLink = () => {
    const currentLinks = form.getValues("links") || [];
    form.setValue("links", [...currentLinks, { title: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    const currentLinks = form.getValues("links") || [];
    form.setValue("links", currentLinks.filter((_, i) => i !== index));
  };

  const addSocialLink = () => {
    const currentSocial = form.getValues("social_links") || [];
    form.setValue("social_links", [...currentSocial, { platform: "facebook", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    const currentSocial = form.getValues("social_links") || [];
    form.setValue("social_links", currentSocial.filter((_, i) => i !== index));
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
                {/* Thông tin công ty */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin công ty</CardTitle>
                    <CardDescription>Thông tin cơ bản về công ty</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên công ty</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SEO AI Writer Co., Ltd" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="123 Nguyễn Văn A, Quận 1, TP.HCM" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(+84) 123 456 789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="contact@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Copyright */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Copyright & Legal</CardTitle>
                    <CardDescription>Text bản quyền và nội dung bổ sung</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="copyright_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text bản quyền</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="© 2024 SEO AI Writer. All rights reserved." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additional_content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nội dung bổ sung</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Thông tin bổ sung khác..." rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Navigation Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Navigation Links
                    <Button type="button" onClick={addLink} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm link
                    </Button>
                  </CardTitle>
                  <CardDescription>Các liên kết navigation trong footer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {form.watch("links")?.map((_, index) => (
                      <div key={index} className="flex gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={`links.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Tiêu đề</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Về chúng tôi" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`links.${index}.url`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="/about" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          onClick={() => removeLink(index)}
                          size="sm"
                          variant="destructive"
                          disabled={form.watch("links")?.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Social Media Links
                    <Button type="button" onClick={addSocialLink} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm social
                    </Button>
                  </CardTitle>
                  <CardDescription>Các liên kết mạng xã hội</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {form.watch("social_links")?.map((_, index) => (
                      <div key={index} className="flex gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={`social_links.${index}.platform`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Platform</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="facebook" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`social_links.${index}.url`}
                          render={({ field }) => (
                            <FormItem className="flex-2">
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://facebook.com/yourpage" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          onClick={() => removeSocialLink(index)}
                          size="sm"
                          variant="destructive"
                          disabled={form.watch("social_links")?.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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