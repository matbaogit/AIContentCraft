import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Check, X, CreditCard, FileText, Zap, Image, Database } from "lucide-react";

interface CreditUsageHistory {
  id: number;
  userId: number;
  action: string;
  contentLength: string | null;
  aiModel: string | null;
  generateImages: boolean;
  imageCount: number;
  totalCredits: number;
  creditsBreakdown: any;
  requestData: any;
  resultTitle: string | null;
  resultWordCount: number | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

interface CreditUsageResponse {
  success: boolean;
  data: {
    history: CreditUsageHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function CreditUsageHistory() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: usageData, isLoading, error } = useQuery<CreditUsageResponse>({
    queryKey: ['/api/dashboard/credit-usage-history', currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/credit-usage-history?page=${currentPage}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch credit usage history');
      }
      return response.json();
    }
  });

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'content_generation':
        return <FileText className="w-4 h-4" />;
      case 'image_generation':
        return <Image className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'content_generation':
        return 'Tạo nội dung';
      case 'image_generation':
        return 'Tạo hình ảnh';
      default:
        return action;
    }
  };

  const getContentLengthLabel = (length: string | null) => {
    switch (length) {
      case 'short':
        return 'Ngắn (~500 từ)';
      case 'medium':
        return 'Trung bình (~1000 từ)';
      case 'long':
        return 'Dài (~1500 từ)';
      case 'very_long':
        return 'Rất dài (~3000 từ)';
      default:
        return length || 'Không xác định';
    }
  };

  const getModelLabel = (model: string | null) => {
    switch (model) {
      case 'openai':
        return 'ChatGPT';
      case 'claude':
        return 'Claude';
      case 'gemini':
        return 'Gemini';
      default:
        return model || 'Không xác định';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">Đang tải lịch sử sử dụng tín dụng...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">Lỗi khi tải lịch sử sử dụng tín dụng</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { history, pagination } = usageData?.data || { history: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lịch sử sử dụng tín dụng</h1>
        <p className="text-gray-600">Chi tiết các giao dịch và sử dụng tín dụng của người dùng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Lịch sử giao dịch ({pagination.total} mục)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có lịch sử sử dụng tín dụng
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
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
                        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 border-red-200 text-red-800">
                          <CreditCard className="w-3 h-3" />
                          -{item.totalCredits} tín dụng
                        </Badge>
                      </div>
                      
                      {/* Thông tin tóm tắt */}
                      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Mô tả: </span>
                        {item.contentLength && item.aiModel ? (
                          <>Tạo nội dung {getContentLengthLabel(item.contentLength).toLowerCase()} 
                          với {getModelLabel(item.aiModel)}
                          {item.generateImages ? `, bao gồm ${item.imageCount} hình ảnh` : ''}
                          {item.resultWordCount ? ` → Kết quả: ${item.resultWordCount.toLocaleString()} từ` : ''}</>
                        ) : (
                          <>Sử dụng tín dụng cho {getActionLabel(item.action).toLowerCase()}</>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Chi tiết cấu hình */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {item.contentLength && (
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div>
                                <span className="font-medium text-blue-800 dark:text-blue-200">Độ dài nội dung:</span>
                                <br />
                                <span className="text-blue-600 dark:text-blue-300">{getContentLengthLabel(item.contentLength)}</span>
                              </div>
                            </div>
                          )}
                          {item.aiModel && (
                            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                              <Zap className="w-4 h-4 text-purple-600" />
                              <div>
                                <span className="font-medium text-purple-800 dark:text-purple-200">AI Model:</span>
                                <br />
                                <span className="text-purple-600 dark:text-purple-300">{getModelLabel(item.aiModel)}</span>
                              </div>
                            </div>
                          )}
                          {item.generateImages && (
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                              <Image className="w-4 h-4 text-green-600" />
                              <div>
                                <span className="font-medium text-green-800 dark:text-green-200">Hình ảnh:</span>
                                <br />
                                <span className="text-green-600 dark:text-green-300">{item.imageCount} ảnh được tạo</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Kết quả chi tiết */}
                        {item.resultWordCount && (
                          <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Kết quả:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {item.resultWordCount.toLocaleString()} từ được tạo
                            </span>
                          </div>
                        )}
                      </div>

                      {item.resultTitle && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Tiêu đề:</span> {item.resultTitle}
                        </div>
                      )}

                      {item.creditsBreakdown && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-orange-600" />
                            <span className="font-medium text-orange-800 dark:text-orange-200">Chi phí tín dụng chi tiết:</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            {typeof item.creditsBreakdown === 'object' && (
                              <>
                                {item.creditsBreakdown.contentCredits !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-orange-700 dark:text-orange-300">Nội dung ({item.contentLength}):</span>
                                    <span className="font-medium text-orange-800 dark:text-orange-200">
                                      {item.creditsBreakdown.contentCredits} tín dụng
                                    </span>
                                  </div>
                                )}
                                {item.creditsBreakdown.aiModelCredits !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-orange-700 dark:text-orange-300">AI Model ({item.aiModel}):</span>
                                    <span className="font-medium text-orange-800 dark:text-orange-200">
                                      {item.creditsBreakdown.aiModelCredits} tín dụng
                                    </span>
                                  </div>
                                )}
                                {item.creditsBreakdown.imageCredits !== undefined && item.creditsBreakdown.imageCredits > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-orange-700 dark:text-orange-300">Hình ảnh ({item.imageCount} ảnh):</span>
                                    <span className="font-medium text-orange-800 dark:text-orange-200">
                                      {item.creditsBreakdown.imageCredits} tín dụng
                                    </span>
                                  </div>
                                )}
                                <div className="border-t border-orange-200 dark:border-orange-700 pt-1 mt-2">
                                  <div className="flex justify-between font-bold">
                                    <span className="text-orange-800 dark:text-orange-200">Tổng cộng:</span>
                                    <span className="text-orange-900 dark:text-orange-100">
                                      {item.totalCredits} tín dụng
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {!item.success && item.errorMessage && (
                        <div className="mt-2 text-sm text-red-600">
                          <span className="font-medium">Lỗi:</span> {item.errorMessage}
                        </div>
                      )}
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
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                Trang trước
              </Button>
              <span className="flex items-center px-4 text-sm">
                Trang {currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              >
                Trang sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}