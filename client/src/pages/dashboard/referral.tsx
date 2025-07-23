import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Share2, 
  Users, 
  Gift, 
  TrendingUp,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/Layout';

interface ReferralInfo {
  code: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  referralLink: string;
  settings: {
    referrerReward: number;
    referredReward: number;
    enabled: boolean;
  };
}

interface ReferralTransaction {
  id: number;
  referrerId: number;
  referredUserId: number;
  referralCode: string;
  referrerCredits: number;
  referredCredits: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
  referrer: {
    id: number;
    username: string;
  };
  referredUser: {
    id: number;
    username: string;
  };
}

export default function ReferralPage() {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch referral information
  const { data: referralData, isLoading: isLoadingReferral } = useQuery<{ success: boolean; data: ReferralInfo }>({
    queryKey: ['/api/dashboard/referral'],
  });

  // Fetch referral transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery<{
    success: boolean;
    data: ReferralTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ['/api/dashboard/referral/transactions'],
  });

  const referralInfo = referralData?.data;
  const transactions = transactionsData?.data || [];

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      toast({
        title: 'Đã sao chép!',
        description: type === 'link' ? 'Link giới thiệu đã được sao chép' : 'Mã giới thiệu đã được sao chép',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể sao chép, vui lòng thử lại',
        variant: 'destructive',
      });
    }
  };

  const shareReferralLink = async () => {
    if (!referralInfo?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tham gia SEO AI Writer',
          text: `Tham gia SEO AI Writer và nhận ${referralInfo.settings.referredReward} tín dụng miễn phí!`,
          url: referralInfo.referralLink,
        });
      } catch (error) {
        // Fallback to copy
        copyToClipboard(referralInfo.referralLink, 'link');
      }
    } else {
      copyToClipboard(referralInfo.referralLink, 'link');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  };

  if (isLoadingReferral) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!referralInfo?.settings.enabled) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Hệ thống giới thiệu</CardTitle>
              <CardDescription>
                Hệ thống giới thiệu hiện tại đang được tạm dừng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vui lòng liên hệ admin để biết thêm thông tin chi tiết.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hệ thống giới thiệu
          </h1>
          <p className="text-muted-foreground mt-2">
            Giới thiệu bạn bè và nhận tín dụng miễn phí
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số người giới thiệu</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralInfo?.totalReferrals || 0}</div>
              <p className="text-xs text-muted-foreground">
                Số người đã đăng ký qua link của bạn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tín dụng đã kiếm</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralInfo?.totalCreditsEarned || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tổng tín dụng nhận được từ giới thiệu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phần thưởng mỗi lần giới thiệu</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{referralInfo?.settings.referrerReward || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tín dụng cho mỗi người đăng ký thành công
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="share" className="space-y-6">
          <TabsList>
            <TabsTrigger value="share">Chia sẻ & Giới thiệu</TabsTrigger>
            <TabsTrigger value="history">Lịch sử giao dịch</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-6">
            {/* Referral Link Section */}
            <Card>
              <CardHeader>
                <CardTitle>Link giới thiệu của bạn</CardTitle>
                <CardDescription>
                  Chia sẻ link này với bạn bè để nhận {referralInfo?.settings.referrerReward} tín dụng
                  khi họ đăng ký thành công. Người được giới thiệu cũng sẽ nhận {referralInfo?.settings.referredReward} tín dụng.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input 
                    value={referralInfo?.referralLink || ''} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={() => copyToClipboard(referralInfo?.referralLink || '', 'link')}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={shareReferralLink}
                    variant="outline"
                    size="icon"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {copiedLink && (
                  <p className="text-sm text-green-600">✓ Link đã được sao chép!</p>
                )}
              </CardContent>
            </Card>

            {/* Referral Code Section */}
            <Card>
              <CardHeader>
                <CardTitle>Mã giới thiệu</CardTitle>
                <CardDescription>
                  Người dùng có thể nhập mã này khi đăng ký
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input 
                    value={referralInfo?.code || ''} 
                    readOnly 
                    className="font-mono text-lg font-bold text-center"
                  />
                  <Button 
                    onClick={() => copyToClipboard(referralInfo?.code || '', 'code')}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                {copiedCode && (
                  <p className="text-sm text-green-600 mt-2">✓ Mã đã được sao chép!</p>
                )}
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>Cách thức hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Chia sẻ link giới thiệu</h4>
                      <p className="text-sm text-muted-foreground">
                        Gửi link hoặc mã giới thiệu cho bạn bè, đồng nghiệp
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Họ đăng ký tài khoản</h4>
                      <p className="text-sm text-muted-foreground">
                        Người được giới thiệu đăng ký và xác thực email thành công
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Nhận phần thưởng</h4>
                      <p className="text-sm text-muted-foreground">
                        Bạn nhận {referralInfo?.settings.referrerReward} tín dụng, họ nhận {referralInfo?.settings.referredReward} tín dụng
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử giao dịch giới thiệu</CardTitle>
                <CardDescription>
                  Theo dõi tất cả các giao dịch giới thiệu của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">Chưa có giao dịch nào</h3>
                    <p className="text-muted-foreground">
                      Bắt đầu chia sẻ link giới thiệu để thấy lịch sử giao dịch tại đây
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <p className="font-medium">
                              {transaction.referredUser.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Mã: {transaction.referralCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {getStatusText(transaction.status)}
                          </Badge>
                          {transaction.status === 'completed' && (
                            <p className="text-sm font-medium text-green-600 mt-1">
                              +{transaction.referrerCredits} tín dụng
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}