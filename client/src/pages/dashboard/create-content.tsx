import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useLanguage } from "@/hooks/use-language";
import { useDbTranslations } from "@/hooks/use-db-translations";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
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

// Define outline item type
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
  
  // Original interface states - keep this UI
  const [generatedContent, setGeneratedContent] = useState<GenerateContentResponse | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  
  // NEW FLOW: Add article ID tracking for backend logic
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
  
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

  // Generate content mutation - NEW FLOW backend, original UI
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
      
      // STEP 1: Save immediately as draft - NEW FLOW LOGIC
      try {
        console.log("💾 [NEW FLOW] Auto-saving article as draft...");
        
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
          console.log("✅ [NEW FLOW] Article auto-saved successfully with ID:", savedArticle.data.id);
          
          // Set article ID for future save operations 
          setCurrentArticleId(savedArticle.data.id);
          
          // STEP 2: Setup content for UI display - keep original interface
          setGeneratedContent(data);
          setEditedTitle(title);
          setEditedContent(content);
          setIsContentDialogOpen(true);
          
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
        console.error("❌ [NEW FLOW] Auto-save failed:", error);
        
        // Show content anyway but mark as unsaved
        setCurrentArticleId(null);
        setGeneratedContent(data);
        setEditedTitle(title);
        setEditedContent(content);
        setIsContentDialogOpen(true);
        
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

  // Save article mutation for NEW FLOW - using PATCH to update existing draft to published
  const saveArticleMutation = useMutation({
    mutationFn: async () => {
      if (!currentArticleId) {
        // If no article ID, create new article (fallback)
        console.log("💾 [NEW FLOW] No article ID, creating new article...");
        const response = await apiRequest("POST", "/api/dashboard/articles", {
          title: editedTitle,
          content: editedContent,
          keywords: form.getValues().keywords,
          creditsUsed: 0, // No additional credits for manual save
          status: 'published'
        });
        
        if (!response.ok) {
          throw new Error(`Create failed: ${response.status}`);
        }
        
        return await response.json();
      } else {
        // Update existing draft to published
        console.log("💾 [NEW FLOW] Updating existing article ID:", currentArticleId);
        const response = await apiRequest("PATCH", `/api/dashboard/articles/${currentArticleId}`, {
          title: editedTitle,
          content: editedContent,
          status: 'published' // Convert draft to published
        });
        
        if (!response.ok) {
          throw new Error(`Update failed: ${response.status}`);
        }
        
        return await response.json();
      }
    },
    onSuccess: (data) => {
      console.log("✅ [NEW FLOW] Article saved/published successfully:", data);
      setIsSavingArticle(false);
      setIsContentDialogOpen(false);
      
      // Reset states
      setGeneratedContent(null);
      setEditedTitle("");
      setEditedContent("");
      setCurrentArticleId(null);
      
      toast({
        title: "Lưu thành công",
        description: "Bài viết đã được xuất bản thành công.",
      });
    },
    onError: (error) => {
      console.error("❌ [NEW FLOW] Save failed:", error);
      setIsSavingArticle(false);
      toast({
        title: "Lỗi lưu bài viết",
        description: error.message || "Có lỗi xảy ra khi lưu bài viết",
        variant: "destructive",
      });
    },
  });

  // Handle credit confirmation
  const handleCreditConfirm = () => {
    if (pendingFormData) {
      generateContentMutation.mutate(pendingFormData);
      setShowCreditModal(false);
      setPendingFormData(null);
    }
  };

  // Handle saving article (for original interface)
  const handleSaveArticle = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      toast({
        title: "Thông tin không đầy đủ",
        description: "Vui lòng nhập đầy đủ tiêu đề và nội dung",
        variant: "destructive",
      });
      return;
    }

    setIsSavingArticle(true);
    saveArticleMutation.mutate();
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

  // Link items management
  const addLinkItem = () => {
    setLinkItems([...linkItems, { keyword: "", url: "" }]);
  };

  const removeLinkItem = (index: number) => {
    setLinkItems(linkItems.filter((_, i) => i !== index));
  };

  const updateLinkItem = (index: number, field: 'keyword' | 'url', value: string) => {
    const updated = linkItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setLinkItems(updated);
  };

  // Form submission
  const onSubmit = async (values: FormValues) => {
    if (!user?.credits || user.credits < 10) {
      toast({
        title: "Không đủ credit",
        description: "Bạn cần ít nhất 10 credit để tạo nội dung.",
        variant: "destructive",
      });
      return;
    }

    // Update form data with current link items
    const formData = {
      ...values,
      linkItems: linkItems.filter(item => item.keyword && item.url),
      outline: generateOutlineHTML()
    };

    // Show credit confirmation modal
    setPendingFormData(formData);
    setShowCreditModal(true);
  };

  return (
    <DashboardLayout>
      <Head
        title={tDb("dashboard.createContent.title") || "Tạo nội dung SEO"}
        description={tDb("dashboard.createContent.description") || "Tạo nội dung SEO chất lượng cao với AI"}
      />
      
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {tDb("dashboard.createContent.title") || "Tạo nội dung SEO"}
            </h1>
            <p className="text-muted-foreground">
              {tDb("dashboard.createContent.description") || "Tạo nội dung SEO chất lượng cao với AI"}
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {tDb("credit.current") || "Credit hiện tại"}: {user.credits}
              </Badge>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
                <TabsTrigger value="outline">Dàn ý</TabsTrigger>
                <TabsTrigger value="links">Liên kết</TabsTrigger>
                <TabsTrigger value="images">Hình ảnh</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Loại nội dung
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại nội dung" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blog">Bài viết blog</SelectItem>
                            <SelectItem value="product">Mô tả sản phẩm</SelectItem>
                            <SelectItem value="news">Tin tức</SelectItem>
                            <SelectItem value="social">Social media</SelectItem>
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
                        <FormLabel className="flex items-center gap-2">
                          <AlignJustify className="h-4 w-4" />
                          Độ dài
                        </FormLabel>
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
                      <FormLabel className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Từ khóa chính *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập từ khóa chính..." {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Paintbrush className="h-4 w-4" />
                        Phong cách viết
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn phong cách" />
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
                      <FormLabel className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Yêu cầu bổ sung (tùy chọn)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập yêu cầu cụ thể về nội dung..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Mô tả chi tiết về nội dung bạn muốn tạo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Ngôn ngữ
                        </FormLabel>
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
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thị trường</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn thị trường" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vietnam">Việt Nam</SelectItem>
                            <SelectItem value="us">Hoa Kỳ</SelectItem>
                            <SelectItem value="global">Toàn cầu</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="relatedKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Từ khóa liên quan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập các từ khóa liên quan, cách nhau bởi dấu phẩy..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Các từ khóa phụ để tăng độ phong phú cho nội dung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="perspective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Góc nhìn</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn góc nhìn" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="auto">Tự động</SelectItem>
                            <SelectItem value="first">Ngôi thứ nhất</SelectItem>
                            <SelectItem value="second">Ngôi thứ hai</SelectItem>
                            <SelectItem value="third">Ngôi thứ ba</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Độ phức tạp</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn độ phức tạp" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="auto">Tự động</SelectItem>
                            <SelectItem value="basic">Cơ bản</SelectItem>
                            <SelectItem value="intermediate">Trung cấp</SelectItem>
                            <SelectItem value="advanced">Nâng cao</SelectItem>
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
                              <SelectValue placeholder="Chọn mô hình" />
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

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="useWebResearch"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Nghiên cứu web
                          </FormLabel>
                          <FormDescription>
                            Sử dụng thông tin từ internet để làm phong phú nội dung
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="addHeadings"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Tiêu đề phụ
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useBold"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Chữ đậm
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useItalic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Chữ nghiêng
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useBullets"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Danh sách
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="refSources"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nguồn tham khảo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập các URL nguồn tham khảo, mỗi URL một dòng..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Các nguồn tin cậy để AI tham khảo khi tạo nội dung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="outline" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <List className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Tạo dàn ý</h3>
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
                          placeholder="Nhập tiêu đề..."
                          value={currentHeadingText}
                          onChange={(e) => setCurrentHeadingText(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addOutlineItem();
                            }
                          }}
                        />
                        
                        <Button type="button" onClick={addOutlineItem} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {outlineItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                            <Badge variant="outline" className="text-xs">
                              {item.level.toUpperCase()}
                            </Badge>
                            <span className="flex-1">{item.text}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOutlineItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {outlineItems.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                          Chưa có mục nào trong dàn ý. Thêm các tiêu đề để tạo cấu trúc cho bài viết.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="links" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Liên kết trong bài</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {linkItems.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="Từ khóa..."
                              value={item.keyword}
                              onChange={(e) => updateLinkItem(index, 'keyword', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              placeholder="URL..."
                              value={item.url}
                              onChange={(e) => updateLinkItem(index, 'url', e.target.value)}
                              className="flex-1"
                            />
                            {linkItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLinkItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <Button type="button" variant="outline" onClick={addLinkItem} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm liên kết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images" className="space-y-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="generateImages"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Tạo hình ảnh
                          </FormLabel>
                          <FormDescription>
                            Tự động tạo hình ảnh phù hợp với nội dung bài viết
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

                  <FormField
                    control={form.control}
                    name="imageSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Kích thước hình ảnh
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn kích thước" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Nhỏ (512x512)</SelectItem>
                            <SelectItem value="medium">Trung bình (1024x1024)</SelectItem>
                            <SelectItem value="large">Lớn (1792x1024)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

            </Tabs>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={generateContentMutation.isPending}
                className="flex-1"
              >
                {generateContentMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    "Đang tạo..."
                  </div>
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
        title="Xác nhận tạo nội dung"
        breakdown={[
          {
            label: "Tạo nội dung AI",
            credits: 10,
            color: 'default'
          },
          ...(pendingFormData?.generateImages ? [{
            label: "Tạo hình ảnh",
            credits: 5,
            color: 'secondary' as const
          }] : [])
        ]}
        totalCredits={pendingFormData?.generateImages ? 15 : 10}
        userCurrentCredits={user?.credits || 0}
        isLoading={generateContentMutation.isPending}
      />

      {/* Content Dialog - Original Interface */}
      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nội dung đã tạo</DialogTitle>
            <DialogDescription>
              Xem lại và chỉnh sửa nội dung trước khi lưu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Nội dung</Label>
              <div className="mt-1 border rounded-md">
                <ReactQuill
                  value={editedContent}
                  onChange={setEditedContent}
                  theme="snow"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsContentDialogOpen(false)}
            >
              Đóng
            </Button>
            <Button
              onClick={handleSaveArticle}
              disabled={isSavingArticle}
            >
              {isSavingArticle ? "Đang lưu..." : "Lưu bài viết"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}