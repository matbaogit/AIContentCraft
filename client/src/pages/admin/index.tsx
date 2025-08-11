import { AdminLayout } from "@/components/admin/Layout";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { User, BookText, CreditCard, DollarSign } from "lucide-react";
import Head from "@/components/head";

interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  totalCredits: number;
  totalRevenue: number;
}

interface RecentUser {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  credits: number;
  createdAt: string;
}

interface RecentTransaction {
  id: number;
  userId: number;
  username: string;
  amount: number;
  type: string;
  description?: string;
  createdAt: string;
}

interface PlanDistribution {
  name: string;
  count: number;
  percentage: number;
}

export default function AdminDashboard() {
  const { t } = useLanguage();

  // Fetch admin dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch recent users
  const { data: recentUsers = [], isLoading: isLoadingUsers } = useQuery<RecentUser[]>({
    queryKey: ["/api/admin/recent-users"],
  });

  // Fetch recent transactions
  const { data: recentTransactions = [], isLoading: isLoadingTransactions } = useQuery<RecentTransaction[]>({
    queryKey: ["/api/admin/recent-transactions"],
  });

  // Fetch plan distribution
  const { data: planDistribution = [], isLoading: isLoadingPlans } = useQuery<PlanDistribution[]>({
    queryKey: ["/api/admin/user-plan-distribution"],
  });

  return (
    <>
      <Head>
        <title>{t("admin.dashboard")} - {t("common.appName")}</title>
      </Head>
      
      <AdminLayout title={t("admin.dashboard")}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.stats.totalUsers")}
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : (stats?.totalUsers ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.stats.totalArticles")}
              </CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : (stats?.totalArticles ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +25% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.stats.totalCredits")}
              </CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : (stats?.totalCredits ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +18% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.stats.totalRevenue")}
              </CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +30% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Growth Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.stats.userGrowth") || "User Growth"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{t("admin.stats.userGrowthDesc") || "Tổng số người dùng mới theo tháng"}</p>
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">{t("admin.stats.noGrowthDataYet") || "Chưa có dữ liệu tăng trưởng"}</p>
                  <p className="text-xs text-muted-foreground mt-2">{t("admin.stats.growthDataWillShow") || "Dữ liệu sẽ hiển thị khi có nhiều người dùng hơn"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.stats.revenue") || "Revenue"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{t("admin.stats.revenueDesc") || "Tổng doanh thu theo quý"}</p>
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">{t("admin.stats.noRevenueDataYet") || "Chưa có dữ liệu doanh thu"}</p>
                  <p className="text-xs text-muted-foreground mt-2">{t("admin.stats.revenueDataWillShow") || "Dữ liệu sẽ hiển thị khi có giao dịch"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.stats.planDistribution") || "Credit Package Distribution"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{t("admin.stats.planDistributionDesc") || "Phân bổ gói tín dụng"}</p>
                {isLoadingPlans ? (
                  <div className="space-y-2">
                    <div className="animate-pulse flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                      <div className="flex-1 h-4 bg-gray-300 rounded"></div>
                      <div className="w-8 h-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="animate-pulse flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                      <div className="flex-1 h-4 bg-gray-300 rounded"></div>
                      <div className="w-8 h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ) : planDistribution.length > 0 ? (
                  <div className="space-y-2">
                    {planDistribution.map((plan, index) => {
                      const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-red-500"];
                      const color = colors[index % colors.length];
                      return (
                        <div key={plan.name} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                          <span className="flex-1">{plan.name}</span>
                          <span className="font-bold">{plan.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t("admin.stats.noDataAvailable") || "Chưa có dữ liệu"}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("admin.stats.recentUsers")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.user.username")}</TableHead>
                    <TableHead>{t("admin.user.fullName")}</TableHead>
                    <TableHead>{t("admin.user.joinDate")}</TableHead>
                    <TableHead className="text-right">{t("admin.user.credits")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                        <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                        <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                        <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                      </TableRow>
                    ))
                  ) : recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName || user.email}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">{user.credits}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {t("admin.stats.noUsersYet") || "Chưa có người dùng nào"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.stats.recentTransactions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t("admin.user.username")}</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                      <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                      <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                      <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                      <TableCell><div className="animate-pulse h-4 bg-gray-300 rounded"></div></TableCell>
                    </TableRow>
                  ))
                ) : recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.username || `User ${transaction.userId}`}</TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell className="text-right">{transaction.amount} credits</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t("admin.stats.noTransactionsYet") || "Chưa có giao dịch nào"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
}
