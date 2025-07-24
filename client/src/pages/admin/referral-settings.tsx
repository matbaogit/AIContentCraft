import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Gift, Users, Settings } from "lucide-react";
import Layout from "@/components/admin/Layout";

interface ReferralSettings {
  referrer_credit_reward: number;
  referred_credit_reward: number;
  referral_system_enabled: boolean;
}

export default function ReferralSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ReferralSettings>({
    referrer_credit_reward: 50,
    referred_credit_reward: 20,
    referral_system_enabled: true,
  });

  // Fetch current referral settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/referral-settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/referral-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Failed to fetch referral settings');
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: ReferralSettings) => {
      const res = await apiRequest('PUT', '/api/admin/referral-settings', newSettings);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt hệ thống giới thiệu đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referral-settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ReferralSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cấu hình hệ thống giới thiệu</h1>
          <p className="text-muted-foreground">
            Quản lý phần thưởng và cài đặt cho hệ thống giới thiệu người dùng
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Trạng thái hệ thống
              </CardTitle>
              <CardDescription>
                Bật/tắt tính năng hệ thống giới thiệu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Kích hoạt hệ thống giới thiệu</Label>
                  <div className="text-sm text-muted-foreground">
                    Cho phép người dùng tạo mã giới thiệu và nhận phần thưởng
                  </div>
                </div>
                <Switch
                  checked={settings.referral_system_enabled}
                  onCheckedChange={(checked) => handleInputChange('referral_system_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reward Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Cài đặt phần thưởng
              </CardTitle>
              <CardDescription>
                Cấu hình số tín dụng thưởng cho mỗi lần giới thiệu thành công
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referrer-reward">Phần thưởng cho người giới thiệu</Label>
                <Input
                  id="referrer-reward"
                  type="number"
                  min="0"
                  value={settings.referrer_credit_reward}
                  onChange={(e) => handleInputChange('referrer_credit_reward', parseInt(e.target.value) || 0)}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Số tín dụng người giới thiệu sẽ nhận được khi có người đăng ký thành công
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referred-reward">Phần thưởng cho người được giới thiệu</Label>
                <Input
                  id="referred-reward"
                  type="number"
                  min="0"
                  value={settings.referred_credit_reward}
                  onChange={(e) => handleInputChange('referred_credit_reward', parseInt(e.target.value) || 0)}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Số tín dụng người được giới thiệu sẽ nhận được khi đăng ký thành công
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Xem trước cấu hình
            </CardTitle>
            <CardDescription>
              Tóm tắt cài đặt hiện tại của hệ thống giới thiệu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Trạng thái hệ thống</p>
                <p className={`text-lg font-bold ${settings.referral_system_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {settings.referral_system_enabled ? 'Đang hoạt động' : 'Tạm ngừng'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Phần thưởng người giới thiệu</p>
                <p className="text-lg font-bold text-blue-600">
                  +{settings.referrer_credit_reward} tín dụng
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Phần thưởng người được giới thiệu</p>
                <p className="text-lg font-bold text-purple-600">
                  +{settings.referred_credit_reward} tín dụng
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="min-w-[120px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu cài đặt
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}