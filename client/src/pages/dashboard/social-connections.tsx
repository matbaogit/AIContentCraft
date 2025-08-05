import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Settings, CheckCircle, XCircle, Facebook, Twitter, Linkedin, Instagram, Globe, Edit, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { FacebookConnectionWizard } from "@/components/facebook/FacebookConnectionWizard";
import { useDbTranslations } from "@/hooks/use-db-translations";

interface Connection {
  id: number;
  platform: string;
  accountName: string;
  accountId: string;
  accessToken?: string;
  isActive: boolean;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

const platformConfig = {
  wordpress: {
    name: "WordPress",
    icon: Globe,
    color: "bg-blue-500",
    description: "Kết nối với website WordPress của bạn để tự động đăng bài viết"
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600",
    description: "Đăng bài viết lên trang Facebook Page"
  },
  twitter: {
    name: "Twitter",
    icon: Twitter,
    color: "bg-sky-500",
    description: "Chia sẻ nội dung ngắn gọn lên Twitter/X"
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-700",
    description: "Đăng bài viết chuyên nghiệp lên LinkedIn"
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "bg-pink-500",
    description: "Chia sẻ hình ảnh và nội dung lên Instagram"
  }
};

// Form states
interface ConnectionForm {
  platform: string;
  name: string;
  config: any;
}

export default function SocialConnections() {
  const { toast } = useToast();
  const { t } = useDbTranslations();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFacebookWizard, setShowFacebookWizard] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [form, setForm] = useState<ConnectionForm>({
    platform: '',
    name: '',
    config: {}
  });

