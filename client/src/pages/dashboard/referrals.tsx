import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Copy, Users, Gift, Share2, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/Layout";

export default function ReferralsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate referral link
  const referralLink = user?.referralCode ? 
    `https://toolbox.vn/register?ref=${user.referralCode}` : '';

  // Fetch referral stats
  const { data: referralStats } = useQuery({
    queryKey: ['/api/dashboard/referral-stats'],
    enabled: !!user,
  });

  const stats = referralStats?.data || {
    totalReferrals: 0,
    totalCreditsEarned: 0,
    monthlyEarnings: 0,
    recentReferrals: []
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Đã sao chép!",
        description: "Link giới thiệu đã được sao chép vào clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép link. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const shareViaZalo = () => {
    const message = encodeURIComponent(
      `🎉 Mời bạn tham gia ToolBox - Nền tảng AI tạo nội dung SEO miễn phí!\n\n` +
      `Đăng ký ngay để nhận:\n` +
      `✅ 50 credits miễn phí\n` +
      `✅ Tạo nội dung SEO chất lượng cao\n` +
      `✅ Tích hợp đa nền tảng\n\n` +
      `Link đăng ký: ${referralLink}`
    );
    window.open(`https://zalo.me/pc?message=${message}`, '_blank');
  };

  const shareViaFacebook = () => {
    const shareUrl = encodeURIComponent(referralLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Giới thiệu bạn bè</h1>
          <p className="text-muted-foreground mt-2">
            Chia sẻ ToolBox với bạn bè và nhận thưởng khi họ đăng ký thành công.
          </p>
        </div>

        {/* Referral Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số lượt giới thiệu</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                Số người đã đăng ký qua link của bạn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits nhận được</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreditsEarned}</div>
              <p className="text-xs text-muted-foreground">
                Từ chương trình giới thiệu bạn bè
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoa hồng tháng này</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyEarnings}</div>
              <p className="text-xs text-muted-foreground">
                Credits kiếm được trong tháng
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle>Link giới thiệu của bạn</CardTitle>
            <CardDescription>
              Chia sẻ link này với bạn bè để họ đăng ký ToolBox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={referralLink}
                readOnly
                className="flex-1"
              />
              <Button 
                onClick={copyReferralLink}
                variant={copied ? "default" : "outline"}
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={shareViaZalo} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ qua Zalo
              </Button>
              <Button onClick={shareViaFacebook} variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ qua Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>Cách thức hoạt động</CardTitle>
            <CardDescription>
              Quy trình đơn giản để kiếm credits từ giới thiệu bạn bè
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Chia sẻ link giới thiệu</h4>
                  <p className="text-sm text-muted-foreground">
                    Gửi link giới thiệu của bạn cho bạn bè qua Zalo, Facebook hoặc email
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Bạn bè đăng ký thành công</h4>
                  <p className="text-sm text-muted-foreground">
                    Khi bạn bè click link và đăng ký tài khoản (qua form hoặc Zalo)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Nhận thưởng ngay lập tức</h4>
                  <p className="text-sm text-muted-foreground">
                    Bạn nhận 10 credits, bạn bè cũng nhận 10 credits chào mừng
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Alert>
          <AlertDescription>
            <strong>Lưu ý:</strong> Chỉ những người đăng ký mới qua link giới thiệu của bạn mới được tính. 
            Không được tự tạo tài khoản ảo hoặc lạm dụng hệ thống. 
            Vi phạm sẽ bị khóa tài khoản và thu hồi credits.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}