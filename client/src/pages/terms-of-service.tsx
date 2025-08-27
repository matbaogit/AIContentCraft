import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, Users, CreditCard, Gavel, AlertTriangle, Mail } from "lucide-react";
import Head from "@/components/head";

export default function TermsOfServicePage() {
  const { language } = useLanguage();

  const content = {
    vi: {
      title: "Điều Khoản Dịch Vụ",
      subtitle: "Các điều khoản và điều kiện sử dụng SEO AI Writer",
      lastUpdated: "Cập nhật lần cuối: 25 tháng 7, 2025",
      backToDashboard: "Quay lại Dashboard",
      
      sections: {
        acceptance: {
          title: "Chấp Nhận Điều Khoản",
          content: "Bằng việc truy cập và sử dụng SEO AI Writer, bạn đồng ý tuân thủ các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi."
        },
        services: {
          title: "Mô Tả Dịch Vụ",
          content: "SEO AI Writer cung cấp các dịch vụ sau:",
          items: [
            "Tạo nội dung bằng trí tuệ nhân tạo",
            "Tối ưu hóa SEO cho nội dung",
            "Tạo hình ảnh tự động",
            "Quản lý và lên lịch đăng nội dung",
            "Tích hợp với các nền tảng mạng xã hội",
            "Phân tích và báo cáo hiệu suất"
          ]
        },
        userAccounts: {
          title: "Tài Khoản Người Dùng",
          responsibilities: [
            "Cung cấp thông tin chính xác khi đăng ký",
            "Bảo mật thông tin đăng nhập",
            "Chịu trách nhiệm về mọi hoạt động trong tài khoản",
            "Thông báo ngay khi phát hiện sử dụng trái phép",
            "Không chia sẻ tài khoản cho người khác",
            "Tuân thủ các quy định sử dụng"
          ]
        },
        acceptableUse: {
          title: "Chính Sách Sử Dụng Hợp Lý",
          content: "Khi sử dụng dịch vụ, bạn KHÔNG được:",
          prohibited: [
            "Tạo nội dung bất hợp pháp, có hại hoặc xúc phạm",
            "Vi phạm bản quyền hoặc quyền sở hữu trí tuệ",
            "Spam hoặc gửi thông tin quảng cáo không mong muốn",
            "Hack, phá hoại hoặc can thiệp vào hệ thống",
            "Sử dụng dịch vụ cho mục đích thương mại không được phép",
            "Tạo nhiều tài khoản để lừa đảo hệ thống"
          ]
        },
        payment: {
          title: "Thanh Toán và Hoàn Tiền",
          content: "Thông tin về thanh toán:",
          policies: [
            "Thanh toán được xử lý an toàn qua các cổng thanh toán đáng tin cậy",
            "Gói dịch vụ có hiệu lực ngay sau khi thanh toán thành công",
            "Hoàn tiền trong vòng 7 ngày cho gói dịch vụ chưa sử dụng",
            "Tín dụng không sử dụng hết sẽ được chuyển sang tháng tiếp theo",
            "Không hoàn tiền cho tín dụng đã sử dụng",
            "Giá có thể thay đổi với thông báo trước 30 ngày"
          ]
        },
        intellectualProperty: {
          title: "Quyền Sở Hữu Trí Tuệ",
          content: "Về quyền sở hữu nội dung:",
          userContent: {
            title: "Nội dung của bạn",
            items: [
              "Bạn giữ quyền sở hữu nội dung do mình tạo ra",
              "Bạn cấp cho chúng tôi quyền lưu trữ và xử lý nội dung",
              "Bạn chịu trách nhiệm về tính hợp pháp của nội dung",
              "Chúng tôi có thể xóa nội dung vi phạm quy định"
            ]
          },
          ourContent: {
            title: "Nội dung của chúng tôi",
            items: [
              "Mã nguồn, thiết kế và giao diện thuộc quyền sở hữu của chúng tôi",
              "Không được sao chép hoặc phân phối lại mà không có phép",
              "Công nghệ AI và thuật toán được bảo vệ bản quyền",
              "Logo và thương hiệu SEO AI Writer được bảo vệ"
            ]
          }
        },
        privacy: {
          title: "Quyền Riêng Tư",
          content: "Chúng tôi cam kết bảo vệ quyền riêng tư của bạn:",
          items: [
            "Thu thập dữ liệu tối thiểu cần thiết cho dịch vụ",
            "Không bán hoặc chia sẻ thông tin cá nhân",
            "Sử dụng mã hóa để bảo vệ dữ liệu",
            "Tuân thủ các quy định bảo vệ dữ liệu",
            "Cung cấp quyền kiểm soát dữ liệu cho người dùng"
          ]
        },
        liability: {
          title: "Giới Hạn Trách Nhiệm",
          content: "Các giới hạn trách nhiệm của chúng tôi:",
          limitations: [
            "Dịch vụ được cung cấp 'như hiện tại' không có bảo đảm",
            "Không đảm bảo dịch vụ hoạt động liên tục không bị gián đoạn",
            "Không chịu trách nhiệm về thiệt hại gián tiếp",
            "Trách nhiệm tối đa bằng số tiền bạn đã thanh toán",
            "Không chịu trách nhiệm về nội dung do AI tạo ra",
            "Bạn tự chịu trách nhiệm về việc sử dụng nội dung được tạo"
          ]
        },
        termination: {
          title: "Chấm Dứt Dịch Vụ",
          content: "Về việc chấm dứt tài khoản:",
          conditions: [
            "Bạn có thể hủy tài khoản bất cứ lúc nào",
            "Chúng tôi có thể tạm ngưng tài khoản vi phạm điều khoản",
            "Thông báo trước khi chấm dứt dịch vụ (trừ trường hợp vi phạm nghiêm trọng)",
            "Dữ liệu sẽ được xóa sau 30 ngày kể từ khi chấm dứt",
            "Không hoàn tiền cho thời gian dịch vụ còn lại khi vi phạm",
            "Các nghĩa vụ thanh toán vẫn có hiệu lực sau khi chấm dứt"
          ]
        },
        changes: {
          title: "Thay Đổi Điều Khoản",
          content: "Về việc cập nhật điều khoản:",
          items: [
            "Chúng tôi có thể thay đổi điều khoản này theo thời gian",
            "Thông báo về thay đổi quan trọng qua email",
            "Thay đổi có hiệu lực sau 30 ngày thông báo",
            "Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận thay đổi",
            "Nếu không đồng ý, bạn có thể chấm dứt sử dụng dịch vụ"
          ]
        },
        contact: {
          title: "Liên Hệ",
          content: "Nếu bạn có câu hỏi về điều khoản này:",
          info: {
            email: "legal@seoaiwriter.com",
            support: "support@toolbox.vn",
            address: "Việt Nam"
          }
        }
      }
    },
    en: {
      title: "Terms of Service",
      subtitle: "Terms and conditions for using SEO AI Writer",
      lastUpdated: "Last updated: July 25, 2025",
      backToDashboard: "Back to Dashboard",
      
      sections: {
        acceptance: {
          title: "Acceptance of Terms",
          content: "By accessing and using SEO AI Writer, you agree to comply with these terms and conditions. If you do not agree with any part of these terms, please do not use our service."
        },
        services: {
          title: "Service Description",
          content: "SEO AI Writer provides the following services:",
          items: [
            "AI-powered content generation",
            "SEO optimization for content",
            "Automated image generation",
            "Content management and scheduling",
            "Social media platform integration",
            "Performance analytics and reporting"
          ]
        },
        userAccounts: {
          title: "User Accounts",
          responsibilities: [
            "Provide accurate information during registration",
            "Secure your login credentials",
            "Take responsibility for all account activities",
            "Report unauthorized use immediately",
            "Do not share accounts with others",
            "Comply with usage policies"
          ]
        },
        acceptableUse: {
          title: "Acceptable Use Policy",
          content: "When using our service, you MUST NOT:",
          prohibited: [
            "Create illegal, harmful, or offensive content",
            "Violate copyright or intellectual property rights",
            "Send spam or unwanted promotional content",
            "Hack, sabotage, or interfere with systems",
            "Use service for unauthorized commercial purposes",
            "Create multiple accounts to defraud the system"
          ]
        },
        payment: {
          title: "Payment and Refunds",
          content: "Payment information:",
          policies: [
            "Payments processed securely through trusted payment gateways",
            "Service packages effective immediately after successful payment",
            "Refunds within 7 days for unused service packages",
            "Unused credits roll over to the next month",
            "No refunds for used credits",
            "Prices may change with 30 days advance notice"
          ]
        },
        intellectualProperty: {
          title: "Intellectual Property Rights",
          content: "Regarding content ownership:",
          userContent: {
            title: "Your content",
            items: [
              "You retain ownership of content you create",
              "You grant us rights to store and process content",
              "You are responsible for content legality",
              "We may remove content that violates policies"
            ]
          },
          ourContent: {
            title: "Our content",
            items: [
              "Source code, design, and interface are our property",
              "No copying or redistribution without permission",
              "AI technology and algorithms are copyrighted",
              "SEO AI Writer logo and brand are protected"
            ]
          }
        },
        privacy: {
          title: "Privacy",
          content: "We are committed to protecting your privacy:",
          items: [
            "Collect minimal data necessary for service",
            "Do not sell or share personal information",
            "Use encryption to protect data",
            "Comply with data protection regulations",
            "Provide data control rights to users"
          ]
        },
        liability: {
          title: "Limitation of Liability",
          content: "Our liability limitations:",
          limitations: [
            "Service provided 'as is' without warranties",
            "No guarantee of continuous, uninterrupted service",
            "Not liable for indirect damages",
            "Maximum liability equals amount you paid",
            "Not responsible for AI-generated content",
            "You are responsible for using generated content"
          ]
        },
        termination: {
          title: "Service Termination",
          content: "Regarding account termination:",
          conditions: [
            "You may cancel your account at any time",
            "We may suspend accounts that violate terms",
            "Notice before service termination (except serious violations)",
            "Data deleted 30 days after termination",
            "No refunds for remaining service time when violated",
            "Payment obligations remain after termination"
          ]
        },
        changes: {
          title: "Terms Changes",
          content: "Regarding terms updates:",
          items: [
            "We may change these terms over time",
            "Notice of important changes via email",
            "Changes effective 30 days after notice",
            "Continued use implies acceptance of changes",
            "You may terminate service if you disagree"
          ]
        },
        contact: {
          title: "Contact",
          content: "If you have questions about these terms:",
          info: {
            email: "legal@seoaiwriter.com",
            support: "support@toolbox.vn",
            address: "Vietnam"
          }
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
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
            {/* Acceptance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gavel className="w-5 h-5 mr-2 text-blue-600" />
                  {t.sections.acceptance.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  {t.sections.acceptance.content}
                </p>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  {t.sections.services.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.services.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.services.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  {t.sections.userAccounts.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.sections.userAccounts.responsibilities.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Acceptable Use */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  {t.sections.acceptableUse.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4 font-semibold">
                  {t.sections.acceptableUse.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.acceptableUse.prohibited.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                  {t.sections.payment.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.payment.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.payment.policies.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                  {t.sections.intellectualProperty.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300">
                  {t.sections.intellectualProperty.content}
                </p>
                
                <div>
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                    {t.sections.intellectualProperty.userContent.title}
                  </h4>
                  <ul className="space-y-2">
                    {t.sections.intellectualProperty.userContent.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    {t.sections.intellectualProperty.ourContent.title}
                  </h4>
                  <ul className="space-y-2">
                    {t.sections.intellectualProperty.ourContent.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-teal-600" />
                  {t.sections.privacy.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.privacy.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.privacy.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Liability */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  {t.sections.liability.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.liability.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.liability.limitations.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gavel className="w-5 h-5 mr-2 text-red-600" />
                  {t.sections.termination.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.termination.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.termination.conditions.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  {t.sections.changes.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t.sections.changes.content}
                </p>
                <ul className="space-y-2">
                  {t.sections.changes.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
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
                    <strong>Email pháp lý:</strong> {t.sections.contact.info.email}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Hỗ trợ:</strong> {t.sections.contact.info.support}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Địa chỉ:</strong> {t.sections.contact.info.address}
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