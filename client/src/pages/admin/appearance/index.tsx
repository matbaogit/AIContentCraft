import { useState } from "react";
import { AdminLayout } from "@/components/admin/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Layout, LogIn, FileText, History } from "lucide-react";
import SEOMetaSettings from "./components/SEOMetaSettings";
import HeaderSettings from "./components/HeaderSettings";
import LoginPageSettings from "./components/LoginPageSettings";
import FooterSettings from "./components/FooterSettings";
import ChangeHistory from "./components/ChangeHistory";

export default function AppearancePage() {
  const [activeTab, setActiveTab] = useState("seo-meta");

  const tabs = [
    {
      id: "seo-meta",
      label: "SEO & Meta Tags",
      icon: <Globe className="h-4 w-4" />,
      description: "Cấu hình SEO meta tags, title, description",
    },
    {
      id: "header",
      label: "Header & Branding", 
      icon: <Layout className="h-4 w-4" />,
      description: "Logo, tên trang, header content",
    },
    {
      id: "login-page",
      label: "Trang đăng nhập",
      icon: <LogIn className="h-4 w-4" />,
      description: "Tùy chỉnh logo, tiêu đề và nội dung trang đăng nhập",
    },
    {
      id: "footer",
      label: "Footer Content",
      icon: <FileText className="h-4 w-4" />,
      description: "Nội dung footer, copyright, links",
    },
    {
      id: "history",
      label: "Lịch sử thay đổi",
      icon: <History className="h-4 w-4" />,
      description: "Xem và khôi phục các thay đổi",
    },
  ];

  return (
    <AdminLayout title="Quản lý giao diện">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý giao diện</h1>
            <p className="text-muted-foreground">
              Tùy chỉnh giao diện và branding cho ứng dụng
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Settings className="h-3 w-3 mr-1" />
            Admin Panel
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* SEO Meta Settings */}
        <TabsContent value="seo-meta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SEO & Meta Tags
              </CardTitle>
              <CardDescription>
                Cấu hình các thẻ meta SEO, title, description và keywords cho website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SEOMetaSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Header Settings */}
        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Header & Branding
              </CardTitle>
              <CardDescription>
                Cấu hình logo, tên trang và các thành phần header
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeaderSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Page Settings */}
        <TabsContent value="login-page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Trang đăng nhập
              </CardTitle>
              <CardDescription>
                Tùy chỉnh logo, tiêu đề và nội dung text cho trang đăng nhập và đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginPageSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Footer Content
              </CardTitle>
              <CardDescription>
                Cấu hình nội dung footer, copyright và các liên kết
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FooterSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Lịch sử thay đổi
              </CardTitle>
              <CardDescription>
                Xem lịch sử các thay đổi và khôi phục về phiên bản trước
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangeHistory />
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}