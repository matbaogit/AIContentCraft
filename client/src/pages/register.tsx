import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, UserPlus, Users, Gift } from "lucide-react";

const registerSchema = z.object({
  fullName: z.string()
    .min(2, { message: "Họ tên phải có ít nhất 2 ký tự" })
    .max(50, { message: "Họ tên không được quá 50 ký tự" })
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, { message: "Họ tên chỉ được chứa chữ cái và khoảng trắng" }),
  email: z.string()
    .min(1, { message: "Email là bắt buộc" })
    .email({ message: "Vui lòng nhập email hợp lệ" })
    .max(100, { message: "Email không được quá 100 ký tự" }),
  password: z.string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .max(128, { message: "Mật khẩu không được quá 128 ký tự" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số" 
    }),
  confirmPassword: z.string()
    .min(1, { message: "Vui lòng xác nhận mật khẩu" }),
  terms: z.boolean()
    .refine((val) => val === true, {
      message: "Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật",
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [location, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Get referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      // Store in sessionStorage for Zalo OAuth flow
      sessionStorage.setItem('referralCode', refCode);
    }
  }, [location]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      // Check if user clicked their own referral link
      if (referralCode && user.referralCode === referralCode) {
        toast({
          title: "Thông báo",
          description: "Bạn không thể tự giới thiệu chính mình 😄",
          variant: "default",
        });
      } else {
        toast({
          title: "Thông báo", 
          description: "Bạn đã có tài khoản rồi!",
          variant: "default",
        });
      }
      navigate('/dashboard');
    }
  }, [user, authLoading, referralCode, navigate, toast]);

  // Fetch referrer info
  const { data: referrerInfo, isLoading: referrerLoading } = useQuery({
    queryKey: ['/api/referral/info', referralCode],
    enabled: !!referralCode,
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/register', 'POST', data);
    },
    onSuccess: (response: any) => {
      if (response && typeof response === 'object' && response.message && 
          typeof response.message === 'string' && response.message.includes('verification')) {
        setRegistrationSuccess(true);
        setRegistrationEmail(form.getValues('email'));
        toast({
          title: "Đăng ký thành công!",
          description: "Chúng tôi đã gửi email xác thực đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.",
        });
      } else {
        // Direct login after registration
        toast({
          title: "Đăng ký thành công!",
          description: referralCode ? "Cảm ơn bạn đã tham gia ToolBox qua lời giới thiệu!" : "Chào mừng bạn đến với ToolBox!",
        });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đăng ký",
        description: error.message || "Có lỗi xảy ra trong quá trình đăng ký.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    if (!data.terms) {
      toast({
        title: "Lỗi đăng ký",
        description: "Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục đăng ký.",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate({
      username: data.email,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      referralCode: referralCode || undefined,
    });
  };

  const handleZaloRegister = () => {
    // Store referral code for Zalo callback
    if (referralCode) {
      sessionStorage.setItem('referralCode', referralCode);
    }
    window.location.href = '/api/auth/zalo';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">Đăng ký thành công!</CardTitle>
            <CardDescription>
              Chúng tôi đã gửi email xác thực đến <strong>{registrationEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vui lòng kiểm tra hộp thư của bạn và nhấp vào liên kết xác thực để kích hoạt tài khoản.
            </p>
            <Link href="/auth">
              <Button variant="outline" className="w-full">
                Quay lại trang đăng nhập
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng ký tài khoản</CardTitle>
          <CardDescription>
            Tạo tài khoản mới để sử dụng ToolBox
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Referral Info */}
          {referralCode && referrerInfo && !referrerLoading && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <Gift className="h-4 w-4" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>🎉 Bạn được {(referrerInfo as any)?.data?.fullName || (referrerInfo as any)?.data?.username} giới thiệu!</strong>
                <br />
                Bạn sẽ nhận được phần quà chào mừng khi đăng ký thành công.
              </AlertDescription>
            </Alert>
          )}

          {referralCode && referrerLoading && (
            <Alert>
              <AlertDescription>
                Đang kiểm tra thông tin giới thiệu...
              </AlertDescription>
            </Alert>
          )}

          {referralCode && !referrerInfo && !referrerLoading && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Mã giới thiệu không hợp lệ. Bạn vẫn có thể đăng ký bình thường.
              </AlertDescription>
            </Alert>
          )}

          {/* Zalo Register Button */}
          <Button
            onClick={handleZaloRegister}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Users className="w-5 h-5 mr-2" />
            Đăng ký bằng Zalo
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">hoặc</span>
            </div>
          </div>

          {/* Traditional Register Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập họ và tên của bạn"
                        {...field} 
                      />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Nhập địa chỉ email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Nhập mật khẩu"
                          {...field} 
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Nhập lại mật khẩu"
                          {...field} 
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label className="text-sm">
                        Tôi đồng ý với{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                          Điều khoản dịch vụ
                        </Link>{" "}
                        và{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                          Chính sách bảo mật
                        </Link>
                      </Label>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Đăng ký tài khoản
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            Đã có tài khoản?{" "}
            <Link href="/auth" className="text-blue-600 hover:underline font-medium">
              Đăng nhập ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}