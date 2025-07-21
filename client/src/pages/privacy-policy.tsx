import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Chính Sách Bảo Mật</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Giới thiệu</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                SEO AI Writer cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng. 
                Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn 
                khi sử dụng dịch vụ tạo nội dung AI và quản lý mạng xã hội.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Thông tin chúng tôi thu thập</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">2.1 Thông tin tài khoản</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Tên đăng nhập và mật khẩu</li>
                    <li>Địa chỉ email</li>
                    <li>Thông tin hồ sơ cá nhân</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">2.2 Dữ liệu sử dụng dịch vụ</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Nội dung bạn tạo ra và chỉnh sửa</li>
                    <li>Lịch sử sử dụng tín dụng</li>
                    <li>Thống kê và phân tích hoạt động</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">2.3 Dữ liệu mạng xã hội</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Access Token của Facebook Pages (chỉ khi bạn kết nối)</li>
                    <li>Thông tin công khai của Pages bạn quản lý</li>
                    <li>Số liệu engagement của các bài đăng</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Cách chúng tôi sử dụng thông tin</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">3.1 Cung cấp dịch vụ</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Tạo nội dung AI theo yêu cầu của bạn</li>
                    <li>Đăng bài lên các trang Facebook bạn ủy quyền</li>
                    <li>Cung cấp thống kê và báo cáo hiệu quả</li>
                    <li>Quản lý hệ thống tín dụng và gói dịch vụ</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">3.2 Cải thiện dịch vụ</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Phân tích xu hướng sử dụng để tối ưu hóa tính năng</li>
                    <li>Phát triển các mô hình AI hiệu quả hơn</li>
                    <li>Khắc phục lỗi và cải thiện hiệu suất</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">3.3 Liên lạc</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Thông báo về cập nhật dịch vụ</li>
                    <li>Hỗ trợ kỹ thuật và chăm sóc khách hàng</li>
                    <li>Thông báo về chính sách và điều khoản</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Chia sẻ thông tin với bên thứ ba</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba, 
                trừ các trường hợp sau:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Nhà cung cấp dịch vụ AI:</strong> OpenAI, Google, Anthropic để xử lý yêu cầu tạo nội dung</li>
                <li><strong>Facebook/Meta:</strong> Khi đăng nội dung lên Pages bạn ủy quyền</li>
                <li><strong>Dịch vụ hạ tầng:</strong> Hosting, database, email để vận hành hệ thống</li>
                <li><strong>Yêu cầu pháp lý:</strong> Khi có lệnh từ cơ quan có thẩm quyền</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Bảo mật dữ liệu</h2>
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Chúng tôi áp dụng các biện pháp bảo mật toàn diện để bảo vệ thông tin của bạn:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li><strong>Mã hóa:</strong> Tất cả dữ liệu được mã hóa trong quá trình truyền tải và lưu trữ</li>
                  <li><strong>Xác thực:</strong> Hệ thống đăng nhập an toàn với mã hóa mật khẩu</li>
                  <li><strong>Access Token:</strong> Facebook tokens được mã hóa và chỉ sử dụng cho mục đích được ủy quyền</li>
                  <li><strong>Giám sát:</strong> Theo dõi truy cập và hoạt động bất thường 24/7</li>
                  <li><strong>Cập nhật:</strong> Thường xuyên cập nhật bảo mật và vá lỗi hệ thống</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Quyền của người dùng</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Bạn có các quyền sau đối với dữ liệu cá nhân:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Truy cập:</strong> Xem và tải xuống dữ liệu cá nhân của bạn</li>
                <li><strong>Chỉnh sửa:</strong> Cập nhật thông tin tài khoản và hồ sơ</li>
                <li><strong>Xóa:</strong> Yêu cầu xóa tài khoản và tất cả dữ liệu liên quan</li>
                <li><strong>Hủy kết nối:</strong> Ngắt kết nối với các tài khoản mạng xã hội bất kỳ lúc nào</li>
                <li><strong>Xuất dữ liệu:</strong> Yêu cầu xuất toàn bộ nội dung bạn đã tạo</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Lưu trữ và xóa dữ liệu</h2>
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Chúng tôi chỉ lưu trữ dữ liệu của bạn trong thời gian cần thiết để cung cấp dịch vụ:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li><strong>Dữ liệu tài khoản:</strong> Lưu trữ cho đến khi bạn yêu cầu xóa</li>
                  <li><strong>Nội dung đã tạo:</strong> Lưu trữ để bạn có thể truy cập và chỉnh sửa</li>
                  <li><strong>Access Token:</strong> Tự động xóa khi bạn hủy kết nối hoặc token hết hạn</li>
                  <li><strong>Log hệ thống:</strong> Xóa sau 90 ngày để bảo trì và troubleshooting</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookie và công nghệ theo dõi</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Chúng tôi sử dụng cookie và công nghệ tương tự để:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Duy trì phiên đăng nhập của bạn</li>
                <li>Ghi nhớ tùy chọn ngôn ngữ và giao diện</li>
                <li>Phân tích cách sử dụng dịch vụ để cải thiện trải nghiệm</li>
                <li>Bảo mật tài khoản khỏi truy cập trái phép</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Thay đổi chính sách</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Chúng tôi có thể cập nhật chính sách bảo mật này khi cần thiết. 
                Các thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên hệ thống. 
                Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi được coi là bạn đồng ý với chính sách mới.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Liên hệ</h2>
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, 
                  vui lòng liên hệ với chúng tôi:
                </p>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p><strong>Email:</strong> privacy@seoaiwriter.com</p>
                  <p><strong>Hỗ trợ:</strong> support@seoaiwriter.com</p>
                  <p><strong>Địa chỉ:</strong> Việt Nam</p>
                </div>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>© 2025 SEO AI Writer. Tất cả quyền được bảo lưu.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}