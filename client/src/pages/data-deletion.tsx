import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Trash2, Shield, CheckCircle, AlertTriangle, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function DataDeletion() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [facebookUserId, setFacebookUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deletionMutation = useMutation({
    mutationFn: async (data: { email: string; reason: string; facebookUserId?: string }) => {
      const response = await fetch('/api/data-deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Yêu cầu đã được gửi",
        description: `Mã yêu cầu: ${response.data.requestId}. Chúng tôi sẽ xử lý trong vòng 30 ngày.`,
      });
      // Reset form
      setEmail("");
      setReason("");
      setFacebookUserId("");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ support.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !reason) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }

    deletionMutation.mutate({
      email,
      reason,
      facebookUserId: facebookUserId || undefined
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-3xl font-bold">Yêu cầu Xóa Dữ liệu</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Quản lý và xóa dữ liệu cá nhân của bạn khỏi hệ thống SEO AI Writer
            </p>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Information Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Quyền của bạn
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Xóa tài khoản</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Xóa hoàn toàn tài khoản và tất cả dữ liệu liên quan
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Xóa nội dung</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Xóa tất cả bài viết và nội dung đã tạo
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Ngắt kết nối Facebook</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Hủy quyền truy cập Facebook và xóa access token
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Xóa lịch sử</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Xóa lịch sử sử dụng tín dụng và hoạt động
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Request Form */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Gửi yêu cầu xóa dữ liệu</h2>
              
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Lưu ý quan trọng:</strong> Việc xóa dữ liệu là không thể hoàn tác. 
                  Vui lòng cân nhắc kỹ trước khi gửi yêu cầu.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email liên hệ *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Email để chúng tôi xác nhận và phản hồi yêu cầu
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook-id">Facebook User ID (nếu có)</Label>
                    <Input
                      id="facebook-id"
                      value={facebookUserId}
                      onChange={(e) => setFacebookUserId(e.target.value)}
                      placeholder="Ví dụ: 1234567890"
                    />
                    <p className="text-xs text-gray-500">
                      ID Facebook nếu bạn đã kết nối tài khoản
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Lý do yêu cầu xóa dữ liệu *</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Vui lòng mô tả lý do bạn muốn xóa dữ liệu và loại dữ liệu cụ thể cần xóa..."
                    rows={4}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={deletionMutation.isPending}
                >
                  {deletionMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu xóa dữ liệu"}
                </Button>
              </form>
            </section>

            <Separator />

            {/* Process Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Quy trình xử lý</h2>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">1</span>
                    </div>
                    <h3 className="font-medium mb-2">Nhận yêu cầu</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Chúng tôi xác nhận yêu cầu qua email trong vòng 24h
                    </p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">2</span>
                    </div>
                    <h3 className="font-medium mb-2">Xác minh</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Xác minh danh tính và quyền sở hữu dữ liệu
                    </p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 dark:text-green-400 font-bold text-lg">3</span>
                    </div>
                    <h3 className="font-medium mb-2">Thực hiện</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Xóa dữ liệu và gửi xác nhận hoàn thành
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                    Thời gian xử lý
                  </h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Xác nhận yêu cầu: 1-2 ngày làm việc</li>
                    <li>• Xác minh và xử lý: 7-15 ngày làm việc</li>
                    <li>• Hoàn tất và thông báo: 30 ngày tối đa</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Alternative Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Hỗ trợ khác</h2>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Liên hệ trực tiếp
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-4">
                      Nếu bạn gặp khó khăn với form trên hoặc cần hỗ trợ khẩn cấp, 
                      vui lòng liên hệ trực tiếp qua email:
                    </p>
                    <div className="space-y-2 text-blue-700 dark:text-blue-300">
                      <p><strong>Email hỗ trợ:</strong> support@seoaiwriter.com</p>
                      <p><strong>Email bảo mật:</strong> privacy@seoaiwriter.com</p>
                      <p><strong>Thời gian phản hồi:</strong> 24-48 giờ</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                Trang này tuân thủ GDPR và các quy định bảo mật dữ liệu hiện hành. 
                Mọi yêu cầu sẽ được xử lý một cách bảo mật và chuyên nghiệp.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}