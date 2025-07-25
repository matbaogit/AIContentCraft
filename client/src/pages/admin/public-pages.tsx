import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface PublicPage {
  id: number;
  slug: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  metaDescription?: string;
  metaDescriptionEn?: string;
  isPublished: boolean;
  sortOrder: number;
  lastEditedBy?: number;
  createdAt: string;
  updatedAt: string;
}

interface PageFormData {
  slug: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  metaDescription: string;
  metaDescriptionEn: string;
  isPublished: boolean;
  sortOrder: number;
}

export default function PublicPagesAdmin() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PublicPage | null>(null);
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PageFormData>({
    slug: '',
    title: '',
    titleEn: '',
    content: '',
    contentEn: '',
    metaDescription: '',
    metaDescriptionEn: '',
    isPublished: true,
    sortOrder: 0
  });

  // Get all public pages
  const { data: pages, isLoading } = useQuery({
    queryKey: ['/api/admin/public-pages'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/public-pages');
      return response.data as PublicPage[];
    }
  });

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: PageFormData) => {
      return await apiRequest('/api/admin/public-pages', {
        method: 'POST',
        body: JSON.stringify(pageData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-pages'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Thành công",
        description: "Trang đã được tạo thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo trang",
        variant: "destructive",
      });
    }
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, pageData }: { id: number; pageData: Partial<PageFormData> }) => {
      return await apiRequest(`/api/admin/public-pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(pageData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-pages'] });
      setIsEditDialogOpen(false);
      setEditingPage(null);
      resetForm();
      toast({
        title: "Thành công",
        description: "Trang đã được cập nhật thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trang",
        variant: "destructive",
      });
    }
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/public-pages/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-pages'] });
      toast({
        title: "Thành công",
        description: "Trang đã được xóa thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa trang",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      titleEn: '',
      content: '',
      contentEn: '',
      metaDescription: '',
      metaDescriptionEn: '',
      isPublished: true,
      sortOrder: 0
    });
    setActiveTab('vi');
  };

  const handleEdit = (page: PublicPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      titleEn: page.titleEn || '',
      content: page.content,
      contentEn: page.contentEn || '',
      metaDescription: page.metaDescription || '',
      metaDescriptionEn: page.metaDescriptionEn || '',
      isPublished: page.isPublished,
      sortOrder: page.sortOrder
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa trang này?')) {
      deletePageMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, pageData: formData });
    } else {
      createPageMutation.mutate(formData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý trang công khai
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý các trang như chính sách bảo mật, điều khoản dịch vụ
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo trang mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo trang mới</DialogTitle>
              <DialogDescription>
                Tạo một trang công khai mới cho website
              </DialogDescription>
            </DialogHeader>
            <PageForm
              formData={formData}
              setFormData={setFormData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSubmit={handleSubmit}
              isLoading={createPageMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Danh sách trang công khai
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Cập nhật lần cuối</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages?.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                      /{page.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.isPublished ? "default" : "secondary"}>
                      {page.isPublished ? "Công khai" : "Nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell>{page.sortOrder}</TableCell>
                  <TableCell>{formatDate(page.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/${page.slug}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(page)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(page.id)}
                        disabled={deletePageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trang</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin trang công khai
            </DialogDescription>
          </DialogHeader>
          <PageForm
            formData={formData}
            setFormData={setFormData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSubmit={handleSubmit}
            isLoading={updatePageMutation.isPending}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PageFormProps {
  formData: PageFormData;
  setFormData: (data: PageFormData) => void;
  activeTab: 'vi' | 'en';
  setActiveTab: (tab: 'vi' | 'en') => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isEdit?: boolean;
}

function PageForm({ formData, setFormData, activeTab, setActiveTab, onSubmit, isLoading, isEdit }: PageFormProps) {
  const updateField = (field: keyof PageFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="slug">URL Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            placeholder="privacy-policy"
            required
            disabled={isEdit}
          />
          <p className="text-xs text-gray-500 mt-1">
            URL sẽ là: /{formData.slug}
          </p>
        </div>
        <div>
          <Label htmlFor="sortOrder">Thứ tự sắp xếp</Label>
          <Input
            id="sortOrder"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => updateField('sortOrder', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublished"
          checked={formData.isPublished}
          onCheckedChange={(checked) => updateField('isPublished', checked)}
        />
        <Label htmlFor="isPublished">Công khai trang</Label>
      </div>

      {/* Language Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('vi')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vi'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tiếng Việt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'en'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            English
          </button>
        </nav>
      </div>

      {/* Vietnamese Content */}
      {activeTab === 'vi' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề (Tiếng Việt) *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Chính sách bảo mật"
              required
            />
          </div>
          <div>
            <Label htmlFor="metaDescription">Mô tả Meta (Tiếng Việt)</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => updateField('metaDescription', e.target.value)}
              placeholder="Mô tả ngắn cho SEO..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="content">Nội dung (Tiếng Việt) *</Label>
            <div className="mt-2">
              <ReactQuill
                value={formData.content}
                onChange={(value) => updateField('content', value)}
                placeholder="Nội dung trang..."
                style={{ height: '300px' }}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* English Content */}
      {activeTab === 'en' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="titleEn">Tiêu đề (English)</Label>
            <Input
              id="titleEn"
              value={formData.titleEn}
              onChange={(e) => updateField('titleEn', e.target.value)}
              placeholder="Privacy Policy"
            />
          </div>
          <div>
            <Label htmlFor="metaDescriptionEn">Mô tả Meta (English)</Label>
            <Textarea
              id="metaDescriptionEn"
              value={formData.metaDescriptionEn}
              onChange={(e) => updateField('metaDescriptionEn', e.target.value)}
              placeholder="Short description for SEO..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="contentEn">Nội dung (English)</Label>
            <div className="mt-2">
              <ReactQuill
                value={formData.contentEn}
                onChange={(value) => updateField('contentEn', value)}
                placeholder="Page content..."
                style={{ height: '300px' }}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-8">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo trang"}
        </Button>
      </div>
    </form>
  );
}