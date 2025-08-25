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
    
    if (!/(?=.*[a-z])/.test(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one lowercase letter",
        path: ["newPassword"],
      });
    }
    
    if (!/(?=.*[A-Z])/.test(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one uppercase letter",
        path: ["newPassword"],
      });
    }
    
    if (!/(?=.*\d)/.test(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one number",
        path: ["newPassword"],
      });
    }
    
    if (!/(?=.*[@$!%*?&])/.test(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain at least one special character (@$!%*?&)",
        path: ["newPassword"],
      });
    }
    
    // Confirm password match
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  }
});

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });

  // Check if user is from Zalo (has zaloId but no email)
  const isZaloUser = user?.zaloId && !user?.email;

  // Unified form
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: user?.fullName || user?.firstName || "",
      email: user?.email || "",
      newPassword: "",
      confirmPassword: "",
      language: language as "vi" | "en",
      emailNotifications: true, // Default value
    },
  });

  // Watch password field for strength validation
  const newPassword = form.watch("newPassword");

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");

    if (/(?=.*[a-z])/.test(password)) score += 1;
    else feedback.push("One lowercase letter");

    if (/(?=.*[A-Z])/.test(password)) score += 1;
    else feedback.push("One uppercase letter");

    if (/(?=.*\d)/.test(password)) score += 1;
    else feedback.push("One number");

    if (/(?=.*[@$!%*?&])/.test(password)) score += 1;
    else feedback.push("One special character");

    return { score, feedback };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (newPassword && newPassword.length > 0) {
      const strength = checkPasswordStrength(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [newPassword]);

  // Unified settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof settingsSchema>) => {
      const res = await apiRequest("PATCH", "/api/dashboard/settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Update language if changed
      if (data.language && data.language !== language) {
        setLanguage(data.language);
      }
      
      toast({
        title: "Settings updated",
        description: "Your settings have been updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Reset password fields after successful update
      form.setValue("newPassword", "");
      form.setValue("confirmPassword", "");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
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
        <title>Settings - ToolBox</title>
      </Head>
      
      <DashboardLayout title="Settings">
        <div className="max-w-4xl mx-auto space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Profile Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            disabled={isZaloUser}
                          />
                        </FormControl>
                        {isZaloUser && (
                          <FormDescription className="text-amber-600 dark:text-amber-400">
                            This account is linked to Zalo and doesn't have an email address.
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
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password (Optional)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Leave empty to keep current password" {...field} />
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
                                  ? "Weak"
                                  : passwordStrength.score <= 4
                                  ? "Medium"
                                  : "Strong"}
                              </span>
                            </div>
                            {passwordStrength.feedback.length > 0 && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p>Password requirements:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {passwordStrength.feedback.map((item, index) => (
                                    <li key={index} className="flex items-center space-x-2">
                                      <AlertCircle className="h-3 w-3 text-orange-500" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
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
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm your new password"
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
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
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
                            Email Notifications
                          </FormLabel>
                          <FormDescription>
                            Receive email notifications about important updates and changes.
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
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
              
            </form>
          </Form>
        </div>
      </DashboardLayout>
    </>
  );
}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {t("dashboard.settings.profile.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                      <div className="shrink-0">
                        <img
                          className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                          src={user?.avatar || user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=6366f1&color=ffffff`}
                          alt="Avatar"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={async () => {
                              const res = await apiRequest("POST", "/api/objects/upload");
                              const data = await res.json();
                              return {
                                method: "PUT" as const,
                                url: data.uploadURL,
                              };
                            }}
                            onComplete={(result) => {
                              if (result.successful && result.successful.length > 0) {
                                const uploadUrl = result.successful[0].uploadURL as string;
                                uploadAvatarMutation.mutate(uploadUrl);
                              }
                            }}
                            buttonClassName="flex items-center space-x-2"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Change avatar</span>
                          </ObjectUploader>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            JPG, PNG up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dashboard.settings.profile.fullName")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dashboard.settings.profile.email")}</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                      >
                        {updateProfileMutation.isPending ? t("common.loading") : t("dashboard.settings.profile.save")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyRound className="h-5 w-5 mr-2" />
                  {t("dashboard.settings.password.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dashboard.settings.password.current")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dashboard.settings.password.new")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dashboard.settings.password.confirm")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? t("common.loading") : t("dashboard.settings.password.update")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Languages className="h-5 w-5 mr-2" />
                  {t("dashboard.settings.preferences.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...preferencesForm}>
                  <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                    <FormField
                      control={preferencesForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dashboard.settings.preferences.language")}</FormLabel>
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
                              <SelectItem value="vi">
                                {t("dashboard.settings.preferences.languages.vietnamese")}
                              </SelectItem>
                              <SelectItem value="en">
                                {t("dashboard.settings.preferences.languages.english")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dashboard.settings.preferences.theme")}</FormLabel>
                          <div className="space-y-4">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light" className="flex items-center">
                                  <div className="flex items-center">
                                    <Sun className="h-4 w-4 mr-2 text-amber-500" />
                                    {t("dashboard.settings.preferences.themes.light")}
                                  </div>
                                </SelectItem>
                                <SelectItem value="dark">
                                  <div className="flex items-center">
                                    <Moon className="h-4 w-4 mr-2 text-indigo-400" />
                                    {t("dashboard.settings.preferences.themes.dark")}
                                  </div>
                                </SelectItem>
                                <SelectItem value="system">
                                  <div className="flex items-center">
                                    <Monitor className="h-4 w-4 mr-2 text-slate-400" />
                                    {t("dashboard.settings.preferences.themes.system")}
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => field.onChange("light")}
                                className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                                  field.value === "light" 
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                                }`}
                              >
                                <Sun className="h-6 w-6 mb-1 text-amber-500" />
                                <span className="text-xs font-medium">
                                  {t("dashboard.settings.preferences.themes.light")}
                                </span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => field.onChange("dark")}
                                className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                                  field.value === "dark" 
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                                }`}
                              >
                                <Moon className="h-6 w-6 mb-1 text-indigo-400" />
                                <span className="text-xs font-medium">
                                  {t("dashboard.settings.preferences.themes.dark")}
                                </span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => field.onChange("system")}
                                className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                                  field.value === "system" 
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                                }`}
                              >
                                <Monitor className="h-6 w-6 mb-1 text-slate-400" />
                                <span className="text-xs font-medium">
                                  {t("dashboard.settings.preferences.themes.system")}
                                </span>
                              </button>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!preferencesForm.formState.isDirty}
                      >
                        {t("dashboard.settings.preferences.save")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              
              <CardHeader className="mt-4">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Two-factor authentication</h3>
                      <p className="text-sm text-secondary-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Set up</Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Active sessions</h3>
                      <p className="text-sm text-secondary-500">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline">View</Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Login history</h3>
                      <p className="text-sm text-secondary-500">
                        View your recent login activity
                      </p>
                    </div>
                    <Button variant="outline">View history</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </>
  );
}
