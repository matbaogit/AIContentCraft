import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Image, Database, Search } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  content: string;
  textContent: string;
  imageUrls: string[];
  createdAt: string;
}

export default function ContentSeparationPage() {
  const { user } = useAuth();
  const [articleId, setArticleId] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Fetch articles list
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['/api/dashboard/articles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/dashboard/articles');
      const data = await res.json();
      return data.success ? data.data.articles : [];
    },
  });

  // Fetch content separation data
  const { data: separationData, isLoading: separationLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/articles', articleId, 'content-separation'],
    queryFn: async () => {
      if (!articleId) return null;
      const res = await apiRequest('GET', `/api/dashboard/articles/${articleId}/content-separation`);
      const data = await res.json();
      return data.success ? data.data : null;
    },
    enabled: !!articleId,
  });

  const handleSearch = () => {
    if (articleId) {
      refetch();
    }
  };

  const selectArticle = (article: any) => {
    setArticleId(article.id.toString());
    setSelectedArticle(article);
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tách riêng Content và Image</h1>
            <p className="text-muted-foreground mt-2">
              Xem cách hệ thống tách riêng nội dung text và hình ảnh từ bài viết
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Tìm kiếm bài viết
              </CardTitle>
              <CardDescription>
                Nhập ID bài viết hoặc chọn từ danh sách để xem dữ liệu tách riêng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="articleId">ID Bài viết</Label>
                  <Input
                    id="articleId"
                    type="number"
                    value={articleId}
                    onChange={(e) => setArticleId(e.target.value)}
                    placeholder="Nhập ID bài viết..."
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={!articleId}>
                    Tìm kiếm
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Hoặc chọn từ danh sách bài viết gần đây:</Label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {articlesLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                  ) : articles && articles.length > 0 ? (
                    articles.slice(0, 10).map((article: any) => (
                      <div
                        key={article.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors ${
                          selectedArticle?.id === article.id ? 'bg-muted border-primary' : ''
                        }`}
                        onClick={() => selectArticle(article)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate">{article.title}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {article.id} • {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {article.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có bài viết nào</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Kết quả tách riêng
              </CardTitle>
              <CardDescription>
                Dữ liệu content và image được tách riêng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {separationLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
              ) : separationData ? (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="content">Text View</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Content gốc</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {separationData.content ? `${separationData.content.length} ký tự` : 'Không có'}
                        </p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Text thuần</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {separationData.textContent ? `${separationData.textContent.length} ký tự` : 'Không có'}
                        </p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Image className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Hình ảnh</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {separationData.imageUrls ? `${separationData.imageUrls.length} ảnh` : '0 ảnh'}
                        </p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Trạng thái</span>
                        </div>
                        <Badge variant="secondary">Đã tách riêng</Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="font-medium mb-2">Thông tin bài viết</h4>
                      <p className="text-sm"><strong>Tiêu đề:</strong> {separationData.title}</p>
                      <p className="text-sm"><strong>ID:</strong> {separationData.id}</p>
                      <p className="text-sm"><strong>Ngày tạo:</strong> {new Date(separationData.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label>Text View (Không bao gồm hình ảnh và video):</Label>
                      <div className="mt-2 p-4 border rounded-md bg-white max-h-64 overflow-y-auto">
                        <style>{`
                          .text-view-content * {
                            color: #000000 !important;
                            background-color: transparent !important;
                          }
                          .text-view-content {
                            color: #000000 !important;
                            background-color: #ffffff !important;
                          }
                        `}</style>
                        <div 
                          className="text-sm prose prose-sm max-w-none text-view-content"
                          dangerouslySetInnerHTML={{ 
                            __html: (separationData.content || 'Không có content')
                              .replace(/<img[^>]*>/gi, '') // Remove img tags
                              .replace(/<video[^>]*>.*?<\/video>/gi, '') // Remove video tags
                              .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
                              .replace(/<embed[^>]*>/gi, '') // Remove embed tags
                              .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="images" className="space-y-4">
                    <div>
                      <Label>Danh sách URL hình ảnh:</Label>
                      <div className="mt-2 space-y-2">
                        {separationData.imageUrls && separationData.imageUrls.length > 0 ? (
                          separationData.imageUrls.map((url: string, index: number) => (
                            <div key={index} className="p-3 border rounded-md">
                              <div className="flex items-center gap-2 mb-2">
                                <Image className="h-4 w-4" />
                                <span className="font-medium text-sm">Ảnh {index + 1}</span>
                              </div>
                              <p className="text-xs text-muted-foreground break-all">{url}</p>
                              <img 
                                src={url} 
                                alt={`Image ${index + 1}`}
                                className="mt-2 max-w-full h-auto max-h-32 object-contain border rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Không có hình ảnh nào</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chọn một bài viết để xem dữ liệu tách riêng
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cách thức hoạt động</CardTitle>
            <CardDescription>
              Hệ thống tự động tách riêng content và image khi tạo bài viết mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Tổng quan
                </h4>
                <p className="text-sm text-muted-foreground">
                  Hiển thị thống kê tổng quan về content, text và hình ảnh trong bài viết
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  Text View
                </h4>
                <p className="text-sm text-muted-foreground">
                  Hiển thị nội dung văn bản được format, bỏ qua hình ảnh và video
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4 text-purple-500" />
                  Image URLs
                </h4>
                <p className="text-sm text-muted-foreground">
                  Danh sách tất cả URL hình ảnh được trích xuất từ content, lưu dưới dạng JSON
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Panel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Thống kê tách riêng</CardTitle>
            <CardDescription>
              Tình trạng tách riêng content và image của các bài viết
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-md text-center">
                <div className="text-2xl font-bold text-blue-500">{articles?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Tổng bài viết</p>
              </div>
              <div className="p-4 border rounded-md text-center">
                <div className="text-2xl font-bold text-green-500">
                  {articles?.filter((a: any) => a.textContent).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Đã tách riêng</p>
              </div>
              <div className="p-4 border rounded-md text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {articles?.reduce((total: number, article: any) => {
                    try {
                      const imageCount = article.imageUrls ? JSON.parse(article.imageUrls).length : 0;
                      return total + imageCount;
                    } catch {
                      return total;
                    }
                  }, 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Tổng hình ảnh</p>
              </div>
              <div className="p-4 border rounded-md text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {Math.round(((articles?.filter((a: any) => a.textContent).length || 0) / (articles?.length || 1)) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}