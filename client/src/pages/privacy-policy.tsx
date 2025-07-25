import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Database, UserCheck, Settings, Trash2, Mail } from "lucide-react";
import Head from "@/components/head";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();

  const content = {
    vi: {
      title: "Chính Sách Bảo Mật",
      subtitle: "Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn",
      lastUpdated: "Cập nhật lần cuối: 25 tháng 7, 2025",
      backToDashboard: "Quay lại Dashboard",
      sections: {
        overview: {
          title: "Tổng Quan",
          content: "SEO AI Writer cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu của bạn khi sử dụng dịch vụ của chúng tôi."
        },
        dataCollection: {
          title: "Thông Tin Chúng Tôi Thu Thập",
          items: [
            "Thông tin tài khoản: tên đăng nhập, email, họ tên",
            "Nội dung bạn tạo: bài viết, hình ảnh, nội dung social media",
            "Dữ liệu sử dụng: lịch sử tạo nội dung, tín dụng đã sử dụng",
            "Thông tin kỹ thuật: địa chỉ IP, trình duyệt, thiết bị",
            "Cookies và dữ liệu phiên làm việc"
          ]
        },
        dataUsage: {
          title: "Cách Chúng Tôi Sử Dụng Thông Tin",
          items: [
            "Cung cấp và cải thiện dịch vụ AI tạo nội dung",
            "Quản lý tài khoản và xác thực người dùng",
            "Gửi thông báo quan trọng về dịch vụ",
            "Phân tích và tối ưu hóa hiệu suất hệ thống",
            "Hỗ trợ khách hàng và giải quyết vấn đề",
            "Tuân thủ nghĩa vụ pháp lý"
          ]
        },
        dataSharing: {
          title: "Chia Sẻ Thông Tin",
          content: "Chúng tôi KHÔNG bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba cho mục đích thương mại. Thông tin chỉ được chia sẻ trong các trường hợp:",
          items: [
            "Khi bạn đồng ý rõ ràng",
            "Để tuân thủ yêu cầu pháp lý",
            "Bảo vệ quyền lợi và an toàn của chúng tôi và người dùng",
            "Với các nhà cung cấp dịch vụ đáng tin cậy (theo thỏa thuận bảo mật)"
          ]
        },
        dataSecurity: {
          title: "Bảo Mật Dữ Liệu",
          items: [
            "Mã hóa dữ liệu trong quá trình truyền tải (SSL/TLS)",
            "Mã hóa mật khẩu bằng thuật toán an toàn",
            "Kiểm soát truy cập nghiêm ngặt",
            "Sao lưu dữ liệu định kỳ",
            "Giám sát bảo mật 24/7",
            "Cập nhật bảo mật thường xuyên"
          ]
        },
        userRights: {
          title: "Quyền Của Bạn",
          items: [
            "Truy cập và xem thông tin cá nhân",
            "Cập nhật hoặc chỉnh sửa thông tin",
            "Yêu cầu xóa tài khoản và dữ liệu",
            "Xuất dữ liệu cá nhân",
            "Rút lại sự đồng ý",
            "Khiếu nại về việc xử lý dữ liệu"
          ]
        },
        dataRetention: {
          title: "Lưu Trữ Dữ Liệu",
          content: "Chúng tôi chỉ lưu trữ dữ liệu của bạn trong thời gian cần thiết để cung cấp dịch vụ hoặc tuân thủ pháp luật. Khi bạn xóa tài khoản, dữ liệu sẽ được xóa vĩnh viễn trong vòng 30 ngày."
        },
        cookies: {
          title: "Cookies và Theo Dõi",
          content: "Chúng tôi sử dụng cookies cần thiết để:",
          items: [
            "Duy trì phiên đăng nhập",
            "Lưu tùy chọn ngôn ngữ và giao diện",
            "Phân tích hiệu suất trang web",
            "Cải thiện trải nghiệm người dùng"
          ]
        },
        thirdParty: {
          title: "Dịch Vụ Bên Thứ Ba",
          content: "Chúng tôi tích hợp với các dịch vụ:",
          items: [
            "OpenAI GPT cho tạo nội dung",
            "Gemini AI cho xử lý ngôn ngữ",
            "SMTP providers cho gửi email",
            "Cloud storage cho lưu trữ hình ảnh"
          ]
        },
        contact: {
          title: "Liên Hệ",
          content: "Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ:",
          email: "privacy@seoaiwriter.com",
          address: "Việt Nam"
        }
      }
    },
    en: {
      title: "Privacy Policy",
      subtitle: "How we collect, use, and protect your information",
      lastUpdated: "Last updated: July 25, 2025",
      backToDashboard: "Back to Dashboard",
      sections: {
        overview: {
          title: "Overview",
          content: "SEO AI Writer is committed to protecting your privacy and personal information. This policy explains how we collect, use, store, and protect your data when using our services."
        },
        dataCollection: {
          title: "Information We Collect",
          items: [
            "Account information: username, email, full name",
            "Content you create: articles, images, social media content",
            "Usage data: content creation history, credits used",
            "Technical information: IP address, browser, device",
            "Cookies and session data"
          ]
        },
        dataUsage: {
          title: "How We Use Your Information",
          items: [
            "Provide and improve AI content generation services",
            "Manage accounts and authenticate users",
            "Send important service notifications",
            "Analyze and optimize system performance",
            "Provide customer support and resolve issues",
            "Comply with legal obligations"
          ]
        },
        dataSharing: {
          title: "Information Sharing",
          content: "We DO NOT sell, rent, or share your personal information with third parties for commercial purposes. Information is only shared when:",
          items: [
            "You provide explicit consent",
            "Required by law",
            "To protect our rights and safety and that of users",
            "With trusted service providers (under confidentiality agreements)"
          ]
        },
        dataSecurity: {
          title: "Data Security",
          items: [
            "Data encryption in transit (SSL/TLS)",
            "Password encryption with secure algorithms",
            "Strict access controls",
            "Regular data backups",
            "24/7 security monitoring",
            "Regular security updates"
          ]
        },
        userRights: {
          title: "Your Rights",
          items: [
            "Access and view personal information",
            "Update or edit information",
            "Request account and data deletion",
            "Export personal data",
            "Withdraw consent",
            "File complaints about data processing"
          ]
        },
        dataRetention: {
          title: "Data Retention",
          content: "We only retain your data for as long as necessary to provide services or comply with the law. When you delete your account, data will be permanently deleted within 30 days."
        },
        cookies: {
          title: "Cookies and Tracking",
          content: "We use necessary cookies to:",
          items: [
            "Maintain login sessions",
            "Save language and interface preferences",
            "Analyze website performance",
            "Improve user experience"
          ]
        },
        thirdParty: {
          title: "Third-Party Services",
          content: "We integrate with services:",
          items: [
            "OpenAI GPT for content generation",
            "Gemini AI for language processing",
            "SMTP providers for sending emails",
            "Cloud storage for image storage"
          ]
        },
        contact: {
          title: "Contact",
          content: "If you have questions about this privacy policy, please contact:",
          email: "privacy@seoaiwriter.com",
          address: "Vietnam"
        }
      }
    }
  };

  const t = content[language] || content.vi;

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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
                  <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                  {t.sections.overview.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  {t.sections.overview.content}
                </p>
              </CardContent>
            </Card>

            {/* Data Collection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-green-600" />
                  {t.sections.dataCollection.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.dataCollection.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-purple-600" />
                  {t.sections.dataUsage.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.dataUsage.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-600" />
                  {t.sections.dataSharing.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.dataSharing.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.dataSharing.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  {t.sections.dataSecurity.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.dataSecurity.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                  {t.sections.userRights.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.userRights.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-indigo-600" />
                  {t.sections.dataRetention.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  {t.sections.dataRetention.content}
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-teal-600" />
                  {t.sections.cookies.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.cookies.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.cookies.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Third Party */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-pink-600" />
                  {t.sections.thirdParty.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.thirdParty.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.thirdParty.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-gray-600" />
                  {t.sections.contact.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.contact.content}
                </p>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Email:</strong> {t.sections.contact.email}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Địa chỉ:</strong> {t.sections.contact.address}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}