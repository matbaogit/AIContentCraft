import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle, Mail, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Head from "@/components/head";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";

const deletionRequestSchema = z.object({
  email: z.string().email({ message: "Vui lòng nhập email hợp lệ" }),
  fullName: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
  reason: z.string().min(10, { message: "Lý do phải có ít nhất 10 ký tự" }),
});

type DeletionRequestValues = z.infer<typeof deletionRequestSchema>;

export default function DataDeletionPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const content = {
    vi: {
      title: "Hướng Dẫn Xóa Dữ Liệu",
      subtitle: "Cách yêu cầu xóa dữ liệu cá nhân và tài khoản của bạn",
      lastUpdated: "Cập nhật lần cuối: 25 tháng 7, 2025",
      backToDashboard: "Quay lại Dashboard",
      
      sections: {
        overview: {
          title: "Tổng Quan",
          content: "Bạn có quyền yêu cầu xóa hoàn toàn dữ liệu cá nhân và tài khoản khỏi hệ thống SEO AI Writer. Trang này hướng dẫn chi tiết về quy trình xóa dữ liệu."
        },
        rights: {
          title: "Quyền Của Bạn",
          items: [
            "Yêu cầu xóa hoàn toàn tài khoản",
            "Xóa tất cả dữ liệu cá nhân",
            "Xóa nội dung đã tạo (bài viết, hình ảnh)",
            "Xóa lịch sử sử dụng dịch vụ",
            "Hủy tất cả kết nối mạng xã hội",
            "Xóa dữ liệu thanh toán (nếu có)"
          ]
        },
        methods: {
          title: "Các Cách Xóa Dữ Liệu",
          selfService: {
            title: "1. Tự Xóa Trong Tài Khoản",
            steps: [
              "Đăng nhập vào tài khoản SEO AI Writer",
              "Vào mục 'Cài đặt tài khoản'",
              "Chọn 'Xóa tài khoản'",
              "Xác nhận bằng mật khẩu",
              "Dữ liệu sẽ được xóa trong 30 ngày"
            ]
          },
          emailRequest: {
            title: "2. Gửi Yêu Cầu Qua Email",
            content: "Gửi email đến privacy@seoaiwriter.com với thông tin:",
            requirements: [
              "Tên đầy đủ",
              "Email đăng ký tài khoản",
              "Lý do yêu cầu xóa",
              "Xác nhận danh tính (nếu cần)"
            ]
          },
          webForm: {
            title: "3. Biểu Mẫu Trực Tuyến",
            content: "Điền form bên dưới để gửi yêu cầu xóa dữ liệu"
          }
        },
        timeline: {
          title: "Thời Gian Xử Lý",
          steps: [
            {
              step: "Nhận yêu cầu",
              time: "Ngay lập tức",
              description: "Chúng tôi xác nhận đã nhận được yêu cầu của bạn"
            },
            {
              step: "Xác minh danh tính",
              time: "1-3 ngày làm việc",
              description: "Xác minh để đảm bảo an toàn tài khoản"
            },
            {
              step: "Xóa dữ liệu",
              time: "7-14 ngày làm việc",
              description: "Xóa hoàn toàn dữ liệu khỏi hệ thống"
            },
            {
              step: "Xác nhận hoàn tất",
              time: "15-30 ngày",
              description: "Thông báo quá trình xóa đã hoàn tất"
            }
          ]
        },
        dataDeleted: {
          title: "Dữ Liệu Sẽ Được Xóa",
          categories: [
            {
              category: "Thông tin tài khoản",
              items: ["Tên đăng nhập", "Email", "Họ tên", "Thông tin liên hệ"]
            },
            {
              category: "Nội dung đã tạo",
              items: ["Bài viết", "Hình ảnh", "Nội dung social media", "Template"]
            },
            {
              category: "Dữ liệu sử dụng",
              items: ["Lịch sử tạo nội dung", "Thống kê sử dụng", "Log hoạt động"]
            },
            {
              category: "Kết nối bên ngoài",
              items: ["Liên kết Facebook", "Liên kết WordPress", "API keys", "OAuth tokens"]
            }
          ]
        },
        important: {
          title: "Lưu Ý Quan Trọng",
          warnings: [
            "Quá trình xóa dữ liệu là KHÔNG THỂ HOÀN TÁC",
            "Tất cả nội dung và tài liệu sẽ bị mất vĩnh viễn",
            "Gói dịch vụ đã thanh toán sẽ không được hoàn tiền",
            "Dữ liệu backup có thể được lưu tối đa 90 ngày để tuân thủ pháp luật",
            "Một số thông tin có thể được giữ lại cho mục đích pháp lý hoặc kế toán"
          ]
        },
        beforeDelete: {
          title: "Trước Khi Xóa",
          recommendations: [
            "Tải xuống tất cả nội dung quan trọng",
            "Hủy liên kết các tài khoản mạng xã hội",
            "Sao lưu dữ liệu cần thiết",
            "Cân nhắc kỹ quyết định",
            "Liên hệ hỗ trợ nếu có thắc mắc"
          ]
        },
        form: {
          title: "Biểu Mẫu Yêu Cầu Xóa Dữ Liệu",
          email: "Email tài khoản",
          emailPlaceholder: "your-email@example.com",
          fullName: "Họ và tên",
          fullNamePlaceholder: "Nguyễn Văn A",
          reason: "Lý do yêu cầu xóa",
          reasonPlaceholder: "Vui lòng mô tả lý do bạn muốn xóa tài khoản...",
          submit: "Gửi Yêu Cầu",
          submitting: "Đang gửi...",
          success: "Đã gửi yêu cầu thành công",
          successMessage: "Chúng tôi đã nhận được yêu cầu xóa dữ liệu của bạn. Bạn sẽ nhận được email xác nhận trong vòng 24 giờ."
        }
      }
    },
    en: {
      title: "Data Deletion Instructions",
      subtitle: "How to request deletion of your personal data and account",
      lastUpdated: "Last updated: July 25, 2025",
      backToDashboard: "Back to Dashboard",
      
      sections: {
        overview: {
          title: "Overview",
          content: "You have the right to request complete deletion of your personal data and account from the SEO AI Writer system. This page provides detailed instructions on the data deletion process."
        },
        rights: {
          title: "Your Rights",
          items: [
            "Request complete account deletion",
            "Delete all personal data",
            "Delete created content (articles, images)",
            "Delete service usage history",
            "Cancel all social media connections",
            "Delete payment data (if any)"
          ]
        },
        methods: {
          title: "Data Deletion Methods",
          selfService: {
            title: "1. Self-Delete in Account",
            steps: [
              "Log in to your SEO AI Writer account",
              "Go to 'Account Settings'",
              "Select 'Delete Account'",
              "Confirm with password",
              "Data will be deleted within 30 days"
            ]
          },
          emailRequest: {
            title: "2. Email Request",
            content: "Send email to privacy@seoaiwriter.com with information:",
            requirements: [
              "Full name",
              "Registered email address",
              "Reason for deletion request",
              "Identity verification (if needed)"
            ]
          },
          webForm: {
            title: "3. Online Form",
            content: "Fill out the form below to submit a data deletion request"
          }
        },
        timeline: {
          title: "Processing Timeline",
          steps: [
            {
              step: "Request received",
              time: "Immediately",
              description: "We confirm receipt of your request"
            },
            {
              step: "Identity verification",
              time: "1-3 business days",
              description: "Verification to ensure account security"
            },
            {
              step: "Data deletion",
              time: "7-14 business days",
              description: "Complete removal of data from systems"
            },
            {
              step: "Completion confirmation",
              time: "15-30 days",
              description: "Notification that deletion is complete"
            }
          ]
        },
        dataDeleted: {
          title: "Data to be Deleted",
          categories: [
            {
              category: "Account information",
              items: ["Username", "Email", "Full name", "Contact information"]
            },
            {
              category: "Created content",
              items: ["Articles", "Images", "Social media content", "Templates"]
            },
            {
              category: "Usage data",
              items: ["Content creation history", "Usage statistics", "Activity logs"]
            },
            {
              category: "External connections",
              items: ["Facebook links", "WordPress links", "API keys", "OAuth tokens"]
            }
          ]
        },
        important: {
          title: "Important Notes",
          warnings: [
            "Data deletion process is IRREVERSIBLE",
            "All content and documents will be permanently lost",
            "Paid service packages will not be refunded",
            "Backup data may be retained for up to 90 days for legal compliance",
            "Some information may be retained for legal or accounting purposes"
          ]
        },
        beforeDelete: {
          title: "Before Deleting",
          recommendations: [
            "Download all important content",
            "Unlink social media accounts",
            "Backup necessary data",
            "Consider your decision carefully",
            "Contact support if you have questions"
          ]
        },
        form: {
          title: "Data Deletion Request Form",
          email: "Account email",
          emailPlaceholder: "your-email@example.com",
          fullName: "Full name",
          fullNamePlaceholder: "John Doe",
          reason: "Reason for deletion request",
          reasonPlaceholder: "Please describe why you want to delete your account...",
          submit: "Submit Request",
          submitting: "Submitting...",
          success: "Request submitted successfully",
          successMessage: "We have received your data deletion request. You will receive a confirmation email within 24 hours."
        }
      }
    }
  };

  const t = content[language] || content.vi;

  const form = useForm<DeletionRequestValues>({
    resolver: zodResolver(deletionRequestSchema),
    defaultValues: {
      email: "",
      fullName: "",
      reason: "",
    },
  });

  const onSubmit = async (values: DeletionRequestValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/data-deletion-request", values);
      const data = await response.json();
      
      if (data.success) {
        setIsSubmitted(true);
        toast({
          title: t.sections.form.success,
          description: t.sections.form.successMessage,
        });
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi gửi yêu cầu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Data deletion request error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Head>
          <title>{t.title} - SEO AI Writer</title>
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                {t.sections.form.success}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {t.sections.form.successMessage}
              </p>
              <Link href="/dashboard">
                <Button className="w-full">
                  {t.backToDashboard}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t.title} - SEO AI Writer</title>
        <meta name="description" content={t.subtitle} />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToDashboard}
              </Button>
            </Link>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t.title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                {t.subtitle}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.lastUpdated}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  {t.sections.overview.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  {t.sections.overview.content}
                </p>
              </CardContent>
            </Card>

            {/* Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  {t.sections.rights.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.rights.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  {t.sections.methods.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Self Service */}
                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-3">
                    {t.sections.methods.selfService.title}
                  </h4>
                  <ol className="space-y-2">
                    {t.sections.methods.selfService.steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Email Request */}
                <div>
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    {t.sections.methods.emailRequest.title}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {t.sections.methods.emailRequest.content}
                  </p>
                  <ul className="space-y-2">
                    {t.sections.methods.emailRequest.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Web Form */}
                <div>
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-3">
                    {t.sections.methods.webForm.title}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t.sections.methods.webForm.content}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                  {t.sections.timeline.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {t.sections.timeline.steps.map((step, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex flex-col items-center mr-4">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-semibold">
                          {index + 1}
                        </div>
                        {index < t.sections.timeline.steps.length - 1 && (
                          <div className="w-px h-12 bg-gray-300 dark:bg-gray-600 mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {step.step}
                        </h5>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">
                          {step.time}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="w-5 h-5 mr-2 text-red-600" />
                  {t.sections.dataDeleted.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {t.sections.dataDeleted.categories.map((category, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {category.category}
                      </h5>
                      <ul className="space-y-1">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Important Warnings */}
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  {t.sections.important.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.important.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-orange-800 dark:text-orange-200 font-medium">{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Before Delete */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  {t.sections.beforeDelete.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.beforeDelete.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Deletion Request Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  {t.sections.form.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.sections.form.email}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t.sections.form.emailPlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.sections.form.fullName}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.sections.form.fullNamePlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.sections.form.reason}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t.sections.form.reasonPlaceholder}
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? t.sections.form.submitting : t.sections.form.submit}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}