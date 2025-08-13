import { useState, useRef, useEffect, useCallback } from "react";
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
  const [generatedContent, setGeneratedContent] = useState<GenerateContentResponse | null>(null);
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [currentHeadingText, setCurrentHeadingText] = useState("");
  const [currentHeadingLevel, setCurrentHeadingLevel] = useState<'h2' | 'h3' | 'h4'>('h2');
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  
  // Khởi tạo linkItems ban đầu
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
  
  // Effect para inicializar os itens de link quando carrega o componente
  useEffect(() => {
    const tabs = document.querySelectorAll('[role="tab"]');
    const linksTab = Array.from(tabs).find(tab => tab.textContent?.includes('Liên kết'));
    
    // Adiciona um listener ao tab de links
    linksTab?.addEventListener('click', initializeLinkItems);
    
    return () => {
      linksTab?.removeEventListener('click', initializeLinkItems);
    };
  }, []);

  const generateContentMutation = useMutation({
    mutationFn: async (data: GenerateContentRequest) => {
      // Hiển thị thông báo đang xử lý
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
      // Kiểm tra cấu trúc dữ liệu từ webhook và trích xuất đúng cách
      console.log("Data structure from webhook:", JSON.stringify(data, null, 2));
      
      // Xử lý content
      let content;
      if (Array.isArray(data) && data.length > 0 && data[0].articleContent) {
        // Trường hợp data là array (được trả về từ một số loại webhook)
        content = data[0].articleContent;
      } else if (data.articleContent) {
        // Trường hợp data là object có articleContent
        content = data.articleContent;
      } else {
        // Mặc định sử dụng content
        content = data.content || "<p>Không có nội dung</p>";
      }
      
      // Xử lý title - làm sạch và định dạng tiêu đề
      let title;
      if (Array.isArray(data) && data.length > 0 && data[0].aiTitle) {
        // Trường hợp data là array
        title = data[0].aiTitle.replace(/[\r\n\t]+/g, ' ').trim();
      } else if (data.aiTitle) {
        // Trường hợp data là object có aiTitle
        title = data.aiTitle.replace(/[\r\n\t]+/g, ' ').trim();
      } else {
        // Sử dụng title nếu không có aiTitle
        title = data.title || "Bài viết mới";
      }
      
      console.log("Webhook response data:", data);
      console.log("Using title from webhook:", title);
      
      // Lưu bài viết ngay khi tạo thành công
      try {
        // Lưu nội dung vào database với giá trị từ webhook
        console.log("Saving article with title:", title);
        
        // Xử lý keywords - đảm bảo đúng định dạng
        let keywords;
        if (Array.isArray(data.keywords)) {
          keywords = data.keywords.join(", ");
        } else if (typeof data.keywords === 'string') {
          keywords = data.keywords;
        } else {
          // Mặc định sử dụng keywords từ form nếu không có
          keywords = form.getValues().keywords;
        }
        
        // AUTO-SAVE AS DRAFT: Tự động lưu bản nháp
        console.log("🔄 [AUTO-SAVE DRAFT] Saving article as draft...");
        
        // Extract credits used for saving
        let creditsUsedForSave = 1; // Default fallback
        if (data.creditsUsed) {
          creditsUsedForSave = data.creditsUsed;
        } else if (Array.isArray(data) && data.length > 0 && data[0].creditsUsed) {
          creditsUsedForSave = data[0].creditsUsed;
        }
        
        const saveResponse = await apiRequest("POST", "/api/dashboard/articles", {
          title: title,
          content: content,
          keywords: keywords,
          creditsUsed: creditsUsedForSave,
          status: 'draft' // Lưu làm bản nháp
        });
        
        const savedArticle = await saveResponse.json();
        
        // Cập nhật trạng thái với ID bài viết đã lưu
        console.log("Draft auto-save result:", savedArticle);
        if (savedArticle.success && savedArticle.data) {
          console.log("✓ Draft auto-save thành công, articleId:", savedArticle.data.id);
          console.log("🔄 [DRAFT AUTO-SAVE SUCCESS] setGeneratedContent with articleId:", savedArticle.data.id);
          setGeneratedContent({
            ...data,
            title: title,
            content: content,
            articleId: savedArticle.data.id // Lưu ID bài viết để cập nhật sau này
          });
        } else {
          console.log("✗ Draft auto-save thất bại, không có articleId");
          console.log("🔄 [DRAFT AUTO-SAVE FAIL] setGeneratedContent WITHOUT articleId");
          setGeneratedContent({
            ...data,
            title: title,
            content: content
          });
        }
      } catch (error) {
        console.error("Không thể lưu bản nháp tự động:", error);
        console.log("🔄 [DRAFT AUTO-SAVE ERROR] setGeneratedContent WITHOUT articleId due to error");
        setGeneratedContent({
          ...data,
          title: title,
          content: content
        });
      }
      
      // Hiển thị tiêu đề và nội dung từ webhook trong dialog
      // Đảm bảo hiển thị aiTitle từ webhook trong trường tiêu đề
      console.log("Setting edited title to:", title);
      if (title && title.trim() !== '') {
        setEditedTitle(title);
      } else {
        setEditedTitle("Bài viết mới");
      }
      
      // Cập nhật nội dung từ articleContent hoặc content
      if (content && content.trim() !== '') {
        setEditedContent(content);
      } else {
        setEditedContent("<p>Nhập nội dung bài viết của bạn ở đây...</p>");
      }
      
      // Hiển thị dialog chỉnh sửa
      setIsContentDialogOpen(true);
      
      // Extract credits used from the response structure
      // Log response structure to debug
      console.log('Response data structure:', data);
      
      let creditsUsed = 1; // Default fallback
      if (data.creditsUsed) {
        creditsUsed = data.creditsUsed;
      } else if (Array.isArray(data) && data.length > 0 && data[0].creditsUsed) {
        creditsUsed = data[0].creditsUsed;
      }
      
      console.log('Credits used extracted:', creditsUsed);
      console.log('Full response data for debugging:', {
        creditsUsed: data.creditsUsed,
        actualUsed: creditsUsed
      });
      
      toast({
        title: "Đã tạo nội dung thành công",
        description: `Đã sử dụng ${creditsUsed} tín dụng và lưu bản nháp tự động`,
      });

      // Invalidate credit history cache
      invalidateCreditHistory();
    },
    onError: (error: Error) => {
      toast({
        title: "Không thể tạo nội dung",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to calculate credit breakdown
  const calculateCreditBreakdown = (data: FormValues) => {
    const breakdown = [];
    let totalCredits = 0;

    // Content length credits
    let contentCredits = 1;
    switch (data.length) {
      case 'short':
        contentCredits = 1;
        break;
      case 'medium':
        contentCredits = 3;
        break;
      case 'long':
        contentCredits = 5;
        break;
      case 'extra_long':
        contentCredits = 8;
        break;
    }
    
    const lengthLabels = {
      'short': 'Nội dung ngắn',
      'medium': 'Nội dung trung bình', 
      'long': 'Nội dung dài',
      'extra_long': 'Nội dung rất dài'
    };
    
    breakdown.push({
      label: lengthLabels[data.length],
      credits: contentCredits,
      color: 'default' as const
    });
    totalCredits += contentCredits;

    // AI Model credits
    if (data.aiModel) {
      let aiCredits = 1;
      const aiLabels = {
        'chatgpt': 'ChatGPT AI',
        'gemini': 'Gemini AI',
        'claude': 'Claude AI'
      };
      
      switch (data.aiModel) {
        case 'chatgpt':
          aiCredits = 1;
          break;
        case 'gemini':
          aiCredits = 1;
          break;
        case 'claude':
          aiCredits = 2;
          break;
      }
      
      breakdown.push({
        label: aiLabels[data.aiModel],
        credits: aiCredits,
        color: 'secondary' as const
      });
      totalCredits += aiCredits;
    }

    // Image generation credits
    if (data.generateImages) {
      // Estimate image count (default logic from backend)
      let imageCount = 1;
      if (data.length === 'short') imageCount = 1;
      else if (data.length === 'medium') imageCount = 2;
      else if (data.length === 'long') imageCount = 3;
      else if (data.length === 'extra_long') imageCount = 4;
      
      const imageCredits = imageCount * 2; // 2 credits per image
      
      breakdown.push({
        label: `Tạo ${imageCount} hình ảnh`,
        credits: imageCredits,
        color: 'outline' as const
      });
      totalCredits += imageCredits;
    }

    return { breakdown, totalCredits };
  };

  const onSubmit = (data: FormValues) => {
    console.log("onSubmit triggered", data);
    
    // Kiểm tra từ khóa trước
    if (!data.keywords || data.keywords.trim() === '') {
      toast({
        title: "Thiếu từ khóa",
        description: "Vui lòng nhập ít nhất một từ khóa",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate credit breakdown
    const { breakdown, totalCredits } = calculateCreditBreakdown(data);
    
    // Store form data for later use
    setPendingFormData(data);
    
    // Show credit confirmation modal
    setShowCreditModal(true);
  };

  // Function to actually submit after credit confirmation
  const confirmAndSubmit = () => {
    if (!pendingFormData) return;
    
    setShowCreditModal(false);
    
    // Show processing toast
    toast({
      title: "Đang tạo nội dung",
      description: "Vui lòng đợi trong khi hệ thống tạo nội dung của bạn...",
    });

    // Đặt relatedKeywords vào request và xử lý linkItems
    const filteredLinkItems = pendingFormData.linkItems
      ? pendingFormData.linkItems.filter(item => item.keyword && item.url)
      : [];
    
    // Đã kiểm tra keywords ở phía trên rồi
      
    // Tách từ khóa chính và từ khóa phụ từ chuỗi keywords
    const keywordsArray = pendingFormData.keywords.split(',').filter(Boolean);
    const mainKeyword = keywordsArray.length > 0 ? keywordsArray[0].trim() : '';
    const secondaryKeywords = keywordsArray.length > 1 ? keywordsArray.slice(1).map(k => k.trim()) : [];

    // Convert form data to match the expected JSON format
    const requestData = {
      keywords: pendingFormData.keywords, // Main keywords field
      mainKeyword: mainKeyword, // Primary keyword
      secondaryKeywords: secondaryKeywords.join(','), // Secondary keywords
      length: pendingFormData.length,
      tone: pendingFormData.tone,
      prompt: pendingFormData.prompt || '',
      addHeadings: pendingFormData.addHeadings,
      useBold: pendingFormData.useBold,
      useItalic: pendingFormData.useItalic,
      useBullets: pendingFormData.useBullets,
      relatedKeywords: pendingFormData.relatedKeywords || "",
      language: pendingFormData.language || 'vietnamese',
      country: pendingFormData.country || 'vietnam',
      perspective: pendingFormData.perspective || 'auto',
      complexity: pendingFormData.complexity || 'auto', // Match expected format
      useWebResearch: pendingFormData.useWebResearch || false,
      refSources: pendingFormData.refSources || "",
      aiModel: pendingFormData.aiModel || 'chatgpt',
      linkItems: filteredLinkItems,
      imageSize: pendingFormData.imageSize || 'medium',
      generateImages: pendingFormData.generateImages || false,
      image_size: (() => {
        const size = pendingFormData.imageSize || 'medium';
        switch(size) {
          case 'small':
            return { width: 640, height: 480 };
          case 'medium':
            return { width: 1280, height: 720 };
          case 'large':
            return { width: 1920, height: 1080 };
          default:
            return { width: 1280, height: 720 };
        }
      })(),
      // Add additional fields to match expected format
      userId: user?.id,
      username: user?.username,
      timestamp: new Date().toISOString()
    };

    console.log('Sending content generation request:', requestData);
    generateContentMutation.mutate(requestData);
  };

  // Hàm trả về kích thước hình ảnh theo định dạng width/height dựa trên loại kích thước
  const getImageSizeDimensions = (size: string) => {
    switch(size) {
      case 'small':
        return { width: 640, height: 480 };
      case 'medium':
        return { width: 1080, height: 1920 };
      case 'large':
        return { width: 1920, height: 1080 };
      default:
        return { width: 1080, height: 1920 }; // Mặc định là medium
    }
  };

  const handleCopyContent = () => {
    if (generatedContent) {
      copyToClipboard(generatedContent.content)
        .then(() => {
          toast({
            title: "Đã sao chép vào clipboard",
            description: "Nội dung đã được sao chép vào clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Không thể sao chép",
            description: "Không thể sao chép nội dung vào clipboard",
            variant: "destructive",
          });
        });
    }
  };

  const handleDownloadContent = () => {
    if (generatedContent) {
      downloadAsFile(
        generatedContent.content,
        `${generatedContent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
        "text/html"
      );
      
      toast({
        title: "Đã tải xuống",
        description: "Nội dung đã được tải xuống thành công",
      });
    }
  };

  const handleSaveArticle = async () => {
    console.log("=== handleSaveArticle CALLED ===");
    console.log("- generatedContent:", generatedContent ? "EXISTS" : "NULL");
    console.log("- isSavingArticle:", isSavingArticle);
    
    if (generatedContent && !isSavingArticle) {
      try {
        setIsSavingArticle(true);
        
        toast({
          title: "Đang lưu bài viết",
          description: "Vui lòng đợi trong khi hệ thống lưu bài viết của bạn...",
        });
        
        // Kiểm tra xem bài viết đã tồn tại chưa
        const articlePayload = {
          title: generatedContent.title || '',
          content: editedContent || generatedContent.content,
          keywords: generatedContent.keywords.join(", "),
          creditsUsed: generatedContent.creditsUsed,
        };
        
        // Nếu đã có ID bài viết, thì gửi lên để cập nhật bài viết cũ
        if (generatedContent.articleId) {
          (articlePayload as any)['id'] = generatedContent.articleId;
        }
        
        // Đảm bảo tiêu đề từ form được sử dụng khi lưu bài viết
        const articlePayloadWithTitle = {
          ...articlePayload,
          title: editedTitle // Sử dụng tiêu đề đã chỉnh sửa từ dialog
        };
        
        // Gửi request lưu hoặc cập nhật bài viết
        console.log("Debug handleSaveArticle:");
        console.log("- generatedContent.articleId:", generatedContent.articleId);
        console.log("- generatedContent.articleId type:", typeof generatedContent.articleId);
        console.log("- generatedContent.articleId truthy?:", !!generatedContent.articleId);
        console.log("- articlePayloadWithTitle:", articlePayloadWithTitle);
        
        let response;
        if (generatedContent.articleId) {
          // Cập nhật bài viết đã tồn tại
          console.log("→ Sử dụng PATCH để cập nhật bài viết ID:", generatedContent.articleId);
          response = await apiRequest("PATCH", `/api/dashboard/articles/${generatedContent.articleId}`, articlePayloadWithTitle);
        } else {
          // Tạo bài viết mới
          console.log("→ Sử dụng POST để tạo bài viết mới (articleId is falsy)");
          response = await apiRequest("POST", "/api/dashboard/articles", articlePayloadWithTitle);
        }
        const result = await response.json();
        
        // Đóng dialog sau khi lưu thành công
        setIsContentDialogOpen(false);
        
        // Cập nhật articleId nếu đây là lần tạo mới
        if (!generatedContent.articleId && result.success && result.data?.id) {
          console.log("🔄 [MANUAL SAVE SUCCESS] Updating generatedContent with new articleId:", result.data.id);
          setGeneratedContent({
            ...generatedContent,
            articleId: result.data.id
          });
        } else if (generatedContent.articleId) {
          console.log("🔄 [MANUAL SAVE SUCCESS] Keeping existing articleId:", generatedContent.articleId);
          // Giữ nguyên state với articleId để có thể update tiếp
        }
        
        // Thêm button "Tạo bài viết mới" để user có thể reset khi muốn
        // Không tự động reset form để user có thể tiếp tục chỉnh sửa bài viết hiện tại
        
        toast({
          title: "Đã cập nhật bài viết",
          description: "Bản nháp đã được cập nhật thành công.",
        });
      } catch (error) {
        console.error("Lỗi khi lưu bài viết:", error);
        
        // Hiển thị thông báo lỗi
        toast({
          title: "Lỗi khi cập nhật", 
          description: "Có lỗi xảy ra khi cập nhật bản nháp. Vui lòng thử lại.",
          variant: "destructive",
        });
        
        // Đóng dialog nhưng giữ lại state để user có thể thử lại
        setIsContentDialogOpen(false);
        console.log("🔄 [MANUAL SAVE ERROR] Keeping generatedContent state for retry");
        // Không reset state để user có thể thử save lại
      } finally {
        setIsSavingArticle(false);
      }
    }
  };

  // Hàm kiểm tra số lượng từ khóa phụ (không bao gồm từ khóa chính)
  const getSecondaryKeywordCount = () => {
    const keywords = form.watch("keywords").split(",").filter(Boolean);
    return keywords.length > 1 ? keywords.slice(1).length : 0;
  };

  // Hàm chuyển dàn ý thành prompt text
  const convertOutlineToText = (items: OutlineItem[]): string => {
    if (items.length === 0) return "";
    
    return items.map(item => {
      const prefix = item.level === 'h2' ? '# ' : item.level === 'h3' ? '## ' : '### ';
      return `${prefix}${item.text}`;
    }).join('\n');
  };
  
  // Xử lý khi thêm mục dàn ý mới
  const handleAddOutlineItem = () => {
    if (currentHeadingText.trim()) {
      const newItem: OutlineItem = {
        id: Date.now().toString(),
        level: currentHeadingLevel,
        text: currentHeadingText.trim()
      };
      
      const updatedItems = [...outlineItems, newItem];
      setOutlineItems(updatedItems);
      
      // Cập nhật prompt
      const outlineText = convertOutlineToText(updatedItems);
      form.setValue('prompt', outlineText);
      
      // Reset input
      setCurrentHeadingText('');
    }
  };
  
  // Xử lý khi xóa mục
  const handleRemoveOutlineItem = (id: string) => {
    const updatedItems = outlineItems.filter(item => item.id !== id);
    setOutlineItems(updatedItems);
    
    // Cập nhật prompt
    const outlineText = convertOutlineToText(updatedItems);
    form.setValue('prompt', outlineText);
  };
  
  // Xử lý khi cập nhật mục
  const handleUpdateOutlineItem = (id: string, data: Partial<OutlineItem>) => {
    const updatedItems = outlineItems.map(item => 
      item.id === id ? { ...item, ...data } : item
    );
    
    setOutlineItems(updatedItems);
    
    // Cập nhật prompt
    const outlineText = convertOutlineToText(updatedItems);
    form.setValue('prompt', outlineText);
  };
  
  // Khởi tạo liên kết đầu tiên khi vào tab liên kết
  const initializeLinkItems = () => {
    if (!isLinkItemsInitialized) {
      const currentItems = form.watch("linkItems") || [];
      if (currentItems.length === 0) {
        form.setValue("linkItems", [{ keyword: "", url: "" }]);
      }
      setIsLinkItemsInitialized(true);
    }
  };
  
  // Xử lý khi lưu nội dung từ dialog
  const handleSaveEditedContent = () => {
    if (generatedContent) {
      // Cập nhật nội dung và tiêu đề đã chỉnh sửa vào generatedContent
      console.log("🔄 [EDIT CONTENT] setGeneratedContent with updated title/content, preserving articleId:", generatedContent.articleId);
      setGeneratedContent({
        ...generatedContent,
        title: editedTitle, // Sử dụng tiêu đề đã chỉnh sửa
        content: editedContent // ReactQuill trả về HTML
      });
      
      // Đóng dialog
      setIsContentDialogOpen(false);
      
      toast({
        title: "Đã cập nhật nội dung",
        description: "Nội dung đã được cập nhật thành công",
      });
    }
  };

  // Xử lý khi xuất bản nội dung
  const handlePublishContent = () => {
    // Lưu nội dung đã chỉnh sửa
    handleSaveEditedContent();
    
    // Hiển thị thông báo
    toast({
      title: "Đang xuất bản nội dung",
      description: "Nội dung đang được xuất bản...",
    });
    
    // TODO: Thực hiện xuất bản nội dung lên website
    // Đây là phần sẽ triển khai sau khi có API xuất bản
  };

  return (
    <>
      <Head>
        <title>{t("dashboard.createContent")} - {t("common.appName")}</title>
      </Head>
      <DashboardLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#ffffff]">{t("dashboard.create.title")}</h1>
          <div className="bg-secondary-100 px-3 py-1 rounded-full text-sm font-medium flex items-center text-[#ffffff]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 text-accent-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
            {user?.credits || 0} {t("common.credits")}
          </div>
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-gray-500 mb-4">{t("dashboard.create.subtitle")}</p>
        </div>
        
        <Card className="create-content-card">
          <CardContent className="p-6">
            <Tabs defaultValue="keywords" className="w-full create-content-tabs">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-full md:w-64">
                  <TabsList className="grid w-full grid-cols-1 h-auto tabs-list">
                    <TabsTrigger value="keywords" className="flex items-center justify-start tab-trigger">
                      <KeyRound className="h-5 w-5 mr-2" />
                      <span>{t("dashboard.create.tabs.keywords")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="outline" className="flex items-center justify-start tab-trigger">
                      <List className="h-5 w-5 mr-2" />
                      <span>{t("dashboard.create.tabs.outline")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center justify-start tab-trigger">
                      <FileText className="h-5 w-5 mr-2" />
                      <span>{t("dashboard.create.tabs.content")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="flex items-center justify-start tab-trigger">
                      <BookOpenText className="h-5 w-5 mr-2" />
                      <span>{t("dashboard.create.tabs.knowledge")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="format" className="flex items-center justify-start tab-trigger">
                      <AlignJustify className="h-5 w-5 mr-2" />
                      <span>{t("dashboard.create.tabs.format")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="links" className="flex items-center justify-start tab-trigger">
                      <LinkIcon className="h-5 w-5 mr-2" />
                      <span>{t("dashboard.create.tabs.links")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="media" className="flex items-center justify-start tab-trigger">
                      <Image className="h-5 w-5 mr-2" />
                      <span>{t("dashboard.create.tabs.media")}</span>
                    </TabsTrigger>

                  </TabsList>
                </div>
                
                <div className="flex-1">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <TabsContent value="keywords" className="mt-0 border rounded-lg p-6 border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-100">{t("dashboard.create.keywords.title")}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t("dashboard.create.keywords.description")}</p>
                        
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="length"
                            render={({ field }) => (
                              <FormItem className="content-form-field">
                                <FormLabel className="content-form-label">{t("dashboard.create.form.lengthLabel")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("dashboard.create.form.lengthPlaceholder")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="short">{t("dashboard.create.form.lengthOptions.short")}</SelectItem>
                                    <SelectItem value="medium">{t("dashboard.create.form.lengthOptions.medium")}</SelectItem>
                                    <SelectItem value="long">{t("dashboard.create.form.lengthOptions.long")}</SelectItem>
                                    <SelectItem value="extra_long">{t("dashboard.create.form.lengthOptions.extraLong")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Từ khóa chính */}
                          <div className="content-form-field">
                            <Label htmlFor="mainKeyword" className="content-form-label block">
                              {t("dashboard.create.keywords.mainKeyword")} <span className="text-red-500">*</span>
                            </Label>
                            
                            {/* Trường input thông thường cho từ khóa chính */}
                            <Input 
                              id="mainKeyword"
                              placeholder={t("dashboard.create.keywords.mainKeywordPlaceholder")}
                              className="mt-1 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary"
                              value={form.watch("keywords").split(",")[0] || ""}
                              onChange={(e) => {
                                // Không trim giá trị để cho phép nhập dấu cách
                                const mainKeyword = e.target.value;
                                const currentKeywords = form.watch("keywords").split(",").filter(Boolean);
                                const secondaryKeywords = currentKeywords.length > 1 ? currentKeywords.slice(1) : [];
                                const newKeywords = mainKeyword 
                                  ? [mainKeyword, ...secondaryKeywords]
                                  : secondaryKeywords;
                                form.setValue("keywords", newKeywords.join(","));
                              }}
                            />
                          </div>
                          
                          {/* Từ khóa phụ */}
                          <div className="content-form-field">
                            <Label htmlFor="secondaryKeyword" className="content-form-label block">
                              {t("dashboard.create.keywords.secondaryKeyword")}
                              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                                ({getSecondaryKeywordCount()}/3)
                              </span>
                            </Label>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                              {form.watch("keywords").split(",").filter(Boolean).map((keyword, index) => {
                                if (index === 0) return null; // Skip main keyword
                                return (
                                  <Badge
                                    key={index}
                                    className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-sm font-medium text-cyan-700 dark:bg-cyan-900 dark:text-cyan-100"
                                  >
                                    <span className="mr-1">{keyword.trim()}</span>
                                    <button
                                      type="button"
                                      className="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-cyan-600 dark:text-cyan-100 hover:bg-cyan-200 hover:text-cyan-800 dark:hover:bg-cyan-800 dark:hover:text-white focus:outline-none"
                                      onClick={() => {
                                        const currentKeywords = form.watch("keywords").split(",").filter(Boolean);
                                        currentKeywords.splice(index, 1);
                                        form.setValue("keywords", currentKeywords.join(","));
                                      }}
                                    >
                                      <span className="sr-only">Remove keyword</span>
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                            
                            <div className="flex mt-1">
                              <Input 
                                id="secondaryKeyword"
                                placeholder={t("dashboard.create.keywords.secondaryKeywordPlaceholder")}
                                className="flex-1 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary"
                                disabled={getSecondaryKeywordCount() >= 3}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const keyword = input.value.trim();
                                    if (keyword && getSecondaryKeywordCount() < 3) {
                                      const currentKeywords = form.watch("keywords").split(",").filter(Boolean);
                                      // Đảm bảo từ khóa chính vẫn ở vị trí đầu tiên
                                      const mainKeyword = currentKeywords.length > 0 ? currentKeywords[0] : "";
                                      // Lấy các từ khóa phụ hiện tại
                                      const secondaryKeywords = currentKeywords.length > 1 ? currentKeywords.slice(1) : [];
                                      // Thêm từ khóa mới vào mảng từ khóa phụ nếu chưa đủ 3 từ
                                      if (secondaryKeywords.length < 3) {
                                        secondaryKeywords.push(keyword);
                                        // Gộp lại với từ khóa chính
                                        const newKeywords = [mainKeyword, ...secondaryKeywords].filter(Boolean);
                                        form.setValue("keywords", newKeywords.join(","));
                                        input.value = "";
                                      }
                                    }
                                  }
                                }}
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="ml-2 bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                                disabled={getSecondaryKeywordCount() >= 3}
                                onClick={() => {
                                  const input = document.getElementById("secondaryKeyword") as HTMLInputElement;
                                  const keyword = input.value.trim();
                                  if (keyword && getSecondaryKeywordCount() < 3) {
                                    const currentKeywords = form.watch("keywords").split(",").filter(Boolean);
                                    // Đảm bảo từ khóa chính vẫn ở vị trí đầu tiên
                                    const mainKeyword = currentKeywords.length > 0 ? currentKeywords[0] : "";
                                    // Lấy các từ khóa phụ hiện tại
                                    const secondaryKeywords = currentKeywords.length > 1 ? currentKeywords.slice(1) : [];
                                    // Thêm từ khóa mới vào mảng từ khóa phụ nếu chưa đủ 3 từ
                                    if (secondaryKeywords.length < 3) {
                                      secondaryKeywords.push(keyword);
                                      // Gộp lại với từ khóa chính
                                      const newKeywords = [mainKeyword, ...secondaryKeywords].filter(Boolean);
                                      form.setValue("keywords", newKeywords.join(","));
                                      input.value = "";
                                    }
                                  }
                                }}
                              >
                                {t("dashboard.create.keywords.addNew")}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Từ khóa liên quan */}
                          <div>
                            <Label htmlFor="relatedKeyword" className="text-gray-700 dark:text-gray-200 mb-1 block">
                              {t("dashboard.create.keywords.relatedKeyword")}
                              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                                ({(form.watch("relatedKeywords") || "").split(",").filter(Boolean).length}/3)
                              </span>
                            </Label>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(form.watch("relatedKeywords") || "").split(",").filter(Boolean).map((keyword, index) => (
                                <Badge
                                  key={index}
                                  className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100"
                                >
                                  <span className="mr-1">{keyword.trim()}</span>
                                  <button
                                    type="button"
                                    className="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-emerald-600 dark:text-emerald-100 hover:bg-emerald-200 hover:text-emerald-800 dark:hover:bg-emerald-800 dark:hover:text-white focus:outline-none"
                                    onClick={() => {
                                      const currentRelatedKeywords = (form.watch("relatedKeywords") || "").split(",").filter(Boolean);
                                      currentRelatedKeywords.splice(index, 1);
                                      form.setValue("relatedKeywords", currentRelatedKeywords.join(","));
                                    }}
                                  >
                                    <span className="sr-only">Remove keyword</span>
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex mt-1">
                              <Input 
                                id="relatedKeyword"
                                placeholder={t("dashboard.create.keywords.relatedKeywordPlaceholder")}
                                className="flex-1 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary"
                                disabled={(form.watch("relatedKeywords") || "").split(",").filter(Boolean).length >= 3}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const keyword = input.value.trim();
                                    if (keyword) {
                                      const currentRelatedKeywords = (form.watch("relatedKeywords") || "").split(",").filter(Boolean);
                                      if (currentRelatedKeywords.length < 3) {
                                        currentRelatedKeywords.push(keyword);
                                        form.setValue("relatedKeywords", currentRelatedKeywords.join(","));
                                        input.value = "";
                                      }
                                    }
                                  }
                                }}
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="ml-2 bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                                disabled={(form.watch("relatedKeywords") || "").split(",").filter(Boolean).length >= 3}
                                onClick={() => {
                                  const input = document.getElementById("relatedKeyword") as HTMLInputElement;
                                  const keyword = input.value.trim();
                                  if (keyword) {
                                    const currentRelatedKeywords = (form.watch("relatedKeywords") || "").split(",").filter(Boolean);
                                    if (currentRelatedKeywords.length < 3) {
                                      currentRelatedKeywords.push(keyword);
                                      form.setValue("relatedKeywords", currentRelatedKeywords.join(","));
                                      input.value = "";
                                    }
                                  }
                                }}
                              >
                                {t("dashboard.create.keywords.addNew")}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Content Type section - Hidden as requested by user */}
                          {/* <div className="pt-4 border-t mt-4">
                            <FormField
                              control={form.control}
                              name="contentType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("dashboard.create.form.contentType")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select content type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="blog">{t("dashboard.create.form.contentTypeOptions.blog")}</SelectItem>
                                      <SelectItem value="product">{t("dashboard.create.form.contentTypeOptions.product")}</SelectItem>
                                      <SelectItem value="news">{t("dashboard.create.form.contentTypeOptions.news")}</SelectItem>
                                      <SelectItem value="social">{t("dashboard.create.form.contentTypeOptions.social")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div> */}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="outline" className="mt-0 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-100">{t("dashboard.create.outline.title")}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t("dashboard.create.outline.description")}</p>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                          <div className="flex items-center mb-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-200 text-violet-600 flex items-center justify-center mr-2">
                              <span className="text-sm">1</span>
                            </div>
                            <div className="font-medium">{t("dashboard.create.outline.customizeStructure")}</div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 pl-8">
                            {t("dashboard.create.outline.autoGenerateMessage")}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {outlineItems.length === 0 ? (
                            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                              {t("dashboard.create.outline.empty")}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {outlineItems.map((item) => (
                                <div key={item.id} className="flex items-start space-x-2">
                                  <div className="flex-shrink-0">
                                    <Select
                                      value={item.level}
                                      onValueChange={(value: string) => 
                                        handleUpdateOutlineItem(item.id, { level: value as 'h2' | 'h3' | 'h4' })
                                      }
                                    >
                                      <SelectTrigger className="w-20 h-10">
                                        <SelectValue placeholder="H2" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="h2">H2</SelectItem>
                                        <SelectItem value="h3">H3</SelectItem>
                                        <SelectItem value="h4">H4</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex-grow">
                                    <Input 
                                      value={item.text}
                                      onChange={(e) => handleUpdateOutlineItem(item.id, { text: e.target.value })}
                                      placeholder={t("dashboard.create.outline.headingPlaceholder")} 
                                      className="h-10 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary"
                                    />
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500"
                                    onClick={() => handleRemoveOutlineItem(item.id)}
                                  >
                                    <span className="sr-only">Delete</span>
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0">
                                <Select
                                  value={currentHeadingLevel}
                                  onValueChange={(value) => 
                                    setCurrentHeadingLevel(value as 'h2' | 'h3' | 'h4')
                                  }
                                >
                                  <SelectTrigger className="w-20 h-10">
                                    <SelectValue placeholder="H2" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="h2">H2</SelectItem>
                                    <SelectItem value="h3">H3</SelectItem>
                                    <SelectItem value="h4">H4</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-grow">
                                <Input 
                                  value={currentHeadingText}
                                  onChange={(e) => setCurrentHeadingText(e.target.value)}
                                  placeholder={t("dashboard.create.outline.headingPlaceholder")} 
                                  className="h-10 border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary"
                                />
                              </div>
                            </div>
                            
                            <Button 
                              type="button"
                              variant="outline" 
                              className="flex items-center text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/50 dark:hover:bg-violet-900 dark:text-violet-300 w-full justify-center"
                              onClick={handleAddOutlineItem}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t("dashboard.create.outline.addStructure")}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="content" className="mt-0 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                        <div className="flex items-start">
                          <FileText className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-100">{t("dashboard.create.content.title")}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t("dashboard.create.content.description")}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-6">

                          {/* Ngôn ngữ */}
                          <div className="space-y-2">
                            <Label htmlFor="language" className="block text-sm font-medium">
                              {t("dashboard.create.content.language")}
                            </Label>
                            <FormField
                              control={form.control}
                              name="language"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("dashboard.create.content.selectLanguage")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="vietnamese">{t("dashboard.create.content.languages.vietnamese")}</SelectItem>
                                      <SelectItem value="english">{t("dashboard.create.content.languages.english")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {t("dashboard.create.content.languageHint")}
                            </p>
                          </div>
                          
                          {/* Quốc gia */}
                          <div className="space-y-2">
                            <Label htmlFor="country" className="block text-sm font-medium">
                              {t("dashboard.create.content.country")}
                            </Label>
                            <FormField
                              control={form.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("dashboard.create.content.selectCountry")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="vietnam">{t("dashboard.create.content.countries.vietnam")}</SelectItem>
                                      <SelectItem value="us">{t("dashboard.create.content.countries.us")}</SelectItem>
                                      <SelectItem value="global">{t("dashboard.create.content.countries.global")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {t("dashboard.create.content.countryHint")}
                            </p>
                          </div>
                          
                          {/* Giọng nói */}
                          <div className="space-y-2">
                            <Label htmlFor="tone" className="block text-sm font-medium">
                              {t("dashboard.create.content.voice")}
                            </Label>
                            <FormField
                              control={form.control}
                              name="tone"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("dashboard.create.content.selectVoice")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="professional">{t("dashboard.create.form.toneOptions.professional")}</SelectItem>
                                      <SelectItem value="conversational">{t("dashboard.create.form.toneOptions.conversational")}</SelectItem>
                                      <SelectItem value="informative">{t("dashboard.create.form.toneOptions.informative")}</SelectItem>
                                      <SelectItem value="persuasive">{t("dashboard.create.form.toneOptions.persuasive")}</SelectItem>
                                      <SelectItem value="humorous">{t("dashboard.create.form.toneOptions.humorous")}</SelectItem>
                                      <SelectItem value="neutral">{t("dashboard.create.content.voices.neutral")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {t("dashboard.create.content.voiceHint")}
                            </p>
                          </div>
                          
                          {/* Ngôi kể */}
                          <div className="space-y-2">
                            <Label htmlFor="perspective" className="block text-sm font-medium">
                              {t("dashboard.create.content.perspective")}
                            </Label>
                            <FormField
                              control={form.control}
                              name="perspective"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("dashboard.create.content.selectPerspective")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="auto">{t("dashboard.create.content.perspectives.auto")}</SelectItem>
                                      <SelectItem value="first">{t("dashboard.create.content.perspectives.first")}</SelectItem>
                                      <SelectItem value="second">{t("dashboard.create.content.perspectives.second")}</SelectItem>
                                      <SelectItem value="third">{t("dashboard.create.content.perspectives.third")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {t("dashboard.create.content.perspectiveHint")}
                            </p>
                          </div>
                          
                          {/* Mức độ */}
                          <div className="space-y-2">
                            <Label htmlFor="complexity" className="block text-sm font-medium">
                              {t("dashboard.create.content.complexity")}
                            </Label>
                            <FormField
                              control={form.control}
                              name="complexity"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("dashboard.create.content.selectComplexity")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="auto">{t("dashboard.create.content.complexities.auto")}</SelectItem>
                                      <SelectItem value="basic">{t("dashboard.create.content.complexities.basic")}</SelectItem>
                                      <SelectItem value="intermediate">{t("dashboard.create.content.complexities.intermediate")}</SelectItem>
                                      <SelectItem value="advanced">{t("dashboard.create.content.complexities.advanced")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {t("dashboard.create.content.complexityHint")}
                            </p>
                          </div>
                          

                        </div>
                      </TabsContent>
                      
                      <TabsContent value="style" className="mt-0 border rounded-lg p-4">
                        <div className="flex items-start">
                          <Paintbrush className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-100">Phong cách</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Tùy chỉnh phong cách của nội dung</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="tone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Giọng điệu nội dung</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tone" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="professional">{t("dashboard.create.form.toneOptions.professional")}</SelectItem>
                                    <SelectItem value="conversational">{t("dashboard.create.form.toneOptions.conversational")}</SelectItem>
                                    <SelectItem value="informative">{t("dashboard.create.form.toneOptions.informative")}</SelectItem>
                                    <SelectItem value="persuasive">{t("dashboard.create.form.toneOptions.persuasive")}</SelectItem>
                                    <SelectItem value="humorous">{t("dashboard.create.form.toneOptions.humorous")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="format" className="mt-0 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-100">{t("dashboard.create.format.title")}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t("dashboard.create.format.description")}</p>
                        
                        <div className="space-y-6">
                          
                          <FormField
                            control={form.control}
                            name="useBold"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center space-x-2">
                                  <Bold className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">{t("dashboard.create.format.bold")}</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      {t("dashboard.create.format.boldDescription")}
                                    </p>
                                  </div>
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
                            name="useItalic"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center space-x-2">
                                  <Italic className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">{t("dashboard.create.format.italic")}</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      {t("dashboard.create.format.italicDescription")}
                                    </p>
                                  </div>
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
                            name="useBullets"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center space-x-2">
                                  <ListOrdered className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">{t("dashboard.create.format.bulletPoints")}</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      {t("dashboard.create.format.bulletPointsDescription")}
                                    </p>
                                  </div>
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
                            name="addHeadings"
                            render={({ field }) => (
                              <FormItem className="content-tabitem">
                                <div className="flex items-center space-x-2">
                                  <Heading2 className="h-5 w-5 text-primary" />
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">{t("dashboard.create.format.addSectionHeadings")}</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      {t("dashboard.create.format.addSectionHeadingsDescription")}
                                    </p>
                                  </div>
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
                      </TabsContent>
                      
                      <TabsContent 
                        value="links" 
                        className="mt-0 border rounded-lg p-4"
                        onSelect={initializeLinkItems}
                      >
                        <div className="flex items-center mb-2 text-gray-800 dark:text-gray-100">
                          <LinkIcon className="h-5 w-5 mr-2" />
                          <h3 className="text-lg font-medium">{t("dashboard.create.links.title")}</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t("dashboard.create.links.description")}</p>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium mb-2">
                              {t("dashboard.create.links.linkList")}
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                ({form.watch("linkItems")?.length || 0}/5)
                              </span>
                            </h4>
                            
                            <div className="space-y-4">
                              {(form.watch("linkItems") || []).map((item, index) => (
                                <div key={index} className="grid grid-cols-2 gap-4 p-3 border rounded-md relative">
                                  <div>
                                    <Label htmlFor={`keyword-${index}`} className="mb-1 block">{t("dashboard.create.links.keyword")}</Label>
                                    <Input 
                                      id={`keyword-${index}`} 
                                      placeholder={t("dashboard.create.links.keyword")}
                                      value={item.keyword || ''}
                                      onChange={(e) => {
                                        const items = [...form.watch("linkItems")];
                                        if (items[index]) {
                                          items[index].keyword = e.target.value;
                                          form.setValue("linkItems", items);
                                        }
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`link-${index}`} className="mb-1 block">{t("dashboard.create.links.link")}</Label>
                                    <Input 
                                      id={`link-${index}`} 
                                      placeholder={t("dashboard.create.links.link")}
                                      value={item.url || ''}
                                      onChange={(e) => {
                                        const items = [...form.watch("linkItems")];
                                        if (items[index]) {
                                          items[index].url = e.target.value;
                                          form.setValue("linkItems", items);
                                        }
                                      }}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-red-500"
                                    onClick={() => {
                                      const items = (form.watch("linkItems") || []).filter((_, i) => i !== index);
                                      form.setValue("linkItems", items);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              
                              <div className="flex justify-end">
                                <Button 
                                  type="button" 
                                  className="bg-purple-500 hover:bg-purple-600 text-white"
                                  disabled={(form.watch("linkItems") || []).length >= 5}
                                  onClick={() => {
                                    const currentItems = form.watch("linkItems") || [];
                                    if (currentItems.length < 5) {
                                      form.setValue("linkItems", [
                                        ...currentItems,
                                        { keyword: "", url: "" }
                                      ]);
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  {t("dashboard.create.links.addLink")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="media" className="mt-0 border rounded-lg p-4">
                        <div className="flex items-center mb-2 text-gray-800 dark:text-gray-100">
                          <Image className="h-5 w-5 mr-2" />
                          <h3 className="text-lg font-medium">{t("dashboard.create.media.title")}</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t("dashboard.create.media.description")}</p>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-md font-medium mb-4">{t("dashboard.create.media.imageSize")}</h4>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <FormField
                                control={form.control}
                                name="imageSize"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                          <label 
                                            className={`relative flex cursor-pointer rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-sm focus:outline-none ${field.value === 'small' ? 'border-2 border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                                          >
                                            <input
                                              type="radio"
                                              name="imageSize"
                                              value="small"
                                              className="sr-only"
                                              checked={field.value === 'small'}
                                              onChange={() => field.onChange('small')}
                                            />
                                            <span className="flex flex-1 items-center">
                                              <span className="flex flex-col text-sm">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{t("dashboard.create.media.imageSizes.small")}</span>
                                              </span>
                                            </span>
                                            {field.value === 'small' && (
                                              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                              </span>
                                            )}
                                          </label>
                                        </div>
                                        
                                        <div>
                                          <label 
                                            className={`relative flex cursor-pointer rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-sm focus:outline-none ${field.value === 'medium' ? 'border-2 border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                                          >
                                            <input
                                              type="radio"
                                              name="imageSize"
                                              value="medium"
                                              className="sr-only"
                                              checked={field.value === 'medium'}
                                              onChange={() => field.onChange('medium')}
                                            />
                                            <span className="flex flex-1 items-center">
                                              <span className="flex flex-col text-sm">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{t("dashboard.create.media.imageSizes.medium")}</span>
                                              </span>
                                            </span>
                                            {field.value === 'medium' && (
                                              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                              </span>
                                            )}
                                          </label>
                                        </div>
                                        
                                        <div>
                                          <label 
                                            className={`relative flex cursor-pointer rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-sm focus:outline-none ${field.value === 'large' ? 'border-2 border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                                          >
                                            <input
                                              type="radio"
                                              name="imageSize"
                                              value="large"
                                              className="sr-only"
                                              checked={field.value === 'large'}
                                              onChange={() => field.onChange('large')}
                                            />
                                            <span className="flex flex-1 items-center">
                                              <span className="flex flex-col text-sm">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{t("dashboard.create.media.imageSizes.large")}</span>
                                              </span>
                                            </span>
                                            {field.value === 'large' && (
                                              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                              </span>
                                            )}
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Image Generation Section */}
                          <div className="border-t pt-6">
                            <h4 className="text-md font-medium mb-4">{t("dashboard.create.media.autoGenerate")}</h4>
                            
                            <FormField
                              control={form.control}
                              name="generateImages"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50 dark:bg-slate-800">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">{t("dashboard.create.media.autoGenerate")}</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      {t("dashboard.create.media.autoGenerateDescription")}
                                    </p>
                                  </div>
                                </FormItem>
                              )}
                            />


                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="knowledge" className="mt-0 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-100">{t("dashboard.create.knowledge.title")}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t("dashboard.create.knowledge.description")}</p>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="useWebResearch"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50 dark:bg-slate-800">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    defaultChecked={true}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">{t("dashboard.create.knowledge.webResearch")}</FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    {t("dashboard.create.knowledge.webResearchDescription")}
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="refSources"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium">{t("dashboard.create.knowledge.refSources")}</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  {t("dashboard.create.knowledge.refSourcesDescription")}
                                </p>
                                <FormControl>
                                  <Input
                                    placeholder={t("dashboard.create.knowledge.refSourcesPlaceholder")}
                                    type="url"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="aiModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium">{t("dashboard.create.knowledge.aiModel")}</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  {t("dashboard.create.knowledge.aiModelDescription")}
                                </p>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("dashboard.create.knowledge.aiModelPlaceholder")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="chatgpt">ChatGPT</SelectItem>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      

                      
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex justify-between items-center mt-4">
                        {/* Button "Tạo bài viết mới" hiển thị khi đã có content */}
                        {generatedContent && (
                          <Button
                            type="button"
                            variant="outline"
                            className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800"
                            onClick={() => {
                              setGeneratedContent(null);
                              setEditedTitle("");
                              setEditedContent("");
                              form.reset({
                                contentType: 'blog',
                                keywords: '',
                                mainKeyword: '',
                                length: 'medium',
                                tone: 'conversational',
                                language: 'vietnamese',
                                country: 'vietnam',
                                perspective: 'auto',
                                complexity: 'auto',
                                useBold: true,
                                useItalic: true,
                                useBullets: true,
                                addHeadings: true,
                                useWebResearch: true,
                                aiModel: 'chatgpt'
                              });
                              toast({
                                title: "Đã reset form",
                                description: "Bạn có thể tạo bài viết mới.",
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo bài viết mới
                          </Button>
                        )}
                        
                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                            onClick={() => {
                              console.log("Button clicked");
                              console.log("Form values:", form.getValues());
                              console.log("Form errors:", form.formState.errors);
                              form.handleSubmit(onSubmit)();
                            }}
                            disabled={generateContentMutation.isPending}
                          >
                            {generateContentMutation.isPending ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {tDb("common.generating")}
                              </div>
                            ) : (
                              t("dashboard.create.generateContent")
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                  
                  {/* Generated Content section is now hidden - content is automatically saved and shown in edit dialog */}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Dialog for editing content */}
        <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa nội dung</DialogTitle>
              <DialogDescription>
                Sử dụng trình soạn thảo để định dạng nội dung trước khi lưu hoặc xuất bản lên website của bạn.
                Thanh công cụ phía trên cho phép bạn thêm định dạng, liên kết và hình ảnh.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Tiêu đề bài viết */}
              <div className="grid gap-2">
                <Label htmlFor="title" className="font-medium">Tiêu đề bài viết</Label>
                <Input 
                  id="title" 
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-primary"
                  placeholder="Nhập tiêu đề bài viết..."
                />
              </div>
              
              {/* Content editing with rich text editor */}
              <div className="grid gap-2">
                <Label htmlFor="content">Nội dung</Label>
                <div className="quill-editor-container">
                  <ReactQuill 
                    theme="snow"
                    value={editedContent} 
                    onChange={setEditedContent}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsContentDialogOpen(false)}
                className="sm:order-1"
              >
                Hủy
              </Button>
              

              <Button 
                onClick={handleSaveArticle}
                variant="secondary"
                className="sm:order-2"
                disabled={isSavingArticle}
              >
                {isSavingArticle 
                  ? (generatedContent?.articleId ? "Đang cập nhật..." : "Đang lưu...") 
                  : (generatedContent?.articleId ? "Cập nhật bài viết" : "Lưu bài viết")
                }
              </Button>
              
              {/* Tạm ẩn nút xuất bản theo yêu cầu */}
              {/* <Button 
                onClick={handlePublishContent}
                variant="default"
                className="sm:order-3 bg-accent-500 hover:bg-accent-600"
              >
                Xuất bản lên website
              </Button> */}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credit Confirmation Modal */}
        {pendingFormData && (
          <CreditConfirmationModal
            isOpen={showCreditModal}
            onClose={() => {
              setShowCreditModal(false);
              setPendingFormData(null);
            }}
            onConfirm={confirmAndSubmit}
            title={t('credit.modal.title.content', 'Xác nhận tạo nội dung AI', 'Confirm AI Content Creation')}
            breakdown={calculateCreditBreakdown(pendingFormData).breakdown}
            totalCredits={calculateCreditBreakdown(pendingFormData).totalCredits}
            userCurrentCredits={user?.credits || 0}
            isLoading={generateContentMutation.isPending}
          />
        )}
      </DashboardLayout>
    </>
  );
}