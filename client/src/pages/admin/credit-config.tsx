import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CreditConfig {
  contentGeneration: {
    short: number;
    medium: number;
    long: number;
    extraLong: number;
  };
  imageGeneration: {
    perImage: number;
  };
  socialContent: {
    perGeneration: number;
  };
  aiModels: {
    chatgpt: number;
    gemini: number;
    claude: number;
  };
}

const defaultConfig: CreditConfig = {
  contentGeneration: {
    short: 1,
    medium: 3,
    long: 5,
    extraLong: 8
  },
  imageGeneration: {
    perImage: 2
  },
  socialContent: {
    perGeneration: 5
  },
  aiModels: {
    chatgpt: 1,
    gemini: 1,
    claude: 2
  }
};

export default function AdminCreditConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CreditConfig>(defaultConfig);

  // Fetch current credit configuration
  const { data: creditConfigData, isLoading } = useQuery({
    queryKey: ['/api/admin/credit-config'],
    select: (response: any) => {
      const configData = response?.data?.config;
      if (configData) {
        try {
          return typeof configData === 'string' ? JSON.parse(configData) : configData;
        } catch (error) {
          console.error('Error parsing credit config:', error);
          return defaultConfig;
        }
      }
      return defaultConfig;
    }
  });

  // Update local state when data loads
  useEffect(() => {
    if (creditConfigData) {
      setConfig(creditConfigData);
    }
  }, [creditConfigData]);

  // Save credit configuration
  const saveMutation = useMutation({
    mutationFn: async (newConfig: CreditConfig) => {
      return apiRequest('/api/admin/credit-config', {
        method: 'POST',
        body: JSON.stringify({ config: newConfig })
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cấu hình tín dụng đã được lưu",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credit-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lưu cấu hình",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  const updateConfig = (path: string, value: number) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    let current = newConfig as any;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setConfig(newConfig);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Cấu hình tín dụng</h1>
      </div>
      
      <p className="text-muted-foreground">
        Cấu hình số tín dụng sẽ tiêu hao cho các hoạt động khác nhau trong hệ thống.
      </p>

      <div className="grid gap-6">
        {/* Content Generation Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Tạo nội dung bài viết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="content-short">Nội dung ngắn (500 từ)</Label>
                <Input
                  id="content-short"
                  type="number"
                  min="1"
                  value={config.contentGeneration.short}
                  onChange={(e) => updateConfig('contentGeneration.short', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="content-medium">Nội dung trung bình (1000 từ)</Label>
                <Input
                  id="content-medium"
                  type="number"
                  min="1"
                  value={config.contentGeneration.medium}
                  onChange={(e) => updateConfig('contentGeneration.medium', parseInt(e.target.value) || 2)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="content-long">Nội dung dài (1500 từ)</Label>
                <Input
                  id="content-long"
                  type="number"
                  min="1"
                  value={config.contentGeneration.long}
                  onChange={(e) => updateConfig('contentGeneration.long', parseInt(e.target.value) || 3)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="content-extra-long">Nội dung rất dài (2000+ từ)</Label>
                <Input
                  id="content-extra-long"
                  type="number"
                  min="1"
                  value={config.contentGeneration.extraLong}
                  onChange={(e) => updateConfig('contentGeneration.extraLong', parseInt(e.target.value) || 4)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Models Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Sử dụng mô hình AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="model-chatgpt">ChatGPT</Label>
                <Input
                  id="model-chatgpt"
                  type="number"
                  min="1"
                  value={config.aiModels.chatgpt}
                  onChange={(e) => updateConfig('aiModels.chatgpt', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="model-gemini">Gemini</Label>
                <Input
                  id="model-gemini"
                  type="number"
                  min="1"
                  value={config.aiModels.gemini}
                  onChange={(e) => updateConfig('aiModels.gemini', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="model-claude">Claude</Label>
                <Input
                  id="model-claude"
                  type="number"
                  min="1"
                  value={config.aiModels.claude}
                  onChange={(e) => updateConfig('aiModels.claude', parseInt(e.target.value) || 2)}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Số tín dụng bổ sung cho mỗi lần sử dụng mô hình AI cụ thể
            </p>
          </CardContent>
        </Card>

        {/* Image Generation Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Tạo hình ảnh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image-per-image">Tín dụng cho mỗi hình ảnh</Label>
                <Input
                  id="image-per-image"
                  type="number"
                  min="1"
                  value={config.imageGeneration.perImage}
                  onChange={(e) => updateConfig('imageGeneration.perImage', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Số tín dụng tiêu hao cho mỗi hình ảnh được tạo trong bài viết
            </p>
          </CardContent>
        </Card>

        {/* Social Content Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Nội dung mạng xã hội</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="social-generation">Tín dụng mỗi lần tạo content social</Label>
              <Input
                id="social-generation"
                type="number"
                min="1"
                value={config.socialContent.perGeneration}
                onChange={(e) => updateConfig('socialContent.perGeneration', parseInt(e.target.value) || 5)}
                className="mt-1 max-w-xs"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Áp dụng cho tất cả các platform (Facebook, LinkedIn, Twitter, Instagram)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="flex items-center gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>
      </div>
    </div>
  );
}