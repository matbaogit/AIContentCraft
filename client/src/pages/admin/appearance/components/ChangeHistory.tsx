import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Clock, User, RotateCcw, Eye } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface HistoryEntry {
  id: number;
  type: string;
  language: string;
  previousContent?: any;
  newContent: any;
  changedBy: string;
  changedAt: string;
  changeType: 'create' | 'update' | 'delete';
}

export default function ChangeHistory() {
  const { toast } = useToast();

  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/admin/appearance/history"],
    retry: false,
  });

  const restoreMutation = useMutation({
    mutationFn: async (historyId: number) => {
      return apiRequest("POST", `/api/admin/appearance/history/${historyId}/restore`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã khôi phục cài đặt từ lịch sử",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/appearance"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể khôi phục cài đặt",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      seo_meta: 'SEO & Meta Tags',
      header: 'Header & Branding', 
      login_page: 'Trang đăng nhập',
      footer: 'Footer Content',
    };
    return labels[type] || type;
  };

  const getChangeTypeColor = (changeType: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
    };
    return colors[changeType] || 'bg-gray-100 text-gray-800';
  };

  const getChangeTypeLabel = (changeType: string) => {
    const labels: Record<string, string> = {
      create: 'Tạo mới',
      update: 'Cập nhật',
      delete: 'Xóa',
    };
    return labels[changeType] || changeType;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Lịch sử thay đổi</h3>
          <p className="text-sm text-muted-foreground">
            Xem và khôi phục các thay đổi trước đây
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {!history || !Array.isArray(history.data) || !history.data.length ? (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có lịch sử thay đổi nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {history.data.map((entry: HistoryEntry) => (
                <div key={entry.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className={getChangeTypeColor(entry.changeType)}>
                          {getChangeTypeLabel(entry.changeType)}
                        </Badge>
                        <span className="font-medium">{getTypeLabel(entry.type)}</span>
                        <Badge variant="secondary">
                          {entry.language === 'vi' ? 'Tiếng Việt' : 'English'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{entry.changedBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(entry.changedAt)}</span>
                        </div>
                      </div>

                      {/* Preview of changes */}
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          Nội dung thay đổi:
                        </div>
                        <div className="text-sm">
                          {entry.changeType === 'delete' ? (
                            <span className="text-red-600">Đã xóa cài đặt</span>
                          ) : (
                            <div className="space-y-1">
                              {Object.keys(entry.newContent || {}).slice(0, 3).map((key) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="font-medium text-xs">{key}:</span>
                                  <span className="text-xs truncate">
                                    {typeof entry.newContent[key] === 'object' 
                                      ? JSON.stringify(entry.newContent[key]).substring(0, 50) + '...'
                                      : String(entry.newContent[key]).substring(0, 50)}
                                  </span>
                                </div>
                              ))}
                              {Object.keys(entry.newContent || {}).length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  ... và {Object.keys(entry.newContent || {}).length - 3} thay đổi khác
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Preview change details
                          console.log('History entry:', entry);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                      
                      {entry.changeType !== 'delete' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreMutation.mutate(entry.id)}
                          disabled={restoreMutation.isPending}
                        >
                          {restoreMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Khôi phục
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}