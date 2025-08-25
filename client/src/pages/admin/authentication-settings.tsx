import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Key, Mail, UserCheck, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/admin/Layout";

interface AuthSettings {
  enableUsernamePasswordAuth: boolean;
  enableZaloAuth: boolean;
  defaultAuthMethod: 'username_password' | 'zalo' | 'both';
  requireEmailVerification: boolean;
  allowGuestAccess: boolean;
}

export default function AuthenticationSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AuthSettings>({
    enableUsernamePasswordAuth: true,
    enableZaloAuth: true,
    defaultAuthMethod: 'both',
    requireEmailVerification: false,
    allowGuestAccess: false,
  });

  // Fetch current authentication settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/system-settings', 'authentication'],
    refetchOnWindowFocus: false,
  });

  // Update settings when data loads
  useEffect(() => {
    if (settingsData?.success && settingsData.data) {
      const authSettings = settingsData.data.filter((s: any) => s.category === 'authentication');
      const newSettings = { ...settings };
      
      authSettings.forEach((setting: any) => {
        switch (setting.key) {
          case 'enableUsernamePasswordAuth':
            newSettings.enableUsernamePasswordAuth = setting.value === 'true';
            break;
          case 'enableZaloAuth':
            newSettings.enableZaloAuth = setting.value === 'true';
            break;
          case 'defaultAuthMethod':
            newSettings.defaultAuthMethod = setting.value as 'username_password' | 'zalo' | 'both';
            break;
          case 'requireEmailVerification':
            newSettings.requireEmailVerification = setting.value === 'true';
            break;
          case 'allowGuestAccess':
            newSettings.allowGuestAccess = setting.value === 'true';
            break;
        }
      });
      
      setSettings(newSettings);
    }
  }, [settingsData]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const payload = [
        { key: 'enableUsernamePasswordAuth', value: settings.enableUsernamePasswordAuth.toString(), category: 'authentication' },
        { key: 'enableZaloAuth', value: settings.enableZaloAuth.toString(), category: 'authentication' },
        { key: 'defaultAuthMethod', value: settings.defaultAuthMethod, category: 'authentication' },
        { key: 'requireEmailVerification', value: settings.requireEmailVerification.toString(), category: 'authentication' },
        { key: 'allowGuestAccess', value: settings.allowGuestAccess.toString(), category: 'authentication' },
      ];

      return await apiRequest('/api/admin/system-settings/batch', 'PUT', payload);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt xác thực đã được cập nhật.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật cài đặt xác thực.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof AuthSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate();
  };

  if (isLoading) {
    return (
      <Layout title="Cài đặt xác thực">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Cài đặt xác thực">
      <div className="space-y-6">
        
        {/* Authentication Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Phương thức xác thực
            </CardTitle>
            <CardDescription>
              Cấu hình các phương thức đăng nhập và đăng ký có sẵn cho người dùng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Username/Password Auth */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <Label className="text-base">Đăng nhập bằng tài khoản</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cho phép người dùng đăng ký và đăng nhập bằng username/email và mật khẩu
                </p>
              </div>
              <Switch
                checked={settings.enableUsernamePasswordAuth}
                onCheckedChange={(value) => handleSettingChange('enableUsernamePasswordAuth', value)}
              />
            </div>

            <Separator />

            {/* Zalo Auth */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  <Label className="text-base">Đăng nhập bằng Zalo</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cho phép người dùng đăng nhập nhanh bằng tài khoản Zalo OAuth
                </p>
              </div>
              <Switch
                checked={settings.enableZaloAuth}
                onCheckedChange={(value) => handleSettingChange('enableZaloAuth', value)}
              />
            </div>

            <Separator />

            {/* Default Auth Method */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                <Label className="text-base">Phương thức mặc định</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Phương thức xác thực hiển thị đầu tiên trên trang đăng nhập
              </p>
              <Select
                value={settings.defaultAuthMethod}
                onValueChange={(value) => handleSettingChange('defaultAuthMethod', value as 'username_password' | 'zalo' | 'both')}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="username_password">Tài khoản/Mật khẩu</SelectItem>
                  <SelectItem value="zalo">Zalo OAuth</SelectItem>
                  <SelectItem value="both">Hiển thị cả hai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
          </CardContent>
        </Card>

        {/* Security & Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Bảo mật & Xác thực
            </CardTitle>
            <CardDescription>
              Cài đặt bảo mật và các yêu cầu xác thực bổ sung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Email Verification */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <Label className="text-base">Bắt buộc xác thực email</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Yêu cầu người dùng xác thực email trước khi sử dụng tài khoản (chỉ áp dụng cho tài khoản thường)
                </p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(value) => handleSettingChange('requireEmailVerification', value)}
                disabled={!settings.enableUsernamePasswordAuth}
              />
            </div>

            <Separator />

            {/* Guest Access */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <Label className="text-base">Cho phép truy cập khách</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cho phép người dùng truy cập một số tính năng mà không cần đăng nhập
                </p>
              </div>
              <Switch
                checked={settings.allowGuestAccess}
                onCheckedChange={(value) => handleSettingChange('allowGuestAccess', value)}
              />
            </div>
            
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="min-w-32"
          >
            {saveSettingsMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
        
      </div>
    </Layout>
  );
}