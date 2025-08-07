import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, Clock, User, Settings, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface AppearanceHistory {
  id: number;
  settingId: number;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  setting: {
    type: string;
    key: string;
    language: string;
  };
  user: {
    username: string;
    email: string;
  };
}

export default function ChangeHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSetting, setSelectedSetting] = useState<string>("all");

  // Fetch history
  const { data: history, isLoading } = useQuery({
    queryKey: ['/api/admin/appearance/history', selectedSetting],
    queryFn: () => {
      const params = selectedSetting !== "all" ? `?settingId=${selectedSetting}` : '';
      return apiRequest('GET', `/api/admin/appearance/history${params}`);
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (historyId: number) => {
      return apiRequest('POST', `/api/admin/appearance/restore/${historyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appearance'] });
      toast({
        title: "Khôi phục thành công",
        description: "Cài đặt đã được khôi phục về phiên bản trước",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Có lỗi xảy ra",
        description: error.message || "Không thể khôi phục cài đặt",
        variant: "destructive",
      });
    },
  });

  const handleRestore = async (historyId: number, settingKey: string) => {
    if (window.confirm(`Bạn có chắc muốn khôi phục cài đặt "${settingKey}" về phiên bản này?`)) {
      await restoreMutation.mutateAsync(historyId);
    }
  };

  const getSettingTypeLabel = (type: string) => {
    switch (type) {
      case 'seo_meta': return 'SEO Meta';
      case 'header': return 'Header';
      case 'login_page': return 'Login Page';
      case 'footer': return 'Footer';
      default: return type;
    }
  };

  const getSettingKeyLabel = (key: string) => {
    switch (key) {
      case 'site_title': return 'Tiêu đề trang';
      case 'site_description': return 'Mô tả trang';
      case 'site_keywords': return 'Từ khóa SEO';
      case 'logo_url': return 'URL Logo';
      case 'site_name': return 'Tên trang';
      case 'login_logo_url': return 'Logo đăng nhập';
      case 'title': return 'Tiêu đề';
      case 'welcome_text': return 'Văn bản chào mừng';
      case 'copyright': return 'Bản quyền';
      default: return key;
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Đang tải lịch sử...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </CardTitle>
          <CardDescription>
            Lọc lịch sử thay đổi theo loại cài đặt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedSetting} onValueChange={setSelectedSetting}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn loại cài đặt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cài đặt</SelectItem>
                <SelectItem value="seo_meta">SEO Meta Tags</SelectItem>
                <SelectItem value="header">Header & Branding</SelectItem>
                <SelectItem value="login_page">Trang đăng nhập</SelectItem>
                <SelectItem value="footer">Footer Content</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedSetting !== "all" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Đang lọc: {getSettingTypeLabel(selectedSetting)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Lịch sử thay đổi
          </CardTitle>
          <CardDescription>
            Danh sách các thay đổi gần đây, click "Khôi phục" để quay về phiên bản trước
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!history || !Array.isArray(history) || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có lịch sử thay đổi nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry: AppearanceHistory) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {getSettingTypeLabel(entry.setting.type)}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {getSettingKeyLabel(entry.setting.key)}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {entry.setting.language === 'vi' ? '🇻🇳' : '🇺🇸'} {entry.setting.language}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-red-600">Cũ:</span>
                          <span className="ml-2 text-gray-600">
                            {entry.oldValue ? truncateText(entry.oldValue) : '(trống)'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-600">Mới:</span>
                          <span className="ml-2 text-gray-900">
                            {entry.newValue ? truncateText(entry.newValue) : '(trống)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.user?.username || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.changedAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(entry.id, entry.setting.key)}
                      disabled={restoreMutation.isPending}
                      className="ml-4"
                    >
                      {restoreMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Khôi phục
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Settings className="h-4 w-4" />
            Lưu ý
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-1 text-sm">
            <li>• Lịch sử thay đổi được lưu tự động khi bạn cập nhật bất kỳ cài đặt nào</li>
            <li>• Bạn có thể khôi phục về bất kỳ phiên bản nào trong lịch sử</li>
            <li>• Việc khôi phục sẽ tạo ra một mục lịch sử mới</li>
            <li>• Lịch sử cũ sẽ được tự động xóa sau 90 ngày để tiết kiệm dung lượng</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}