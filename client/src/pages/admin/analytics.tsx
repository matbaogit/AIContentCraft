import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/Layout";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  UserCheck,
  FileText,
  Image,
  Download,
  Calendar,
  Activity,
  Eye,
} from "lucide-react";
import Head from "@/components/head";
import { format as formatDate } from "date-fns";
import { vi, enUS } from "date-fns/locale";

interface AnalyticsOverview {
  registeredAccounts: number;
  activeUsers: number;
  totalArticles: number;
  totalImages: number;
}

interface ChartData {
  total: number;
  data: { date: string; count: number }[];
}

type Period = '1d' | '7d' | '1m' | '12m';

export default function AdminAnalytics() {
  const { t, language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1m');
  const [isExporting, setIsExporting] = useState(false);

  // Date locale for chart formatting
  const dateLocale = language === 'vi' ? vi : enUS;

  // Period options
  const periodOptions = [
    { value: '1d', label: language === 'vi' ? '1 ngày' : '1 Day' },
    { value: '7d', label: language === 'vi' ? '7 ngày' : '7 Days' },
    { value: '1m', label: language === 'vi' ? '1 tháng' : '1 Month' },
    { value: '12m', label: language === 'vi' ? '12 tháng' : '12 Months' }
  ];

  // Overview data
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/admin/analytics/overview', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/overview?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Registered accounts chart data
  const { data: registeredData, isLoading: registeredLoading } = useQuery({
    queryKey: ['/api/admin/analytics/registered-accounts', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/registered-accounts?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Active users chart data
  const { data: activeUsersData, isLoading: activeUsersLoading } = useQuery({
    queryKey: ['/api/admin/analytics/active-users', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/active-users?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Mock overview data để test
  const mockOverview: AnalyticsOverview = {
    registeredAccounts: 1250,
    activeUsers: 342,
    totalArticles: 8650,
    totalImages: 4320
  };

  const overview: AnalyticsOverview = mockOverview;

  // Mock data để test biểu đồ
  const mockRegisteredData: ChartData = {
    total: 150,
    data: [
      { date: "2025-01", count: 12 },
      { date: "2025-02", count: 19 },
      { date: "2025-03", count: 25 },
      { date: "2025-04", count: 22 },
      { date: "2025-05", count: 30 },
      { date: "2025-06", count: 28 },
      { date: "2025-07", count: 35 },
      { date: "2025-08", count: 18 }
    ]
  };

  const mockActiveUsersData: ChartData = {
    total: 89,
    data: [
      { date: "2025-01", count: 8 },
      { date: "2025-02", count: 14 },
      { date: "2025-03", count: 18 },
      { date: "2025-04", count: 16 },
      { date: "2025-05", count: 22 },
      { date: "2025-06", count: 20 },
      { date: "2025-07", count: 25 },
      { date: "2025-08", count: 12 }
    ]
  };

  // Sử dụng mock data thay vì real data để test
  const registeredChartData: ChartData = mockRegisteredData;
  const activeUsersChartData: ChartData = mockActiveUsersData;

  // Debug: kiểm tra dữ liệu biểu đồ
  console.log('Chart Data:', {
    registeredChartData,
    activeUsersChartData,
    registeredDataLength: registeredChartData.data.length,
    activeUsersDataLength: activeUsersChartData.data.length
  });



  // Export function
  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      // In a real implementation, this would call an export API
      // For now, we'll just log the export action
      console.log(`Exporting analytics data as ${format.toUpperCase()}`);
      
      if (format === 'csv') {
        // Export as CSV
        const csvData = [
          ['Metric', 'Value'],
          ['Registered Accounts', overview.registeredAccounts],
          ['Active Users', overview.activeUsers],
          ['Total Articles', overview.totalArticles],
          ['Total Images', overview.totalImages],
          [''],
          ['Date', 'Registered Accounts', 'Active Users'],
          ...registeredChartData.data.map((item, index) => [
            item.date,
            item.count,
            activeUsersChartData.data[index]?.count || 0
          ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics-${selectedPeriod}-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Format chart date labels
  const formatChartDate = (date: string) => {
    try {
      let parsedDate: Date;
      
      if (selectedPeriod === '1d') {
        // Format: YYYY-MM-DD HH:00:00
        parsedDate = new Date(date);
        return formatDate(parsedDate, 'HH:mm', { locale: dateLocale });
      } else if (selectedPeriod === '12m') {
        // Format: YYYY-MM
        if (date.includes('-') && date.split('-').length === 2) {
          const [year, month] = date.split('-');
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          return formatDate(parsedDate, 'MMM yyyy', { locale: dateLocale });
        } else {
          return date;
        }
      } else {
        // Format: YYYY-MM-DD
        parsedDate = new Date(date);
        return formatDate(parsedDate, 'dd/MM', { locale: dateLocale });
      }
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', date);
      return date;
    }
  };

  return (
    <>
      <Head>
        <title>{language === 'vi' ? 'Thống kê Admin' : 'Admin Analytics'}</title>
        <meta name="description" content={language === 'vi' ? 'Bảng thống kê chi tiết cho admin' : 'Detailed analytics dashboard for admin'} />
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {language === 'vi' ? 'Thống kê' : 'Analytics'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {language === 'vi' 
                  ? 'Theo dõi người dùng đăng ký và hoạt động của hệ thống'
                  : 'Track user registrations and system activity'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={selectedPeriod} onValueChange={(value: Period) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'vi' ? 'Tài khoản đã đăng ký' : 'Registered Accounts'}
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.registeredAccounts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Người dùng đã xác minh' : 'Verified users'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'vi' ? 'Người dùng hoạt động' : 'Active Users'}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.activeUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Có hoạt động cốt lõi' : 'With core actions'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'vi' ? 'Bài viết' : 'Articles'}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.totalArticles.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Được tạo trong kỳ' : 'Created in period'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'vi' ? 'Hình ảnh' : 'Images'}
                </CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.totalImages.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Được tạo trong kỳ' : 'Created in period'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registered Accounts Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {language === 'vi' ? 'Xu hướng đăng ký' : 'Registration Trend'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {registeredLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">
                        {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                      </div>
                    </div>
                  ) : registeredChartData.data.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">
                        {language === 'vi' ? 'Không có dữ liệu' : 'No data available'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '300px', border: '1px solid #ccc' }}>
                      <div style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                        Data: {registeredChartData.data.length} items
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={registeredChartData.data}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Users Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {language === 'vi' ? 'Hoạt động người dùng' : 'User Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {activeUsersLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">
                        {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                      </div>
                    </div>
                  ) : activeUsersChartData.data.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">
                        {language === 'vi' ? 'Không có dữ liệu' : 'No data available'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '300px', border: '1px solid #ccc' }}>
                      <div style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                        Data: {activeUsersChartData.data.length} items
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={activeUsersChartData.data}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar 
                            dataKey="count" 
                            fill="#82ca9d"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}