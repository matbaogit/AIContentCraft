import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin/Layout";
import { FileText, Save, Eye, Globe, AlertCircle } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const legalPageSchema = z.object({
  title_vi: z.string().min(1, "Tiêu đề tiếng Việt là bắt buộc"),
  title_en: z.string().min(1, "Tiêu đề tiếng Anh là bắt buộc"),
  content_vi: z.string().min(10, "Nội dung tiếng Việt phải có ít nhất 10 ký tự"),
  content_en: z.string().min(10, "Nội dung tiếng Anh phải có ít nhất 10 ký tự"),
  lastUpdated: z.string().optional(),
});

type LegalPageFormValues = z.infer<typeof legalPageSchema>;

interface LegalPage {
  id: string;
  title_vi: string;
  title_en: string;
  content_vi: string;
  content_en: string;
  lastUpdated: string;
  path: string;
  description: string;
}

// Safe ReactQuill wrapper to avoid "leaf.position is not a function" error
interface SafeReactQuillProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  modules?: any;
  formats?: string[];
}

const SafeReactQuill = ({ value, onChange, placeholder, modules, formats }: SafeReactQuillProps) => {
  const [localValue, setLocalValue] = useState(value || "");
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = useCallback((content: string) => {
    if (content !== localValue) {
      setLocalValue(content);
      try {
        onChange(content);
      } catch (error) {
        console.warn("ReactQuill warning suppressed:", error);
      }
    }
  }, [localValue, onChange]);

  return (
    <ReactQuill
      theme="snow"
      value={localValue}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      style={{ minHeight: '300px' }}
    />
  );
};

export default function LegalPagesManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("privacy-policy");

  // ReactQuill configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];

  // Fetch legal pages data
  const { data: legalPages, isLoading } = useQuery({
    queryKey: ["/api/admin/legal-pages"],
    retry: false,
  });

  // Update legal page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ pageId, data }: { pageId: string; data: LegalPageFormValues }) => {
      const response = await apiRequest("PUT", `/api/admin/legal-pages/${pageId}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Cập nhật thành công",
          description: "Nội dung trang đã được cập nhật",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/legal-pages"] });
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi cập nhật",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật nội dung",
        variant: "destructive",
      });
    },
  });

  const pages: LegalPage[] = (legalPages as any)?.data || [
    {
      id: "privacy-policy",
      title_vi: "Chính Sách Bảo Mật",
      title_en: "Privacy Policy",
      content_vi: "Nội dung chính sách bảo mật tiếng Việt...",
      content_en: "Privacy policy content in English...",
      lastUpdated: "2025-07-25",
      path: "/privacy-policy",
      description: "Chính sách bảo vệ thông tin người dùng"
    },
    {
      id: "data-deletion",
      title_vi: "Hướng Dẫn Xóa Dữ Liệu",
      title_en: "Data Deletion Instructions", 
      content_vi: "Hướng dẫn xóa dữ liệu tiếng Việt...",
      content_en: "Data deletion instructions in English...",
      lastUpdated: "2025-07-25",
      path: "/data-deletion",
      description: "Hướng dẫn yêu cầu xóa dữ liệu cá nhân"
    },
    {
      id: "terms-of-service",
      title_vi: "Điều Khoản Dịch Vụ",
      title_en: "Terms of Service",
      content_vi: "Điều khoản dịch vụ tiếng Việt...",
      content_en: "Terms of service in English...",
      lastUpdated: "2025-07-25", 
      path: "/terms-of-service",
      description: "Các điều khoản và điều kiện sử dụng"
    }
  ];

  const currentPage = pages.find(p => p.id === activeTab);

  const form = useForm<LegalPageFormValues>({
    resolver: zodResolver(legalPageSchema),
    defaultValues: {
      title_vi: currentPage?.title_vi || "",
      title_en: currentPage?.title_en || "",
      content_vi: currentPage?.content_vi || "",
      content_en: currentPage?.content_en || "",
      lastUpdated: new Date().toISOString().split('T')[0],
    },
  });

  // Reset form when tab changes - using useMemo to prevent re-renders
  const formData = useMemo(() => {
    if (currentPage) {
      return {
        title_vi: currentPage.title_vi,
        title_en: currentPage.title_en,
        content_vi: currentPage.content_vi,
        content_en: currentPage.content_en,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    }
    return null;
  }, [currentPage?.id, activeTab]);

  useEffect(() => {
    if (formData) {
      form.reset(formData);
    }
  }, [formData]);

  const onSubmit = (data: LegalPageFormValues) => {
    if (!currentPage) return;
    
    updatePageMutation.mutate({
      pageId: currentPage.id,
      data: {
        ...data,
        lastUpdated: new Date().toISOString().split('T')[0],
      }
    });
  };

  const previewPage = (path: string) => {
    window.open(path, '_blank');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quản Lý Trang Pháp Lý
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Chỉnh sửa nội dung các trang pháp lý của hệ thống
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => currentPage && previewPage(currentPage.path)}
              disabled={!currentPage}
            >
              <Eye className="w-4 h-4 mr-2" />
              Xem trước
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pages.map((page) => (
            <Card key={page.id} className={`cursor-pointer transition-all ${activeTab === page.id ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    {page.title_vi}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {page.path}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {page.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Cập nhật: {page.lastUpdated}
                  </span>
                  <Button
                    size="sm"
                    variant={activeTab === page.id ? "default" : "outline"}
                    onClick={() => setActiveTab(page.id)}
                  >
                    {activeTab === page.id ? "Đang chỉnh sửa" : "Chỉnh sửa"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Editor */}
        {currentPage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Chỉnh sửa: {currentPage.title_vi}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Đường dẫn: {currentPage.path}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="vietnamese" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="vietnamese">
                        🇻🇳 Tiếng Việt
                      </TabsTrigger>
                      <TabsTrigger value="english">
                        🇺🇸 English
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="vietnamese" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title_vi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiêu đề (Tiếng Việt)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nhập tiêu đề trang..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content_vi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nội dung (Tiếng Việt)</FormLabel>
                            <FormControl>
                              <div className="bg-white dark:bg-gray-800 rounded-md border">
                                <SafeReactQuill
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  modules={quillModules}
                                  formats={quillFormats}
                                  placeholder="Nhập nội dung trang bằng tiếng Việt..."
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500">
                              Sử dụng thanh công cụ để định dạng văn bản với tiêu đề, in đậm, in nghiêng, danh sách, liên kết, v.v.
                            </p>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="english" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title_en"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title (English)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter page title..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content_en"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content (English)</FormLabel>
                            <FormControl>
                              <div className="bg-white dark:bg-gray-800 rounded-md border">
                                <SafeReactQuill
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  modules={quillModules}
                                  formats={quillFormats}
                                  placeholder="Enter page content in English..."
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500">
                              Use the toolbar to format text with headers, bold, italic, lists, links, etc.
                            </p>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <AlertCircle className="w-4 h-4" />
                      <span>Thay đổi sẽ có hiệu lực ngay lập tức</span>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => previewPage(currentPage.path)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem trước
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={updatePageMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updatePageMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}