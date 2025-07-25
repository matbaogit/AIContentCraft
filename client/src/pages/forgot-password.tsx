import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
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

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, { message: "Email là bắt buộc" })
    .email({ message: "Vui lòng nhập email hợp lệ" })
    .max(100, { message: "Email không được quá 100 ký tự" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/forgot-password", values);
      const data = await response.json();
      
      if (data.success) {
        setIsSubmitted(true);
        toast({
          title: "Thành công",
          description: data.message || "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.",
        });
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi gửi yêu cầu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Quên mật khẩu - SEO AI Writer</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Quên mật khẩu
            </CardTitle>
            <CardDescription className="text-center">
              {isSubmitted 
                ? "Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn"
                : "Nhập email để nhận hướng dẫn đặt lại mật khẩu"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!isSubmitted ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Nhập địa chỉ email của bạn"
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
                    {isSubmitting ? "Đang gửi..." : "Gửi hướng dẫn"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-green-600 dark:text-green-400">
                  ✓ Email đã được gửi thành công
                </div>
                <p className="text-sm text-muted-foreground">
                  Kiểm tra hộp thư (bao gồm cả thư mục spam) và nhấp vào liên kết trong email để đặt lại mật khẩu.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    form.reset();
                  }}
                >
                  Gửi lại email
                </Button>
              </div>
            )}
            
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