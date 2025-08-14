import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useLanguage } from "@/hooks/use-language";
import { useDbTranslations } from "@/hooks/use-db-translations";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCreditCache } from "@/hooks/use-credit-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import ReactQuill from 'react-quill';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Pencil, 
  AlertCircle, 
  KeyRound,
  Globe,
  List, 
  FileText,
  Book,
  Paintbrush,
  BookOpenText, 
  PaintBucket, 
  AlignJustify,
  Image,
  Link as LinkIcon,
  X,
  Plus,
  Trash2,
  Bold,
  Italic,
  ListOrdered,
  Heading2
} from "lucide-react";
import { GenerateContentRequest, GenerateContentResponse } from "@shared/types";
import { copyToClipboard, downloadAsFile } from "@/lib/utils";
import Head from "@/components/head";
import { CreditConfirmationModal } from "@/components/CreditConfirmationModal";

const formSchema = z.object({
  contentType: z.enum(["blog", "product", "news", "social"]),
  keywords: z.string().min(3, {
    message: "Từ khóa phải có ít nhất 3 ký tự.",
  }),
  length: z.enum(["short", "medium", "long", "extra_long"]),
  tone: z.enum(["professional", "conversational", "informative", "persuasive", "humorous", "neutral"]),
  prompt: z.string().optional(),
  addHeadings: z.boolean().default(true),
  useBold: z.boolean().default(true),
  useItalic: z.boolean().default(true),
  useBullets: z.boolean().default(true),
  relatedKeywords: z.string().optional(),
  language: z.enum(["vietnamese", "english"]).optional(),
  country: z.enum(["vietnam", "us", "global"]).optional(),
  perspective: z.enum(["auto", "first", "second", "third"]).optional(),
  complexity: z.enum(["auto", "basic", "intermediate", "advanced"]).optional(),
  useWebResearch: z.boolean().default(true),
  refSources: z.string().optional(),
  aiModel: z.enum(["chatgpt", "gemini", "claude"]).optional(),
  linkItems: z.array(
    z.object({
      keyword: z.string().optional(),
      url: z.string().optional()
    })
  ).default([]),
  imageSize: z.enum(["small", "medium", "large"]).default("medium"),
  generateImages: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

// Định nghĩa kiểu dữ liệu cho mục dàn ý
type OutlineItem = {
  id: string;
  level: 'h2' | 'h3' | 'h4';
  text: string;
};

export default function CreateContent() {
  const { t } = useLanguage();
  const { t: tDb } = useDbTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const { invalidateCreditHistory } = useCreditCache();
  
  // NEW FLOW: Simplified states for article workflow
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ title: string; content: string; keywords: string } | null>(null);
  const [isContentSaved, setIsContentSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Keep outline functionality
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [currentHeadingText, setCurrentHeadingText] = useState("");
  const [currentHeadingLevel, setCurrentHeadingLevel] = useState<'h2' | 'h3' | 'h4'>('h2');
  
  // Link items and initialization
  const [linkItems, setLinkItems] = useState<{ keyword: string; url: string }[]>([]);
  const [isLinkItemsInitialized, setIsLinkItemsInitialized] = useState(false);
  
  // Credit confirmation modal states
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentType: "blog",
      keywords: "",
      length: "medium",
      tone: "conversational",
      prompt: "",
      addHeadings: true,
      useBold: true,
      useItalic: true,
      useBullets: true,
      relatedKeywords: "",
      language: "vietnamese",
      country: "vietnam",
      perspective: "auto",
      complexity: "auto",
      useWebResearch: true,
      refSources: "",
      aiModel: "chatgpt",
      linkItems: [],
      imageSize: "medium",
      generateImages: true,
    },
    mode: "onSubmit",
  });
  
  // Initialize link items when needed
  const initializeLinkItems = useCallback(() => {
    if (!isLinkItemsInitialized) {
      setLinkItems([{ keyword: "", url: "" }]);
      setIsLinkItemsInitialized(true);
    }
  }, [isLinkItemsInitialized]);

  // Effect to initialize link items when tab is clicked
  useEffect(() => {
    const tabs = document.querySelectorAll('[role="tab"]');
    const linksTab = Array.from(tabs).find(tab => tab.textContent?.includes('Liên kết'));
    
    linksTab?.addEventListener('click', initializeLinkItems);
    
    return () => {
      linksTab?.removeEventListener('click', initializeLinkItems);
    };
  }, [initializeLinkItems]);

  // NEW FLOW: Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: GenerateContentRequest) => {
      toast({
        title: "Đang tạo nội dung",
        description: "Vui lòng đợi trong khi hệ thống tạo nội dung của bạn...",
      });
      
      const responseData = await apiRequest("POST", "/api/dashboard/generate-content", data);
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to generate content");
      }
      return responseData.data as GenerateContentResponse;
    },
    onSuccess: async (data) => {
      console.log("✅ [NEW FLOW] Content generation success, processing data...");
      
      // Extract content and title
      let content, title, keywords;
      
      if (Array.isArray(data) && data.length > 0) {
        content = data[0].articleContent || data[0].content || "<p>Không có nội dung</p>";
        title = data[0].aiTitle || data[0].title || "Bài viết mới";
        keywords = data[0].keywords || form.getValues().keywords;
      } else {
        content = data.articleContent || data.content || "<p>Không có nội dung</p>";
        title = data.aiTitle || data.title || "Bài viết mới";
        keywords = data.keywords || form.getValues().keywords;
      }
      
      // Clean title
      title = title.replace(/[\r\n\t]+/g, ' ').trim();
      
      // Process keywords
      if (Array.isArray(keywords)) {
        keywords = keywords.join(", ");
      }
      
      console.log("📝 [NEW FLOW] Processed data:", { title, content: content.slice(0, 100) + "...", keywords });
      
      // STEP 1: Save immediately as draft
      try {
        console.log("💾 [NEW FLOW] Saving article as draft...");
        
        const saveResponse = await apiRequest("POST", "/api/dashboard/articles", {
          title,
          content,
          keywords,
          creditsUsed: data.creditsUsed || (Array.isArray(data) ? data[0]?.creditsUsed : null) || 1,
          status: 'draft'
        });
        
        if (!saveResponse.ok) {
          throw new Error(`Save failed: ${saveResponse.status}`);
        }
        
        const savedArticle = await saveResponse.json();
        
        if (savedArticle.success && savedArticle.data?.id) {
          console.log("✅ [NEW FLOW] Article saved successfully with ID:", savedArticle.data.id);
          
          // STEP 2: Set article ID and cache preview data
          setCurrentArticleId(savedArticle.data.id);
          setPreviewData({ title, content, keywords });
          setIsContentSaved(true);
          setSaveError(null);
          setHasUnsavedChanges(false);
          
          // STEP 3: Open preview dialog
          setIsPreviewDialogOpen(true);
          
          // Refresh credit balance
          invalidateCreditHistory();
          
          toast({
            title: "Tạo nội dung thành công",
            description: "Bài viết đã được lưu như bản nháp. Hãy xem lại và xuất bản.",
          });
        } else {
          throw new Error("Invalid response format");
        }
        
      } catch (error) {
        console.error("❌ [NEW FLOW] Save failed:", error);
        
        // Show preview anyway but mark as unsaved
        setCurrentArticleId(null);
        setPreviewData({ title, content, keywords });
        setIsContentSaved(false);
        setSaveError("Chưa lưu - Có lỗi xảy ra khi lưu tự động");
        setHasUnsavedChanges(true);
        
        setIsPreviewDialogOpen(true);
        
        toast({
          title: "Tạo nội dung thành công",
          description: "Nội dung đã được tạo nhưng chưa lưu. Vui lòng lưu thủ công.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error("❌ [NEW FLOW] Content generation failed:", error);
      toast({
        title: "Lỗi tạo nội dung",
        description: error.message || "Có lỗi xảy ra khi tạo nội dung",
        variant: "destructive",
      });
    },
  });

  // NEW FLOW: Save article mutation (for updating existing draft)
  const saveArticleMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!currentArticleId) {
        throw new Error("No article ID to save");
      }
      
      console.log("💾 [NEW FLOW] Saving article changes for ID:", currentArticleId);
      
      const response = await apiRequest("PATCH", `/api/dashboard/articles/${currentArticleId}`, {
        title,
        content,
        status: 'published' // First save makes it published
      });
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("✅ [NEW FLOW] Article saved successfully:", data);
      setIsContentSaved(true);
      setHasUnsavedChanges(false);
      setSaveError(null);
      setIsPreviewDialogOpen(false);
      
      // Refresh credit balance
      invalidateCreditHistory();
      
      toast({
        title: "Lưu thành công",
        description: "Bài viết đã được xuất bản thành công.",
      });
    },
    onError: (error) => {
      console.error("❌ [NEW FLOW] Save failed:", error);
      toast({
        title: "Lỗi lưu bài viết",
        description: error.message || "Có lỗi xảy ra khi lưu bài viết",
        variant: "destructive",
      });
    },
  });

  // Load article data when needed
  const { data: articleData, refetch: refetchArticle } = useQuery({
    queryKey: ['/api/dashboard/articles', currentArticleId],
    enabled: !!currentArticleId && isPreviewDialogOpen,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Handle form submission with credit confirmation
  const handleFormSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để sử dụng tính năng này",
        variant: "destructive",
      });
      return;
    }

    // Show credit confirmation modal
    setPendingFormData(data);
    setShowCreditModal(true);
  };

  // Handle credit confirmation
  const handleCreditConfirm = () => {
    if (pendingFormData) {
      generateContentMutation.mutate(pendingFormData);
      setShowCreditModal(false);
      setPendingFormData(null);
    }
  };

  // Handle title/content changes in preview
  const handlePreviewTitleChange = (newTitle: string) => {
    if (previewData) {
      setPreviewData({ ...previewData, title: newTitle });
      setHasUnsavedChanges(true);
    }
  };

  const handlePreviewContentChange = (newContent: string) => {
    if (previewData) {
      setPreviewData({ ...previewData, content: newContent });
      setHasUnsavedChanges(true);
    }
  };

  // Handle save from preview
  const handleSaveFromPreview = () => {
    if (previewData) {
      saveArticleMutation.mutate({
        title: previewData.title,
        content: previewData.content
      });
    }
  };

  // Handle dialog close with warning
  const handleClosePreview = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng không?");
      if (!confirmed) return;
    }
    
    setIsPreviewDialogOpen(false);
    setHasUnsavedChanges(false);
  };

  // Handle create new article
  const handleCreateNew = () => {
    setCurrentArticleId(null);
    setPreviewData(null);
    setIsContentSaved(false);
    setHasUnsavedChanges(false);
    setSaveError(null);
    setIsPreviewDialogOpen(false);
    form.reset();
    
    toast({
      title: "Đã tạo bài viết mới",
      description: "Form đã được reset để tạo bài viết mới",
    });
  };

  // Outline management functions
  const addOutlineItem = () => {
    if (currentHeadingText.trim()) {
      const newItem: OutlineItem = {
        id: Date.now().toString(),
        level: currentHeadingLevel,
        text: currentHeadingText.trim(),
      };
      setOutlineItems([...outlineItems, newItem]);
      setCurrentHeadingText("");
    }
  };

  const removeOutlineItem = (id: string) => {
    setOutlineItems(outlineItems.filter(item => item.id !== id));
  };

  const generateOutlineHTML = () => {
    return outlineItems.map(item => 
      `<${item.level}>${item.text}</${item.level}>`
    ).join('\n');
  };

  // Link management functions
  const addLinkItem = () => {
    setLinkItems([...linkItems, { keyword: "", url: "" }]);
  };

  const removeLinkItem = (index: number) => {
    const newItems = linkItems.filter((_, i) => i !== index);
    setLinkItems(newItems);
    form.setValue("linkItems", newItems);
  };

  const updateLinkItem = (index: number, field: 'keyword' | 'url', value: string) => {
    const newItems = [...linkItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLinkItems(newItems);
    form.setValue("linkItems", newItems);
  };

  return (
    <DashboardLayout>
      <Head title="Tạo nội dung - SEO AI Writer" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tDb('dashboard.createContent.title', 'Tạo nội dung')}</h1>
            <p className="text-muted-foreground">
              {tDb('dashboard.createContent.description', 'Tạo nội dung chất lượng cao với AI')}
            </p>
          </div>
          
          {currentArticleId && (
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Tạo bài viết mới
            </Button>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{t('dashboard.createContent.tabs.basic')}</TabsTrigger>
                <TabsTrigger value="advanced">{t('dashboard.createContent.tabs.advanced')}</TabsTrigger>
                <TabsTrigger value="outline">{t('dashboard.createContent.tabs.outline')}</TabsTrigger>
                <TabsTrigger value="links">{t('dashboard.createContent.tabs.links')}</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại nội dung</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại nội dung" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blog">Blog</SelectItem>
                            <SelectItem value="product">Sản phẩm</SelectItem>
                            <SelectItem value="news">Tin tức</SelectItem>
                            <SelectItem value="social">Mạng xã hội</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Độ dài</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn độ dài" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="short">Ngắn (300-500 từ)</SelectItem>
                            <SelectItem value="medium">Trung bình (500-1000 từ)</SelectItem>
                            <SelectItem value="long">Dài (1000-2000 từ)</SelectItem>
                            <SelectItem value="extra_long">Rất dài (2000+ từ)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Từ khóa chính</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập từ khóa chính..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Từ khóa chính mà bạn muốn tối ưu SEO
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone giọng</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tone giọng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                          <SelectItem value="conversational">Thân thiện</SelectItem>
                          <SelectItem value="informative">Thông tin</SelectItem>
                          <SelectItem value="persuasive">Thuyết phục</SelectItem>
                          <SelectItem value="humorous">Hài hước</SelectItem>
                          <SelectItem value="neutral">Trung tính</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yêu cầu bổ sung (tùy chọn)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Mô tả chi tiết về nội dung bạn muốn tạo..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Thêm yêu cầu cụ thể để AI hiểu rõ hơn về nội dung bạn cần
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngôn ngữ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn ngôn ngữ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô hình AI</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn mô hình AI" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="chatgpt">ChatGPT</SelectItem>
                            <SelectItem value="gemini">Gemini</SelectItem>
                            <SelectItem value="claude">Claude</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Định dạng nội dung</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="addHeadings"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Thêm tiêu đề</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useBold"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Chữ đậm</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useItalic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Chữ nghiêng</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useBullets"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Danh sách</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="generateImages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Tạo hình ảnh</FormLabel>
                        <FormDescription>
                          Tự động tạo hình ảnh phù hợp với nội dung
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
              </TabsContent>

              {/* Outline Tab */}
              <TabsContent value="outline" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="heading-text">Dàn ý bài viết</Label>
                    <p className="text-sm text-muted-foreground">
                      Tạo dàn ý để AI viết theo cấu trúc bạn mong muốn
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={currentHeadingLevel} onValueChange={(value: 'h2' | 'h3' | 'h4') => setCurrentHeadingLevel(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h2">H2</SelectItem>
                        <SelectItem value="h3">H3</SelectItem>
                        <SelectItem value="h4">H4</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      id="heading-text"
                      placeholder="Nhập tiêu đề phần..."
                      value={currentHeadingText}
                      onChange={(e) => setCurrentHeadingText(e.target.value)}
                      className="flex-1"
                    />
                    
                    <Button type="button" onClick={addOutlineItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {outlineItems.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {outlineItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{item.level.toUpperCase()}</Badge>
                                <span>{item.text}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOutlineItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Links Tab */}
              <TabsContent value="links" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Liên kết nội bộ</Label>
                    <p className="text-sm text-muted-foreground">
                      Thêm liên kết nội bộ để tối ưu SEO
                    </p>
                  </div>

                  {linkItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Từ khóa liên kết"
                        value={item.keyword}
                        onChange={(e) => updateLinkItem(index, 'keyword', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="URL liên kết"
                        value={item.url}
                        onChange={(e) => updateLinkItem(index, 'url', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeLinkItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addLinkItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm liên kết
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                size="lg" 
                disabled={generateContentMutation.isPending}
                className="min-w-[200px]"
              >
                {generateContentMutation.isPending ? (
                  "Đang tạo..."
                ) : (
                  "Tạo nội dung"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Credit Confirmation Modal */}
      <CreditConfirmationModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={handleCreditConfirm}
        formData={pendingFormData}
      />

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Xem trước bài viết
              {saveError && (
                <Badge variant="destructive" className="text-xs">
                  {saveError}
                </Badge>
              )}
              {isContentSaved && !hasUnsavedChanges && (
                <Badge variant="secondary" className="text-xs">
                  Đã lưu
                </Badge>
              )}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs">
                  Có thay đổi
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Xem lại và chỉnh sửa nội dung trước khi xuất bản
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="preview-title">Tiêu đề</Label>
                <Input
                  id="preview-title"
                  value={previewData.title}
                  onChange={(e) => handlePreviewTitleChange(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              <div>
                <Label htmlFor="preview-content">Nội dung</Label>
                <ReactQuill
                  value={previewData.content}
                  onChange={handlePreviewContentChange}
                  theme="snow"
                  className="min-h-[400px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClosePreview}>
              Đóng
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveFromPreview}
                disabled={saveArticleMutation.isPending || !currentArticleId}
              >
                {saveArticleMutation.isPending ? "Đang lưu..." : "Xuất bản"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}