import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Edit, 
  Plus, 
  Trash2, 
  Save, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ExternalLink,
  GripVertical
} from "lucide-react";

const footerSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  sectionKey: z.string().min(1, "Section key is required"),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
});

const footerLinkSchema = z.object({
  label: z.string().min(1, "Label is required"),
  href: z.string().min(1, "URL is required"),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
});

const footerSocialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().min(1, "URL is required"),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
});

const footerSettingsSchema = z.object({
  description: z.string().optional(),
  copyrightText: z.string().optional()
});

type FooterSection = {
  id: number;
  sectionKey: string;
  title: string;
  isActive: boolean;
  order: number;
  links?: FooterLink[];
};

type FooterLink = {
  id: number;
  sectionId: number;
  label: string;
  href: string;
  isActive: boolean;
  order: number;
};

type FooterSocialLink = {
  id: number;
  platform: string;
  url: string;
  isActive: boolean;
  order: number;
};

type FooterSettings = {
  id?: number;
  description?: string;
  copyrightText?: string;
};

export default function FooterManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [editingSocial, setEditingSocial] = useState<FooterSocialLink | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // Fetch footer data
  const { data: footerSections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/admin/footer/sections'],
  });

  const { data: footerLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['/api/admin/footer/links'],
  });

  const { data: socialLinks, isLoading: socialLoading } = useQuery({
    queryKey: ['/api/admin/footer/social'],
  });

  const { data: footerSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/footer/settings'],
  });

  // Section form
  const sectionForm = useForm({
    resolver: zodResolver(footerSectionSchema),
    defaultValues: {
      title: "",
      sectionKey: "",
      isActive: true,
      order: 0
    }
  });

  // Link form
  const linkForm = useForm({
    resolver: zodResolver(footerLinkSchema),
    defaultValues: {
      label: "",
      href: "",
      isActive: true,
      order: 0
    }
  });

  // Social form
  const socialForm = useForm({
    resolver: zodResolver(footerSocialLinkSchema),
    defaultValues: {
      platform: "",
      url: "",
      isActive: true,
      order: 0
    }
  });

  // Settings form
  const settingsForm = useForm({
    resolver: zodResolver(footerSettingsSchema),
    defaultValues: {
      description: footerSettings?.description || "",
      copyrightText: footerSettings?.copyrightText || ""
    }
  });

  // Mutations
  const updateSectionMutation = useMutation({
    mutationFn: (data: any) => 
      editingSection?.id 
        ? apiRequest(`/api/admin/footer/sections/${editingSection.id}`, 'PUT', data)
        : apiRequest('/api/admin/footer/sections', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/footer/sections'] });
      setEditingSection(null);
      sectionForm.reset();
      toast({ title: "Section saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateLinkMutation = useMutation({
    mutationFn: (data: any) => 
      editingLink?.id 
        ? apiRequest(`/api/admin/footer/links/${editingLink.id}`, 'PUT', data)
        : apiRequest('/api/admin/footer/links', 'POST', { ...data, sectionId: selectedSectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/footer/links'] });
      setEditingLink(null);
      linkForm.reset();
      toast({ title: "Link saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateSocialMutation = useMutation({
    mutationFn: (data: any) => 
      editingSocial?.id 
        ? apiRequest(`/api/admin/footer/social/${editingSocial.id}`, 'PUT', data)
        : apiRequest('/api/admin/footer/social', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/footer/social'] });
      setEditingSocial(null);
      socialForm.reset();
      toast({ title: "Social link saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/footer/settings', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/footer/settings'] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: string, id: number }) => 
      apiRequest(`/api/admin/footer/${type}/${id}`, 'DELETE'),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/footer/${variables.type}`] });
      toast({ title: "Deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Edit handlers
  const handleEditSection = (section: FooterSection) => {
    setEditingSection(section);
    sectionForm.reset({
      title: section.title,
      sectionKey: section.sectionKey,
      isActive: section.isActive,
      order: section.order
    });
  };

  const handleEditLink = (link: FooterLink) => {
    setEditingLink(link);
    linkForm.reset({
      label: link.label,
      href: link.href,
      isActive: link.isActive,
      order: link.order
    });
  };

  const handleEditSocial = (social: FooterSocialLink) => {
    setEditingSocial(social);
    socialForm.reset({
      platform: social.platform,
      url: social.url,
      isActive: social.isActive,
      order: social.order
    });
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (sectionsLoading || linksLoading || socialLoading || settingsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Footer Management</h1>
          <p className="text-muted-foreground">Manage footer content, links, and social media</p>
        </div>
      </div>

      <Tabs defaultValue="sections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Footer Sections */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Footer Sections</CardTitle>
                <CardDescription>Manage footer section headers</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingSection(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSection ? 'Edit Section' : 'Add New Section'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...sectionForm}>
                    <form onSubmit={sectionForm.handleSubmit((data) => updateSectionMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={sectionForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Products" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sectionForm.control}
                        name="sectionKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section Key</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. product" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sectionForm.control}
                        name="order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sectionForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={updateSectionMutation.isPending}>
                        {updateSectionMutation.isPending ? 'Saving...' : 'Save Section'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {footerSections?.data?.map((section: FooterSection) => (
                  <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{section.title}</h4>
                        <p className="text-sm text-muted-foreground">Key: {section.sectionKey}</p>
                      </div>
                      <Badge variant={section.isActive ? "default" : "secondary"}>
                        {section.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSection(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ type: 'sections', id: section.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Links */}
        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Footer Links</CardTitle>
                <CardDescription>Manage links within footer sections</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingLink(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingLink ? 'Edit Link' : 'Add New Link'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...linkForm}>
                    <form onSubmit={linkForm.handleSubmit((data) => updateLinkMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={linkForm.control}
                        name="label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. About Us" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={linkForm.control}
                        name="href"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. /about" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <label className="text-sm font-medium">Section</label>
                        <select 
                          className="w-full mt-1 p-2 border rounded-md"
                          onChange={(e) => setSelectedSectionId(parseInt(e.target.value))}
                          value={selectedSectionId || ''}
                        >
                          <option value="">Select a section</option>
                          {footerSections?.data?.map((section: FooterSection) => (
                            <option key={section.id} value={section.id}>
                              {section.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <FormField
                        control={linkForm.control}
                        name="order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={linkForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={updateLinkMutation.isPending}>
                        {updateLinkMutation.isPending ? 'Saving...' : 'Save Link'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {footerSections?.data?.map((section: FooterSection) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{section.title} Links</h4>
                    <div className="space-y-2">
                      {footerLinks?.data?.filter((link: FooterLink) => link.sectionId === section.id)
                        .map((link: FooterLink) => (
                        <div key={link.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="font-medium">{link.label}</span>
                              <p className="text-sm text-muted-foreground">{link.href}</p>
                            </div>
                            <Badge variant={link.isActive ? "default" : "secondary"}>
                              {link.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLink(link)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMutation.mutate({ type: 'links', id: link.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Links */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Manage social media platform links</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingSocial(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Social Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSocial ? 'Edit Social Link' : 'Add New Social Link'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...socialForm}>
                    <form onSubmit={socialForm.handleSubmit((data) => updateSocialMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={socialForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. facebook" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. https://facebook.com/yourpage" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={updateSocialMutation.isPending}>
                        {updateSocialMutation.isPending ? 'Saving...' : 'Save Social Link'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialLinks?.data?.map((social: FooterSocialLink) => (
                  <div key={social.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      {getSocialIcon(social.platform)}
                      <div>
                        <h4 className="font-medium capitalize">{social.platform}</h4>
                        <p className="text-sm text-muted-foreground">{social.url}</p>
                      </div>
                      <Badge variant={social.isActive ? "default" : "secondary"}>
                        {social.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSocial(social)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ type: 'social', id: social.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>Configure footer description and copyright text</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit((data) => updateSettingsMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={settingsForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter footer description..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={settingsForm.control}
                    name="copyrightText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copyright Text</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="© 2025 Your Company. All rights reserved."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}