import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/Layout";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { DateRange } from "react-day-picker";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import {
  TrendingUp,
  Users,
  UserCheck,
  FileText,
  Image,
  Download,
  Calendar as CalendarIcon,
  Activity,
  Eye,
  PenTool,
  ImageIcon,
  Share2,
  Globe,
  HelpCircle,
} from "lucide-react";
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import Head from "@/components/head";
import { format as formatDate, subDays, subMonths } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AnalyticsOverview {
  registeredAccounts: number;
  activeUsers: number;
  totalArticles: number;
  totalImages: number;
  seoContentCreated: number;
  imagesGenerated: number;
  socialContentCreated: number;
  wordpressPostsPublished: number;
}

interface ChartData {
  total: number;
  data: { date: string; count: number }[];
}

export default function AdminAnalytics() {
  const { t, language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // Date locale for chart formatting
  const dateLocale = language === 'vi' ? vi : enUS;

  // Quick date preset options
  const datePresets = [
    { 
      label: language === 'vi' ? 'Hôm nay' : 'Today',
      range: { from: new Date(), to: new Date() }
    },
    { 
      label: language === 'vi' ? '7 ngày qua' : 'Last 7 days',
      range: { from: subDays(new Date(), 7), to: new Date() }
    },
    { 
      label: language === 'vi' ? '30 ngày qua' : 'Last 30 days',
      range: { from: subDays(new Date(), 30), to: new Date() }
    },
    { 
      label: language === 'vi' ? '3 tháng qua' : 'Last 3 months',
      range: { from: subMonths(new Date(), 3), to: new Date() }
    }
  ];

  // Format date range for API calls
  const formatDateForAPI = (date: Date) => formatDate(date, 'yyyy-MM-dd');

  const getDateRangeParams = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return { from: formatDateForAPI(subDays(new Date(), 30)), to: formatDateForAPI(new Date()) };
    }
    return { 
      from: formatDateForAPI(dateRange.from), 
      to: formatDateForAPI(dateRange.to) 
    };
  };

  // Overview data
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/admin/analytics/overview', dateRange],
    queryFn: async () => {
      const { from, to } = getDateRangeParams();
      const response = await fetch(`/api/admin/analytics/overview?from=${from}&to=${to}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Registered accounts chart data
  const { data: registeredData, isLoading: registeredLoading } = useQuery({
    queryKey: ['/api/admin/analytics/registered-accounts', dateRange],
    queryFn: async () => {
      const { from, to } = getDateRangeParams();
      const response = await fetch(`/api/admin/analytics/registered-accounts?from=${from}&to=${to}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Active users chart data
  const { data: activeUsersData, isLoading: activeUsersLoading } = useQuery({
    queryKey: ['/api/admin/analytics/active-users', dateRange],
    queryFn: async () => {
      const { from, to } = getDateRangeParams();
      const response = await fetch(`/api/admin/analytics/active-users?from=${from}&to=${to}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  const overview: AnalyticsOverview = overviewData?.data || {
    registeredAccounts: 0,
    activeUsers: 0,
    totalArticles: 0,
    totalImages: 0,
    seoContentCreated: 0,
    imagesGenerated: 0,
    socialContentCreated: 0,
    wordpressPostsPublished: 0
  };

  const registeredChartData: ChartData = registeredData?.data || { total: 0, data: [] };
  const activeUsersChartData: ChartData = activeUsersData?.data || { total: 0, data: [] };







  // Export function
  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      // In a real implementation, this would call an export API
      // For now, we'll just log the export action
      console.log(`Exporting analytics data as ${format.toUpperCase()}`);
      
      if (format === 'csv') {
        // Export as CSV with all 8 analytics fields (multilingual)
        const metricLabel = language === 'vi' ? 'Chỉ số' : 'Metric';
        const valueLabel = language === 'vi' ? 'Giá trị' : 'Value';
        const dateLabel = language === 'vi' ? 'Ngày' : 'Date';
        
        const csvData = [
          [metricLabel, valueLabel],
          [language === 'vi' ? 'Tài khoản đăng ký' : 'Registered Accounts', overview.registeredAccounts],
          [language === 'vi' ? 'Người dùng hoạt động' : 'Active Users', overview.activeUsers],
          [language === 'vi' ? 'Nội dung SEO' : 'SEO Content Created', overview.seoContentCreated],
          [language === 'vi' ? 'Hình ảnh tạo' : 'Images Generated', overview.imagesGenerated],
          [language === 'vi' ? 'Nội dung mạng xã hội' : 'Social Content Created', overview.socialContentCreated],
          [language === 'vi' ? 'Đăng WordPress' : 'WordPress Posts Published', overview.wordpressPostsPublished],
          [language === 'vi' ? 'Tổng bài viết' : 'Total Articles', overview.totalArticles],
          [language === 'vi' ? 'Tổng hình ảnh' : 'Total Images', overview.totalImages],
          [''],
          [dateLabel, language === 'vi' ? 'Tài khoản đăng ký' : 'Registered Accounts', language === 'vi' ? 'Người dùng hoạt động' : 'Active Users'],
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
      } else if (format === 'pdf') {
        // Export as PDF with all 8 analytics fields
        const { jsPDF } = await import('jspdf');
        const autoTable = await import('jspdf-autotable');
        
        const doc = new jsPDF();
        
        // Title (multilingual)
        doc.setFontSize(20);
        const reportTitle = language === 'vi' ? 'Báo cáo Thống kê' : 'Analytics Report';
        doc.text(reportTitle, 20, 20);
        
        // Period info (multilingual)
        doc.setFontSize(12);
        const periodText = language === 'vi' ? 
          (selectedPeriod === '1d' ? '24 Giờ' : 
           selectedPeriod === '7d' ? '7 Ngày' : 
           selectedPeriod === '1m' ? '1 Tháng' : '12 Tháng') :
          (selectedPeriod === '1d' ? '24 Hours' : 
           selectedPeriod === '7d' ? '7 Days' : 
           selectedPeriod === '1m' ? '1 Month' : '12 Months');
        
        const periodLabel = language === 'vi' ? 'Khoảng thời gian:' : 'Period:';
        const generatedLabel = language === 'vi' ? 'Tạo lúc:' : 'Generated:';
        
        doc.text(`${periodLabel} ${periodText}`, 20, 30);
        doc.text(`${generatedLabel} ${formatDate(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 40);
        
        // Overview data table (multilingual)
        const overviewData = [
          [language === 'vi' ? 'Tài khoản đăng ký' : 'Registered Accounts', overview.registeredAccounts.toLocaleString()],
          [language === 'vi' ? 'Người dùng hoạt động' : 'Active Users', overview.activeUsers.toLocaleString()],
          [language === 'vi' ? 'Nội dung SEO' : 'SEO Content Created', overview.seoContentCreated.toLocaleString()],
          [language === 'vi' ? 'Hình ảnh tạo' : 'Images Generated', overview.imagesGenerated.toLocaleString()],
          [language === 'vi' ? 'Nội dung mạng xã hội' : 'Social Content Created', overview.socialContentCreated.toLocaleString()],
          [language === 'vi' ? 'Đăng WordPress' : 'WordPress Posts Published', overview.wordpressPostsPublished.toLocaleString()],
          [language === 'vi' ? 'Tổng bài viết' : 'Total Articles', overview.totalArticles.toLocaleString()],
          [language === 'vi' ? 'Tổng hình ảnh' : 'Total Images', overview.totalImages.toLocaleString()]
        ];
        
        (doc as any).autoTable({
          head: [[metricLabel, valueLabel]],
          body: overviewData,
          startY: 50,
          margin: { left: 20, right: 20 },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [59, 130, 246] }
        });
        
        // Chart data table if available (multilingual)
        if (registeredChartData.data.length > 0) {
          const chartData = registeredChartData.data.map((item, index) => [
            formatChartDate(item.date),
            item.count.toString(),
            (activeUsersChartData.data[index]?.count || 0).toString()
          ]);
          
          (doc as any).autoTable({
            head: [[dateLabel, language === 'vi' ? 'Tài khoản đăng ký' : 'Registered Accounts', language === 'vi' ? 'Người dùng hoạt động' : 'Active Users']],
            body: chartData,
            startY: (doc as any).lastAutoTable.finalY + 20,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [34, 197, 94] }
          });
        }
        
        // Save PDF
        const { from, to } = getDateRangeParams();
        doc.save(`analytics-${from}-to-${to}-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
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
      const parsedDate = new Date(date);
      
      if (!dateRange?.from || !dateRange?.to) {
        return formatDate(parsedDate, 'dd/MM', { locale: dateLocale });
      }

      // Calculate date range difference to determine format
      const diffInDays = Math.abs((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays <= 1) {
        // Same day or very close - show hours
        return formatDate(parsedDate, 'HH:mm', { locale: dateLocale });
      } else if (diffInDays <= 90) {
        // Less than 3 months - show day/month
        return formatDate(parsedDate, 'dd/MM', { locale: dateLocale });
      } else {
        // More than 3 months - show month/year
        return formatDate(parsedDate, 'MMM yyyy', { locale: dateLocale });
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
        <TooltipProvider>
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
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {formatDate(dateRange.from, "dd/MM/yyyy", { locale: dateLocale })} -{" "}
                            {formatDate(dateRange.to, "dd/MM/yyyy", { locale: dateLocale })}
                          </>
                        ) : (
                          formatDate(dateRange.from, "dd/MM/yyyy", { locale: dateLocale })
                        )
                      ) : (
                        <span>{language === 'vi' ? 'Chọn khoảng thời gian' : 'Pick a date range'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b border-border">
                      <div className="text-sm font-medium mb-2">
                        {language === 'vi' ? 'Lựa chọn nhanh' : 'Quick select'}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {datePresets.map((preset, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="justify-start text-xs"
                            onClick={() => setDateRange(preset.range)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

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
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Tài khoản đăng ký' : 'Registered Accounts'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Tổng số tài khoản người dùng đã đăng ký trên hệ thống trong khoảng thời gian được chọn' : 'Total number of user accounts registered in the system during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.registeredAccounts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Tổng số tài khoản' : 'Total accounts'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Người dùng hoạt động' : 'Active Users'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Số người dùng đã tạo nội dung (bài viết, hình ảnh, hoặc đăng bài) trong khoảng thời gian được chọn' : 'Number of users who created content (articles, images, or posts) during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.activeUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Trong 30 ngày qua' : 'Last 30 days'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Nội dung SEO' : 'SEO Content'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Số bài viết SEO được tạo bởi AI với tối ưu hóa từ khóa và meta description trong khoảng thời gian được chọn' : 'Number of SEO articles created by AI with keyword optimization and meta descriptions during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <PenTool className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.seoContentCreated.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Bài viết SEO' : 'SEO articles'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Hình ảnh tạo' : 'Images Created'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Tổng số hình ảnh được tạo ra bằng AI hoặc upload bởi người dùng trong khoảng thời gian được chọn' : 'Total number of images generated by AI or uploaded by users during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.imagesGenerated.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Hình ảnh' : 'Images'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Nội dung mạng xã hội' : 'Social Content'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Số bài viết được tạo cho các nền tảng mạng xã hội như Facebook, Twitter, LinkedIn trong khoảng thời gian được chọn' : 'Number of posts created for social media platforms like Facebook, Twitter, LinkedIn during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.socialContentCreated.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Bài đăng' : 'Posts'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Đăng WordPress' : 'WordPress Posts'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Số bài viết SEO đã được tự động đăng lên các website WordPress trong khoảng thời gian được chọn' : 'Number of SEO articles automatically published to WordPress websites during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.wordpressPostsPublished.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Đã đăng' : 'Published'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Tổng bài viết' : 'Total Articles'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Tổng số bài viết đã được tạo ra trên hệ thống (bao gồm cả draft và published) trong khoảng thời gian được chọn' : 'Total number of articles created in the system (including drafts and published) during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.totalArticles.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'Tất cả' : 'All articles'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {language === 'vi' ? 'Tổng hình ảnh' : 'Total Images'}
                  <UITooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{language === 'vi' ? 'Tổng số file hình ảnh được lưu trữ trong hệ thống trong khoảng thời gian được chọn' : 'Total number of image files stored in the system during the selected time period'}</p>
                    </TooltipContent>
                  </UITooltip>
                </CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewLoading ? '...' : overview.totalImages.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? 'File ảnh' : 'Image files'}
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
                    <div className="w-full h-[300px]">
                      <Bar
                        data={{
                          labels: registeredChartData.data.map(item => formatChartDate(item.date)),
                          datasets: [
                            {
                              label: language === 'vi' ? 'Đăng ký mới' : 'New Registrations',
                              data: registeredChartData.data.map(item => item.count),
                              backgroundColor: 'rgba(59, 130, 246, 0.6)',
                              borderColor: 'rgba(59, 130, 246, 1)',
                              borderWidth: 1,
                              borderRadius: 4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              titleColor: 'white',
                              bodyColor: 'white',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1,
                                color: 'rgba(156, 163, 175, 1)',
                              },
                              grid: {
                                color: 'rgba(156, 163, 175, 0.1)',
                              },
                            },
                            x: {
                              ticks: {
                                color: 'rgba(156, 163, 175, 1)',
                              },
                              grid: {
                                display: false,
                              },
                            },
                          },
                        }}
                      />
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
                    <div className="w-full h-[300px]">
                      <Line
                        data={{
                          labels: activeUsersChartData.data.map(item => formatChartDate(item.date)),
                          datasets: [
                            {
                              label: language === 'vi' ? 'Người dùng hoạt động' : 'Active Users',
                              data: activeUsersChartData.data.map(item => item.count),
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              borderColor: 'rgba(34, 197, 94, 1)',
                              borderWidth: 2,
                              fill: true,
                              tension: 0.4,
                              pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                              pointBorderColor: 'rgba(34, 197, 94, 1)',
                              pointRadius: 4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              titleColor: 'white',
                              bodyColor: 'white',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1,
                                color: 'rgba(156, 163, 175, 1)',
                              },
                              grid: {
                                color: 'rgba(156, 163, 175, 0.1)',
                              },
                            },
                            x: {
                              ticks: {
                                color: 'rgba(156, 163, 175, 1)',
                              },
                              grid: {
                                display: false,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </TooltipProvider>
      </AdminLayout>
    </>
  );
}