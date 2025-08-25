import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  User,
  KeyRound,
  Languages,
  Bell,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Head from "@/components/head";

// Unified settings schema
const settingsSchema = z.object({
  // Profile
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }).optional().or(z.literal("")),
  
  // Password (optional - only if user wants to change)
  newPassword: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
  
  // Preferences
  language: z.enum(["vi", "en"]),
  emailNotifications: z.boolean(),
}).superRefine((data, ctx) => {
  // Password validation only if newPassword is provided
  if (data.newPassword && data.newPassword.length > 0) {
    // Strong password validation
    if (data.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters long",
        path: ["newPassword"],
      });
    }
    
    if (!/[a-z]/.tessafeT(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one lowercase letter",
        path: ["newPassword"],
      });
    }
    
    if (!/[A-Z]/.tessafeT(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one uppercase letter",
        path: ["newPassword"],
      });
    }
    
    if (!/[0-9]/.tessafeT(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one number",
        path: ["newPassword"],
      });
    }
    
    if (!/[^a-zA-Z0-9]/.tessafeT(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one special character",
        path: ["newPassword"],
      });
    }
    
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  }
});

function Settings() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToassafeT();
  
  // Debug: Log the t function and translations
  console.log('Settings page - t function:', t);
  console.log('Settings page - language:', language);
  console.log('Settings page - title translation:', safeT('userSettings.title'));
  console.log('Settings page - profileInformation translation:', safeT('userSettings.profileInformation'));
  
  // Create a safe translation function
  const safeT = (key: string) => {
    if (!t) {
      // Fallback translations based on language
      const translations: Record<string, Record<string, string>> = {
        vi: {
          'userSettings.title': 'Cài đặt',
          'userSettings.profileInformation': 'Thông tin cá nhân',
          'userSettings.security': 'Bảo mật',
          'userSettings.preferences': 'Tùy chọn',
          'userSettings.fullName': 'Tên đầy đủ',
          'userSettings.email': 'Email',
          'userSettings.newPassword': 'Mật khẩu mới (Tùy chọn)',
          'userSettings.newPasswordPlaceholder': 'Để trống để giữ mật khẩu hiện tại',
          'userSettings.confirmPassword': 'Xác nhận mật khẩu mới',
          'userSettings.confirmPasswordPlaceholder': 'Xác nhận mật khẩu mới của bạn',
          'userSettings.language': 'Ngôn ngữ',
          'userSettings.emailNotifications': 'Thông báo Email',
          'userSettings.emailNotificationsDesc': 'Nhận thông báo email về các cập nhật và thay đổi quan trọng.',
          'userSettings.saveChanges': 'Lưu thay đổi',
          'userSettings.saving': 'Đang lưu...',
          'userSettings.zaloUserNote': 'Tài khoản này được liên kết với Zalo và không có địa chỉ email.',
          'userSettings.passwordRequirements': 'Yêu cầu mật khẩu:',
          'userSettings.passwordWeak': 'Yếu',
          'userSettings.passwordMedium': 'Trung bình',
          'userSettings.passwordStrong': 'Mạnh',
          'userSettings.requirementMinLength': 'Ít nhất 8 ký tự',
          'userSettings.requirementLowercase': 'Một chữ thường',
          'userSettings.requirementUppercase': 'Một chữ hoa',
          'userSettings.requirementNumber': 'Một số',
          'userSettings.requirementSpecial': 'Một ký tự đặc biệt',
          'common.appName': 'ToolBox'
        },
        en: {
          'userSettings.title': 'Settings',
          'userSettings.profileInformation': 'Profile Information',
          'userSettings.security': 'Security',
          'userSettings.preferences': 'Preferences',
          'userSettings.fullName': 'Full Name',
          'userSettings.email': 'Email',
          'userSettings.newPassword': 'New Password (Optional)',
          'userSettings.newPasswordPlaceholder': 'Leave empty to keep current password',
          'userSettings.confirmPassword': 'Confirm New Password',
          'userSettings.confirmPasswordPlaceholder': 'Confirm your new password',
          'userSettings.language': 'Language',
          'userSettings.emailNotifications': 'Email Notifications',
          'userSettings.emailNotificationsDesc': 'Receive email notifications about important updates and changes.',
          'userSettings.saveChanges': 'Save Changes',
          'userSettings.saving': 'Saving...',
          'userSettings.zaloUserNote': 'This account is linked to Zalo and doesn\'t have an email address.',
          'userSettings.passwordRequirements': 'Password requirements:',
          'userSettings.passwordWeak': 'Weak',
          'userSettings.passwordMedium': 'Medium',
          'userSettings.passwordStrong': 'Strong',
          'userSettings.requirementMinLength': 'At least 8 characters',
          'userSettings.requirementLowercase': 'One lowercase letter',
          'userSettings.requirementUppercase': 'One uppercase letter',
          'userSettings.requirementNumber': 'One number',
          'userSettings.requirementSpecial': 'One special character',
          'common.appName': 'ToolBox'
        }
      };
      
      return translations[language as 'vi' | 'en']?.[key] || key;
    }
    return safeT(key);
  };
  
  // Check if user is from Zalo (no email address)
  const isZaloUser = !user?.email;

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: user?.fullName || user?.username || "",
      email: user?.email || "",
      newPassword: "",
      confirmPassword: "",
      language: language as "vi" | "en",
      emailNotifications: user?.emailNotifications ?? false,
    },
  });

  // Watch password field for strength validation
  const newPassword = form.watch("newPassword");

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    if (!password) return { score: 0, feedback: [] };
    
    const feedback = [];
    let score = 0;

    if (password.length < 8) feedback.push("At least 8 characters");
    else score++;

    if (!/[a-z]/.tessafeT(password)) feedback.push("One lowercase letter");
    else score++;

    if (!/[A-Z]/.tessafeT(password)) feedback.push("One uppercase letter");
    else score++;

    if (!/[0-9]/.tessafeT(password)) feedback.push("One number");
    else score++;

    if (!/[^a-zA-Z0-9]/.tessafeT(password)) feedback.push("One special character");
    else score++;

    return { score, feedback };
  };

  const passwordStrength = calculatePasswordStrength(newPassword || "");

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof settingsSchema>) => {
      const payload = {
        fullName: data.fullName,
        email: isZaloUser ? undefined : data.email,
        newPassword: data.newPassword || undefined,
        language: data.language,
        emailNotifications: data.emailNotifications,
      };
      
      return await apiRequessafeT('/api/dashboard/settings', 'PUT', payload);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Success!",
          description: "Settings updated successfully.",
        });
        
        // Update language if changed
        if (form.getValues('language') !== language) {
          setLanguage(form.getValues('language'));
        }
        
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        // Clear password fields
        form.setValue('newPassword', '');
        form.setValue('confirmPassword', '');
      }
    },
    onError: (error: any) => {
      console.error('Settings update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <>
      <Head>
        <title>{safeT('userSettings.title')} - {safeT('common.appName')}</title>
      </Head>
      
      <DashboardLayout title={safeT('userSettings.title')}>
        <div className="max-w-4xl mx-auto space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmisafeT(onSubmit)} className="space-y-8">
              
              {/* Profile Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {safeT('userSettings.profileInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{safeT('userSettings.fullName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>{safeT('userSettings.email')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            disabled={isZaloUser}
                          />
                        </FormControl>
                        {isZaloUser && (
                          <FormDescription className="text-amber-600 dark:text-amber-400">
                            {safeT('userSettings.zaloUserNote')}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    {safeT('userSettings.security')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{safeT('userSettings.newPassword')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={safeT('userSettings.newPasswordPlaceholder')} {...field} />
                        </FormControl>
                        {newPassword && newPassword.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2`}>
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    passwordStrength.score <= 2
                                      ? "bg-red-500"
                                      : passwordStrength.score <= 4
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {passwordStrength.score <= 2
                                  ? safeT('userSettings.passwordWeak')
                                  : passwordStrength.score <= 4
                                  ? safeT('userSettings.passwordMedium')
                                  : safeT('userSettings.passwordStrong')}
                              </span>
                            </div>
                            {passwordStrength.feedback.length > 0 && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p>{safeT('userSettings.passwordRequirements')}</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {passwordStrength.feedback.map((item, index) => {
                                    // Map English feedback to translations
                                    const feedbackMap: { [key: string]: string } = {
                                      "At least 8 characters": safeT('userSettings.requirementMinLength'),
                                      "One lowercase letter": safeT('userSettings.requirementLowercase'),
                                      "One uppercase letter": safeT('userSettings.requirementUppercase'),
                                      "One number": safeT('userSettings.requirementNumber'),
                                      "One special character": safeT('userSettings.requirementSpecial')
                                    };
                                    return (
                                      <li key={index} className="flex items-center space-x-2">
                                        <AlertCircle className="h-3 w-3 text-orange-500" />
                                        <span>{feedbackMap[item] || item}</span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{safeT('userSettings.confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={safeT('userSettings.confirmPasswordPlaceholder')}
                            disabled={!newPassword || newPassword.length === 0}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                </CardContent>
              </Card>

              {/* Preferences Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Languages className="h-5 w-5 mr-2" />
                    {safeT('userSettings.preferences')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{safeT('userSettings.language')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vi">Tiếng Việt</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center">
                            <Bell className="h-4 w-4 mr-2" />
                            {safeT('userSettings.emailNotifications')}
                          </FormLabel>
                          <FormDescription>
                            {safeT('userSettings.emailNotificationsDesc')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isZaloUser}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateSettingsMutation.isPending}
                  className="min-w-32"
                >
                  {updateSettingsMutation.isPending ? safeT('userSettings.saving') : safeT('userSettings.saveChanges')}
                </Button>
              </div>
              
            </form>
          </Form>
        </div>
      </DashboardLayout>
    </>
  );
}

export default Settings;