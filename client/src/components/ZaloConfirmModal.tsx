import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { Users, Gift, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

const confirmSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
});

type ConfirmFormValues = z.infer<typeof confirmSchema>;

interface ZaloConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  zaloData?: any;
  referralCode?: string;
  onSuccess: () => void;
}

export function ZaloConfirmModal({ 
  isOpen, 
  onClose, 
  zaloData: propZaloData, 
  referralCode,
  onSuccess 
}: ZaloConfirmModalProps) {
  const { toast } = useToast();
  const [referrerInfo, setReferrerInfo] = useState<any>(null);
  const [zaloData, setZaloData] = useState(propZaloData);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const form = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  // Enhanced data loading with retry mechanism
  const loadZaloData = async (attempt: number = 1) => {
    console.log(`Attempting to load Zalo data (attempt ${attempt}/${maxRetries})`);
    setIsLoadingData(true);
    setDataError(null);

    try {
      // Try multiple sources for data
      let data = propZaloData;
      
      if (!data) {
        // Try sessionStorage
        const sessionData = sessionStorage.getItem('zalo_oauth_data');
        if (sessionData) {
          try {
            data = JSON.parse(JSON.parse(sessionData));
            console.log('Loaded Zalo data from sessionStorage:', data);
          } catch (parseError) {
            console.error('Error parsing sessionStorage data:', parseError);
          }
        }
      }

      if (!data) {
        // Try localStorage as fallback
        const localData = localStorage.getItem('zalo_oauth_data');
        if (localData) {
          try {
            data = JSON.parse(localData);
            console.log('Loaded Zalo data from localStorage:', data);
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
          }
        }
      }

      if (!data) {
        // Try to fetch from server as last resort
        try {
          const response = await apiRequest('GET', '/api/auth/zalo/session-data');
          if (response.success && response.data) {
            data = response.data;
            console.log('Loaded Zalo data from server:', data);
          }
        } catch (serverError) {
          console.error('Error fetching from server:', serverError);
        }
      }

      if (data && data.userInfo) {
        // Check if data is expired (15 minutes)
        const isExpired = data.timestamp && (Date.now() - data.timestamp > 15 * 60 * 1000);
        if (isExpired) {
          console.log('Zalo data expired, clearing storage');
          sessionStorage.removeItem('zalo_oauth_data');
          localStorage.removeItem('zalo_oauth_data');
          throw new Error('Dữ liệu đăng nhập đã hết hạn');
        }

        setZaloData(data);
        
        // Pre-fill form with Zalo data
        if (data.userInfo?.name) {
          form.setValue('fullName', data.userInfo.name);
        }
        
        setIsLoadingData(false);
        return true;
      } else {
        throw new Error('Không tìm thấy dữ liệu Zalo hợp lệ');
      }
    } catch (error: any) {
      console.error(`Load attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Retry after delay
        setTimeout(() => {
          setRetryCount(attempt);
          loadZaloData(attempt + 1);
        }, 1000 * attempt); // Exponential backoff
      } else {
        setDataError(error.message || 'Không thể tải dữ liệu đăng nhập');
        setIsLoadingData(false);
      }
      return false;
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && !zaloData) {
      loadZaloData();
    }
  }, [isOpen, propZaloData]);

  // Update data when prop changes
  useEffect(() => {
    if (propZaloData) {
      setZaloData(propZaloData);
      if (propZaloData.userInfo?.name) {
        form.setValue('fullName', propZaloData.userInfo.name);
      }
    }
  }, [propZaloData, form]);

  // Fetch referrer info if referral code exists
  useEffect(() => {
    if (referralCode && isOpen) {
      fetch(`/api/referral/info/${referralCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setReferrerInfo(data.data);
          }
        })
        .catch(error => {
          console.error('Error fetching referrer info:', error);
        });
    }
  }, [referralCode, isOpen]);

  const createUserMutation = useMutation({
    mutationFn: async (data: ConfirmFormValues) => {
      if (!zaloData) {
        throw new Error('Không có dữ liệu Zalo để xử lý');
      }

      return apiRequest('/api/zalo-user/create', 'POST', {
        zaloUser: {
          ...zaloData.userInfo,
          name: data.fullName,
          email: data.email || null,
        },
        accessToken: zaloData.token?.access_token,
        referralCode: referralCode || null,
      });
    },
    onSuccess: (response) => {
      // Clear all stored data
      sessionStorage.removeItem('zalo_oauth_data');
      localStorage.removeItem('zalo_oauth_data');
      
      toast({
        title: "Đăng ký thành công!",
        description: response.message || "Chào mừng bạn đến với ToolBox!",
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đăng ký",
        description: error.message || "Có lỗi xảy ra khi tạo tài khoản.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfirmFormValues) => {
    createUserMutation.mutate(data);
  };

  const handleRetry = () => {
    setDataError(null);
    setRetryCount(0);
    loadZaloData();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Xác nhận thông tin tài khoản</DialogTitle>
        </DialogHeader>

        {/* Loading State */}
        {isLoadingData && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Đang tải dữ liệu đăng nhập... 
              {retryCount > 0 && ` (Lần thử ${retryCount + 1}/${maxRetries})`}
            </p>
          </div>
        )}

        {/* Error State */}
        {dataError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{dataError}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {zaloData && !isLoadingData && !dataError && (
          <>
            {/* Zalo Info Card */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Thông tin từ Zalo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  {zaloData.userInfo?.picture?.data?.url && (
                    <img 
                      src={zaloData.userInfo.picture.data.url} 
                      alt="Zalo Avatar" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{zaloData.userInfo?.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {zaloData.userInfo?.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Info */}
            {referralCode && referrerInfo && (
              <Card className="mb-4 border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Được giới thiệu bởi</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">{referrerInfo.fullName}</p>
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      +10 credits bonus
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nhập họ và tên của bạn" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (tùy chọn)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Nhập email để nhận thông báo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1"
                    disabled={createUserMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Tạo tài khoản"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}