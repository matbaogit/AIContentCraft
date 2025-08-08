import { useState } from "react";
import { AdminLayout } from "@/components/admin/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EmailTemplate } from "@shared/schema";
import {
  Edit,
  Plus,
  Trash2,
  Mail,
  Eye,
} from "lucide-react";
import Head from "@/components/head";

const emailTemplateFormSchema = z.object({
  type: z.enum(['verification', 'reset_password', 'welcome', 'notification']),
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().min(1, "Text content is required"),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean(),
});

type EmailTemplateFormValues = z.infer<typeof emailTemplateFormSchema>;

const emailTypeLabels = {
  verification: "Email xác thực",
  reset_password: "Email đặt lại mật khẩu", 
  welcome: "Email chào mừng",
  notification: "Email thông báo"
};

const availableVariables = {
  verification: ["{username}", "{verificationUrl}"],
  reset_password: ["{username}", "{resetUrl}"],
  welcome: ["{username}", "{loginUrl}"],
  notification: ["{username}", "{message}"]
};

export default function EmailTemplatesManagement() {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  // Fetch email templates
  const { data: templatesResponse, isLoading } = useQuery<{success: boolean, data: EmailTemplate[]}>({
    queryKey: ["/api/admin/email-templates"],
  });

  const templates = templatesResponse?.data || [];

  // Form setup
  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: {
      type: "verification",
      name: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: [],
      isActive: true,
    },
  });

  const selectedType = form.watch("type");

  // Create/Update mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormValues) => {
      const endpoint = selectedTemplate 
        ? `/api/admin/email-templates/${selectedTemplate.id}`
        : "/api/admin/email-templates";
      const method = selectedTemplate ? "PATCH" : "POST";
      const result = await apiRequest(method, endpoint, data);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: selectedTemplate ? "Template đã được cập nhật" : "Template đã được tạo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Template đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active state
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const result = await apiRequest("PATCH", `/api/admin/email-templates/${id}`, { isActive });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    form.reset({
      type: template.type as any,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      variables: template.variables || [],
      isActive: template.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    form.reset();
    setIsEditDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewHtml(template.htmlContent);
    setIsPreviewDialogOpen(true);
  };

  const onSubmit = (data: EmailTemplateFormValues) => {
    saveTemplateMutation.mutate(data);
  };

  const handleToggleActive = (id: number, currentState: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentState });
  };

  const insertVariable = (variable: string) => {
    const htmlContent = form.getValues("htmlContent");
    const textContent = form.getValues("textContent");
    
    form.setValue("htmlContent", htmlContent + variable);
    form.setValue("textContent", textContent + variable);
  };

  return (
    <>
      <Head>
        <title>Quản lý Email Templates - Admin</title>
      </Head>
      
      <AdminLayout title="Quản lý Email Templates">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Quản lý các mẫu email tự động của hệ thống
                </CardDescription>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo Template Mới
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">Đang tải...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {emailTypeLabels[template.type as keyof typeof emailTypeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={() => handleToggleActive(template.id, template.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Bạn có chắc muốn xóa template này?")) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit/Create Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? "Chỉnh sửa Email Template" : "Tạo Email Template mới"}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate ? "Cập nhật thông tin email template" : "Tạo mẫu email mới cho hệ thống"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại Template *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="verification">Email xác thực</SelectItem>
                            <SelectItem value="reset_password">Email đặt lại mật khẩu</SelectItem>
                            <SelectItem value="welcome">Email chào mừng</SelectItem>
                            <SelectItem value="notification">Email thông báo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Template *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: Email xác thực tài khoản" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề Email *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Xác nhận tài khoản ToolBox của bạn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Available Variables */}
                {selectedType && availableVariables[selectedType] && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium mb-2">Biến có sẵn:</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableVariables[selectedType].map((variable) => (
                        <Button
                          key={variable}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable)}
                        >
                          {variable}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="htmlContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội dung HTML *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập nội dung HTML của email..." 
                          className="min-h-[200px] font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Sử dụng HTML để định dạng email. Có thể sử dụng các biến như {availableVariables[selectedType]?.join(", ") || ""}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="textContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội dung Text *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập nội dung text thuần của email..." 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Phiên bản text thuần không có định dạng, dùng làm fallback
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Kích hoạt Template
                        </FormLabel>
                        <FormDescription>
                          Template sẽ được sử dụng khi gửi email tự động
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveTemplateMutation.isPending}
                  >
                    {saveTemplateMutation.isPending ? "Đang lưu..." : "Lưu"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                <Mail className="inline mr-2 h-5 w-5" />
                Xem trước: {selectedTemplate?.name}
              </DialogTitle>
              <DialogDescription>
                Subject: {selectedTemplate?.subject}
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg p-4 max-h-[60vh] overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsPreviewDialogOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}