  // Handle OAuth callback success/error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'facebook_connected') {
      toast({
        title: t('socialConnections.connectionSuccessful', 'Kết nối thành công'),
        description: t('socialConnections.connectionSuccessDescription', 'Tài khoản Facebook của bạn đã được kết nối thành công.'),
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      toast({
        title: "Lỗi kết nối",
        description: "Có lỗi xảy ra khi kết nối tài khoản. Vui lòng thử lại.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  // Fetch connections
  const { data: connectionsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/social-connections'],
    retry: false,
  });
  
  const connections = (connectionsResponse as any)?.data || [];

  // Create connection mutation
  const createMutation = useMutation({
    mutationFn: async (data: ConnectionForm) => {
      return await apiRequest('POST', '/api/social-connections', {
        type: data.platform,
        name: data.name,
        config: data.config
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-connections'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: t('common.success', 'Thành công'),
        description: t('socialConnections.connectionCreatedSuccess', 'Kết nối đã được tạo thành công.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo kết nối.",
        variant: "destructive",
      });
    },
  });

  // Update connection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Connection> }) => {
      return await apiRequest('PUT', `/api/social-connections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-connections'] });
      setShowEditDialog(false);
      setSelectedConnection(null);
      toast({
        title: t('common.success', 'Thành công'),
        description: t('socialConnections.connectionUpdatedSuccess', 'Kết nối đã được cập nhật thành công.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật kết nối.",
        variant: "destructive",
      });
    },
  });

  // Delete connection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/social-connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-connections'] });
      toast({
        title: t('common.success', 'Thành công'),
        description: t('socialConnections.connectionDeletedSuccess', 'Kết nối đã được xóa thành công.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xóa kết nối.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      platform: '',
      name: '',
      config: {}
    });
  };

  const handleFacebookOAuth = () => {
    setShowFacebookWizard(true);
  };

  const handleFacebookConnectionSaved = (connection: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/social-connections'] });
    toast({
      title: t('common.success', 'Thành công'),
      description: t('socialConnections.facebookConnectionSuccess', 'Kết nối Facebook đã được tạo thành công.'),
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.platform || !form.name) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(form);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection) return;
    
    updateMutation.mutate({
      id: selectedConnection.id,
      data: {
        platform: form.platform,
        accountName: form.name,
        settings: form.config
      }
    });
  };

  const handleEdit = (connection: Connection) => {
    setSelectedConnection(connection);
    setForm({
      platform: connection.platform,
      name: connection.accountName,
      config: connection.settings || {}
    });
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa kết nối này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (connection: Connection) => {
    updateMutation.mutate({
      id: connection.id,
      data: { isActive: !connection.isActive }
    });
  };



  // Available platforms to connect
  const availablePlatforms = Object.keys(platformConfig).filter(platform => 
    !Array.isArray(connections) || !connections.some((conn: Connection) => conn.platform === platform && conn.isActive)
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Đang tải kết nối...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('socialConnections.title', 'Kết nối mạng xã hội')}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('socialConnections.description', 'Quản lý kết nối với các nền tảng mạng xã hội và WordPress')}
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                {t('socialConnections.addConnection', 'Thêm kết nối')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('socialConnections.addNewConnection', 'Thêm kết nối mới')}</DialogTitle>
                <DialogDescription>
                  {t('socialConnections.addConnectionDesc', 'Kết nối với nền tảng mạng xã hội hoặc WordPress để tự động đăng bài viết')}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="platform">{t('socialConnections.platform', 'Nền tảng *')}</Label>
                  <Select value={form.platform} onValueChange={(value) => setForm({...form, platform: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('socialConnections.selectPlatform', 'Chọn nền tảng')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlatforms.map((platform) => {
                        const config = platformConfig[platform as keyof typeof platformConfig];
                        const Icon = config.icon;
                        return (
                          <SelectItem key={platform} value={platform}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {config.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="name">{t('socialConnections.connectionNameLabel', 'Tên kết nối*')}</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder={t('socialConnections.connectionNamePlaceholder', 'VD: Trang Facebook chính')}
                  />
                </div>
                
                {form.platform === 'facebook' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">{t('socialConnections.connectFacebook', 'Kết nối Facebook')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {t('socialConnections.facebookConnectDesc', 'Chọn phương thức kết nối Facebook phù hợp với bạn.')}
                    </p>
                    <Button 
                      type="button" 
                      onClick={() => setShowFacebookWizard(true)}
                      className="w-full"
                    >
                      <Facebook className="w-4 h-4 mr-2" />
                      {t('facebookWizard.title', 'Kết nối Facebook Pages')}
                    </Button>
                  </div>
                )}
                
                {form.platform === 'wordpress' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="websiteUrl">URL Website</Label>
                      <Input
                        id="websiteUrl"
                        value={form.config.websiteUrl || ''}
                        onChange={(e) => setForm({...form, config: {...form.config, websiteUrl: e.target.value}})}
                        placeholder="https://yoursite.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Tên đăng nhập</Label>
                      <Input
                        id="username"
                        value={form.config.username || ''}
                        onChange={(e) => setForm({...form, config: {...form.config, username: e.target.value}})}
                        placeholder="admin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="appPassword">Application Password</Label>
                      <Input
                        id="appPassword"
                        type="password"
                        value={form.config.appPassword || ''}
                        onChange={(e) => setForm({...form, config: {...form.config, appPassword: e.target.value}})}
                        placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    {t('common.cancel', 'Hủy')}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t('common.creating', 'Đang tạo...') : t('socialConnections.createConnection', 'Tạo kết nối')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Connect Section */}
        {availablePlatforms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('socialConnections.quickConnect', 'Kết nối nhanh')}</CardTitle>
              <CardDescription>
                {t('socialConnections.quickConnectDesc', 'Kết nối với các nền tảng phổ biến chỉ trong vài click')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {availablePlatforms.map((platform) => {
                  const config = platformConfig[platform as keyof typeof platformConfig];
                  const Icon = config.icon;
                  
                  return (
                    <Button
                      key={platform}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-3"
                      onClick={() => {
                        if (platform === 'facebook') {
                          handleFacebookOAuth();
                        } else {
                          setForm({...form, platform});
                          setShowCreateDialog(true);
                        }
                      }}
                    >
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">{config.name}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>{t('socialConnections.connectedAccounts', 'Tài khoản đã kết nối')}</CardTitle>
            <CardDescription>
              {t('socialConnections.manageConnections', 'Quản lý các kết nối hiện tại của bạn')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Chưa có kết nối nào
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Thêm kết nối đầu tiên để bắt đầu đăng bài tự động
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm kết nối đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {connections.map((connection: Connection) => {
                  const config = platformConfig[connection.platform as keyof typeof platformConfig];
                  const Icon = config?.icon || Globe;
                  
                  return (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${config?.color || 'bg-gray-500'} flex items-center justify-center text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {connection.accountName}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {config?.name || connection.platform}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {t('socialConnections.connections', 'Kết nối:')} {format(new Date(connection.createdAt), 'dd/MM/yyyy', { locale: vi })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={connection.isActive}
                            onCheckedChange={() => handleToggleActive(connection)}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {connection.isActive ? t('socialConnections.active', 'Hoạt động') : 'Tạm dừng'}
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(connection)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(connection.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('socialConnections.editConnection', 'Chỉnh sửa kết nối')}</DialogTitle>
              <DialogDescription>
                {t('socialConnections.editConnectionDesc', 'Cập nhật thông tin kết nối của bạn')}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">{t('socialConnections.connectionName', 'Tên kết nối')}</Label>
                <Input
                  id="edit-name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              
              {form.platform === 'wordpress' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-websiteUrl">URL Website</Label>
                    <Input
                      id="edit-websiteUrl"
                      value={form.config.websiteUrl || ''}
                      onChange={(e) => setForm({...form, config: {...form.config, websiteUrl: e.target.value}})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-username">Tên đăng nhập</Label>
                    <Input
                      id="edit-username"
                      value={form.config.username || ''}
                      onChange={(e) => setForm({...form, config: {...form.config, username: e.target.value}})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-appPassword">Application Password</Label>
                    <Input
                      id="edit-appPassword"
                      type="password"
                      value={form.config.appPassword || ''}
                      onChange={(e) => setForm({...form, config: {...form.config, appPassword: e.target.value}})}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  {t('common.cancel', 'Hủy')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Đang cập nhật...' : t('common.update', 'Cập nhật')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Facebook Connection Wizard */}
        <FacebookConnectionWizard
          isOpen={showFacebookWizard}
          onClose={() => setShowFacebookWizard(false)}
        />
      </div>
    </DashboardLayout>
  );
}