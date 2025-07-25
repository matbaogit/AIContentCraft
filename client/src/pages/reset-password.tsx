import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Head from "@/components/head";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .max(128, { message: "Mật khẩu không được quá 128 ký tự" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số" 
    }),
  confirmPassword: z.string()
    .min(1, { message: "Vui lòng xác nhận mật khẩu" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string>("");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Extract token from URL
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    
    if (!token) {
      setIsValidToken(false);
      return;
    }
    
    setResetToken(token);
    setIsValidToken(true);
  }, []);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!resetToken) {
      toast({
        title: "Lỗi",
        description: "Token đặt lại mật khẩu không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/reset-password", {
        token: resetToken,
        password: values.password,
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Thành công",
          description: "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
        });
        navigate("/auth");
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi đặt lại mật khẩu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidToken === null) {
    return (
      <>
        <Head>
          <title>Đặt lại mật khẩu - SEO AI Writer</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div>Đang kiểm tra...</div>
        </div>
      </>
    );
  }

  if (isValidToken === false) {
    return (
      <>
        <Head>
          <title>Đặt lại mật khẩu - SEO AI Writer</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-red-600">
                Liên kết không hợp lệ
              </CardTitle>
              <CardDescription className="text-center">
                Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    Yêu cầu đặt lại mật khẩu mới
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="ghost" className="w-full">
                    Quay lại đăng nhập
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Đặt lại mật khẩu - SEO AI Writer</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Đặt lại mật khẩu
            </CardTitle>
            <CardDescription className="text-center">
              Nhập mật khẩu mới cho tài khoản của bạn
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Nhập mật khẩu mới"
                          {...field}
                        />
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
                        <Input
                          type="password"
                          placeholder="Nhập lại mật khẩu mới"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <Link href="/auth">
                <Button variant="ghost" className="text-sm">
                  ← Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}