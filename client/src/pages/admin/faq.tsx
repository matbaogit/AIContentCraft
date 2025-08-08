import { useState } from "react";
import { AdminLayout } from "@/components/admin/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
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
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Faq } from "@shared/schema";
import {
  Edit,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Head from "@/components/head";

const faqFormSchema = z.object({
  questionVi: z.string().min(1, "Câu hỏi tiếng Việt là bắt buộc"),
  answerVi: z.string().min(1, "Câu trả lời tiếng Việt là bắt buộc"),
  questionEn: z.string().optional(),
  answerEn: z.string().optional(),
  order: z.number().min(0),
  isActive: z.boolean(),
});

type FaqFormValues = z.infer<typeof faqFormSchema>;

export default function FaqManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);

  // Fetch FAQs
  const { data: faqsResponse, isLoading } = useQuery<{success: boolean, data: Faq[]}>({
    queryKey: ["/api/admin/faqs"],
  });

  const faqs = faqsResponse?.data || [];

  // Form setup
  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      questionVi: "",
      answerVi: "",
      questionEn: "",
      answerEn: "",
      order: 0,
      isActive: true,
    },
  });

  // Create/Update mutation
  const saveFaqMutation = useMutation({
    mutationFn: async (data: FaqFormValues) => {
      const endpoint = selectedFaq 
        ? `/api/admin/faqs/${selectedFaq.id}`
        : "/api/admin/faqs";
      const method = selectedFaq ? "PATCH" : "POST";
      const result = await apiRequest(method, endpoint, data);
      return result;
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: selectedFaq ? t("admin.faq.updateSuccess") : t("admin.faq.createSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      setIsEditDialogOpen(false);
      setSelectedFaq(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteFaqMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await apiRequest("DELETE", `/api/admin/faqs/${id}`);
      return result;
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("admin.faq.deleteSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active state
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const result = await apiRequest("PATCH", `/api/admin/faqs/${id}`, { isActive });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update order
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number; order: number }) => {
      const result = await apiRequest("PATCH", `/api/admin/faqs/${id}`, { order });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (faq: Faq) => {
    setSelectedFaq(faq);
    form.reset({
      questionVi: faq.questionVi,
      answerVi: faq.answerVi,
      questionEn: faq.questionEn || "",
      answerEn: faq.answerEn || "",
      order: faq.order,
      isActive: faq.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedFaq(null);
    form.reset();
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: FaqFormValues) => {
    saveFaqMutation.mutate(data);
  };

  const handleToggleActive = (id: number, currentState: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentState });
  };

  const handleMoveOrder = (id: number, currentOrder: number, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    updateOrderMutation.mutate({ id, order: newOrder });
  };

  return (
    <>
      <Head>
        <title>{t("admin.faq.title")} - Admin</title>
      </Head>
      
      <AdminLayout title={t("admin.faq.title")}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t("admin.faq.title")}</CardTitle>
                <CardDescription>
                  {t("admin.faq.description")}
                </CardDescription>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.faq.addNew")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">{t("common.loading")}</div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {t("admin.faq.noFaq")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.faq.order")}</TableHead>
                    <TableHead>{t("admin.faq.question")}</TableHead>
                    <TableHead>{t("admin.faq.answer")}</TableHead>
                    <TableHead>{t("admin.faq.isActive")}</TableHead>
                    <TableHead>{t("common.admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs
                    .sort((a, b) => a.order - b.order)
                    .map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-mono">{faq.order}</span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => handleMoveOrder(faq.id, faq.order, 'up')}
                              disabled={faq.order <= 1}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => handleMoveOrder(faq.id, faq.order, 'down')}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{faq.questionVi}</div>
                          {faq.questionEn && (
                            <div className="text-sm text-gray-500 truncate">{faq.questionEn}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-sm">
                          <div className="text-sm truncate">{faq.answerVi}</div>
                          {faq.answerEn && (
                            <div className="text-xs text-gray-500 truncate mt-1">{faq.answerEn}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={faq.isActive}
                          onCheckedChange={() => handleToggleActive(faq.id, faq.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(faq)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(t("admin.faq.deleteConfirm"))) {
                                deleteFaqMutation.mutate(faq.id);
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedFaq ? t("admin.faq.editFaq") : t("admin.faq.createFaq")}
              </DialogTitle>
              <DialogDescription>
                {selectedFaq ? "Cập nhật thông tin FAQ" : "Thêm FAQ mới vào danh sách"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="questionVi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.faq.questionVi")} *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Nhập câu hỏi tiếng Việt..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="questionEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.faq.questionEn")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter English question..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="answerVi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.faq.answerVi")} *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập câu trả lời tiếng Việt..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="answerEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.faq.answerEn")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter English answer..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.faq.order")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Thứ tự hiển thị (số càng nhỏ càng ưu tiên)
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
                            {t("admin.faq.isActive")}
                          </FormLabel>
                          <FormDescription>
                            Hiển thị FAQ này trên trang chủ
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
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    {t("admin.faq.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveFaqMutation.isPending}
                  >
                    {saveFaqMutation.isPending ? t("common.saving") : t("admin.faq.save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}