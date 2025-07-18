import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useLanguage } from "@/hooks/use-language";
import { useDbTranslations } from "@/hooks/use-db-translations";
import { 
  Clock, 
  FileText, 
  Zap, 
  Image, 
  CreditCard, 
  Calendar,
  Check,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import type { CreditUsageHistory } from "@shared/schema";

interface CreditUsageHistoryResponse {
  history: CreditUsageHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CreditHistoryPage() {
  const { t } = useLanguage();
  const { t: tDb } = useDbTranslations();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<CreditUsageHistory | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: responseData, isLoading, error, refetch } = useQuery<{success: boolean, data: CreditUsageHistoryResponse}>({
    queryKey: ['/api/dashboard/credit-usage-history', { page: currentPage, limit: 20 }],
    retry: false,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't keep in cache
  });

  // Refetch data when component mounts or page changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Invalidate cache when page changes
  useEffect(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/dashboard/credit-usage-history'] 
    });
  }, [currentPage, queryClient]);
  
  const data = responseData?.data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      time: date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      date: date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    };
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'content_generation': return 'Tạo nội dung';
      case 'image_generation': return 'Tạo hình ảnh';
      case 'social_content': return 'Nội dung mạng xã hội';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'content_generation': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'image_generation': return <Image className="w-4 h-4 text-green-600" />;
      case 'social_content': return <Zap className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getContentLengthLabel = (length: string) => {
    switch (length) {
      case 'short': return 'Ngắn (~500 từ)';
      case 'medium': return 'Trung bình (~1000 từ)';
      case 'long': return 'Dài (~1500 từ)';
      case 'very_long': return 'Rất dài (~3000 từ)';
      default: return length;
    }
  };

  const getModelLabel = (model: string) => {
    switch (model) {
      case 'chatgpt': return 'ChatGPT';
      case 'gemini': return 'Gemini';
      case 'claude': return 'Claude';
      default: return model;
    }
  };

  const openDetailDialog = (item: CreditUsageHistory) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Lịch sử tín dụng">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Lịch sử tín dụng">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>
            Không thể tải lịch sử sử dụng tín dụng. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const history = data?.history || [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout title="Lịch sử tín dụng">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                Xem chi tiết lịch sử sử dụng tín dụng của bạn
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ 
                  queryKey: ['/api/dashboard/credit-usage-history'] 
                });
                refetch();
              }}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>

      {/* History List */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                Chưa có lịch sử sử dụng tín dụng
              </div>
            </CardContent>
          </Card>
        ) : (
          history.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getActionIcon(item.action)}
                        <span className="font-medium text-lg">{getActionLabel(item.action)}</span>
                      </div>
                      <Badge variant={item.success ? "default" : "destructive"}>
                        {item.success ? (
                          <><Check className="w-3 h-3 mr-1" /> Thành công</>
                        ) : (
                          <><X className="w-3 h-3 mr-1" /> Thất bại</>
                        )}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                        <CreditCard className="w-3 h-3" />
                        -{item.totalCredits} tín dụng
                      </Badge>
                    </div>
                    
                    {/* Tiêu đề bài viết */}
                    {item.resultTitle && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiêu đề: </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.resultTitle}
                        </span>
                      </div>
                    )}

                    {/* Thông tin tóm tắt */}
                    <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Mô tả: </span>
                      {item.contentLength && item.aiModel ? (
                        <>Tạo nội dung {getContentLengthLabel(item.contentLength).toLowerCase()} 
                        với {getModelLabel(item.aiModel)}
                        {item.generateImages ? `, bao gồm ${item.imageCount} hình ảnh` : ''}
                        {item.resultWordCount && item.resultWordCount > 0 ? ` → Kết quả: ${item.resultWordCount.toLocaleString()} từ` : ''}</>
                      ) : (
                        <>Sử dụng tín dụng cho {getActionLabel(item.action).toLowerCase()}</>
                      )}
                    </div>
                    
                    {/* Hide any potential stray values */}
                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      {item.contentLength && (
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg text-sm">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-800 dark:text-blue-200">
                            {getContentLengthLabel(item.contentLength)}
                          </span>
                        </div>
                      )}
                      {item.aiModel && (
                        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg text-sm">
                          <Zap className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-800 dark:text-purple-200">
                            {getModelLabel(item.aiModel)}
                          </span>
                        </div>
                      )}
                      {Boolean(item.resultWordCount && item.resultWordCount > 0) && (
                        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg text-sm">
                          <FileText className="w-4 h-4 text-orange-600" />
                          <span className="text-orange-800 dark:text-orange-200">
                            {item.resultWordCount.toLocaleString()} từ
                          </span>
                        </div>
                      )}
                      {item.generateImages && (
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg text-sm">
                          <Image className="w-4 h-4 text-green-600" />
                          <span className="text-green-800 dark:text-green-200">
                            {item.imageCount} hình ảnh
                          </span>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openDetailDialog(item)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(item.createdAt).time}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.createdAt).date}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} bản ghi
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="flex items-center gap-1"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Chi tiết sử dụng tín dụng
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Thời gian</label>
                  <p className="text-sm font-mono">{formatDate(selectedItem.createdAt).full}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedItem.success ? "default" : "destructive"}>
                      {selectedItem.success ? (
                        <><Check className="w-3 h-3 mr-1" /> Thành công</>
                      ) : (
                        <><X className="w-3 h-3 mr-1" /> Thất bại</>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Details */}
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Hành động</label>
                <div className="flex items-center gap-2 mt-1">
                  {getActionIcon(selectedItem.action)}
                  <span className="font-medium">{getActionLabel(selectedItem.action)}</span>
                </div>
              </div>

              {/* Title and Results */}
              {(selectedItem.resultTitle || selectedItem.resultWordCount) && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Kết quả</label>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedItem.resultTitle && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tiêu đề:</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedItem.resultTitle}</div>
                      </div>
                    )}
                    {Boolean(selectedItem.resultWordCount && selectedItem.resultWordCount > 0) && (
                      <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span className="text-orange-800 dark:text-orange-200 font-medium">
                          Số từ: {selectedItem.resultWordCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Configuration Details */}
              {(selectedItem.contentLength || selectedItem.aiModel || selectedItem.generateImages) && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cấu hình</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedItem.contentLength && (
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-800 dark:text-blue-200">Độ dài nội dung</div>
                          <div className="text-sm text-blue-600 dark:text-blue-300">
                            {getContentLengthLabel(selectedItem.contentLength)}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedItem.aiModel && (
                      <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-medium text-purple-800 dark:text-purple-200">AI Model</div>
                          <div className="text-sm text-purple-600 dark:text-purple-300">
                            {getModelLabel(selectedItem.aiModel)}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedItem.generateImages && (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                        <Image className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800 dark:text-green-200">Hình ảnh</div>
                          <div className="text-sm text-green-600 dark:text-green-300">
                            {selectedItem.imageCount} ảnh được tạo
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Credits Breakdown */}
              {selectedItem.creditsBreakdown && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-800 dark:text-orange-200">
                      Chi phí tín dụng chi tiết
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {typeof selectedItem.creditsBreakdown === 'object' && (
                      <>
                        {/* Support both old format (contentLength, aiModel, images) and new format (contentCredits, aiModelCredits, imageCredits) */}
                        {(selectedItem.creditsBreakdown.contentLength !== undefined || selectedItem.creditsBreakdown.contentCredits !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">
                              Nội dung ({getContentLengthLabel(selectedItem.contentLength || 'unknown')}):
                            </span>
                            <span className="font-medium text-orange-800 dark:text-orange-200">
                              {selectedItem.creditsBreakdown.contentLength || selectedItem.creditsBreakdown.contentCredits || 0} tín dụng
                            </span>
                          </div>
                        )}
                        {(selectedItem.creditsBreakdown.aiModel !== undefined || selectedItem.creditsBreakdown.aiModelCredits !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">
                              AI Model ({getModelLabel(selectedItem.aiModel || 'unknown')}):
                            </span>
                            <span className="font-medium text-orange-800 dark:text-orange-200">
                              {selectedItem.creditsBreakdown.aiModel || selectedItem.creditsBreakdown.aiModelCredits || 0} tín dụng
                            </span>
                          </div>
                        )}
                        {((selectedItem.creditsBreakdown.images !== undefined && selectedItem.creditsBreakdown.images > 0) || 
                          (selectedItem.creditsBreakdown.imageCredits !== undefined && selectedItem.creditsBreakdown.imageCredits > 0)) && (
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">
                              Hình ảnh ({selectedItem.imageCount || 0} ảnh):
                            </span>
                            <span className="font-medium text-orange-800 dark:text-orange-200">
                              {selectedItem.creditsBreakdown.images || selectedItem.creditsBreakdown.imageCredits || 0} tín dụng
                            </span>
                          </div>
                        )}
                        <div className="border-t border-orange-200 dark:border-orange-700 pt-2 mt-3">
                          <div className="flex justify-between font-bold">
                            <span className="text-orange-800 dark:text-orange-200">Tổng cộng:</span>
                            <span className="text-orange-900 dark:text-orange-100">
                              {selectedItem.creditsBreakdown.total || selectedItem.totalCredits} tín dụng
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {!selectedItem.success && selectedItem.errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-200">Lỗi</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {selectedItem.errorMessage}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </DashboardLayout>
  );
}