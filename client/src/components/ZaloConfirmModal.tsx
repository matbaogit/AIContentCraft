import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Gift } from "lucide-react";

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
  zaloData, 
  referralCode,
  onSuccess 
}: ZaloConfirmModalProps) {
  const { toast } = useToast();
  const [referrerInfo, setReferrerInfo] = useState<any>(null);

  const form = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      fullName: zaloData?.userInfo?.name || "",
      email: "",
    },
  });

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
      return apiRequest('/api/zalo-user/create', 'POST', {
        zaloUser: {
          ...zaloData?.userInfo,
          name: data.fullName,
          email: data.email || null,
        },
        accessToken: zaloData?.token?.access_token,
        referralCode: referralCode || null,
      });
    },
    onSuccess: (response) => {
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

  if (!isOpen || !zaloData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Xác nhận thông tin đăng ký
          </DialogTitle>
          <DialogDescription>
            Hoàn tất thông tin để tạo tài khoản ToolBox từ Zalo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Referral Info */}
          {referralCode && referrerInfo && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <Gift className="h-4 w-4" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>🎉 Bạn được {referrerInfo.fullName || referrerInfo.username} giới thiệu!</strong>
                <br />
                Bạn sẽ nhận được 10 credits chào mừng khi đăng ký thành công.
              </AlertDescription>
            </Alert>
          )}

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
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="Nhập email để nhận thông báo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground">
                <p>Thông tin từ Zalo:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Tên: {zaloData.userInfo?.name}</li>
                  <li>Zalo ID: {zaloData.userInfo?.id}</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                  className="flex-1"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo tài khoản"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}