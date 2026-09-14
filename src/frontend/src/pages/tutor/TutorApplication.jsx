import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Steps, Form, Input, Button, Radio, Select, Upload, message, Alert } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  VideoCameraOutlined,
  BankOutlined,
  InboxOutlined,
  CheckCircleFilled,
  SafetyCertificateFilled,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

export default function TutorApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: 'Lê Hoàng Nam',
    phone: '0934567890',
    address: 'Quận 10, TP.HCM',
    education: 'Kỹ sư CNTT - ĐH Bách Khoa',
    experienceYears: 3,
    bio: 'Kỹ sư phần mềm và gia sư Vật lý THPT giàu nhiệt huyết.',
    teachingMode: 'Both',
    subjects: ['Toán THPT', 'Vật lý THPT'],
    trialLessonUrl: 'https://youtube.com/watch?v=demo',
    bankName: 'Vietcombank',
    bankAccount: '0071001234567',
    bankAccountName: 'LE HOANG NAM',
  });
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { title: 'Cá Nhân & KYC', icon: <UserOutlined /> },
    { title: 'Học Vấn & Bằng Cấp', icon: <BookOutlined /> },
    { title: 'Môn Dạy & Video', icon: <VideoCameraOutlined /> },
    { title: 'Ngân Hàng Escrow', icon: <BankOutlined /> },
  ];

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = () => {
    setSubmitted(true);
    message.success('Đã nộp hồ sơ gia sư thành công! Ban Quản Trị sẽ thẩm định trong vòng 24 giờ.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-indigo-50 px-3 py-1 text-xs font-bold text-brand-indigo-700 mb-2">
            <SafetyCertificateFilled /> QUY TRÌNH ONBOARDING GIA SƯ CHUẨN MỰC
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng Ký Trở Thành Gia Sư Bảo Chứng
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Gia nhập mạng lưới gia sư cao cấp TutorHub: Thu nhập bảo chứng qua két Escrow, không lo bùng học phí.
          </p>
        </div>

        {/* Wizard Card */}
        <div className="glass-surface rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-lg">
          <Steps current={currentStep} items={steps} className="mb-8" />

          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
                <CheckCircleFilled />
              </div>
              <h3 className="text-xl font-bold text-slate-900 m-0">Hồ Sơ Của Bạn Đang Được Thẩm Định!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hồ sơ và bằng cấp scan của bạn đã được chuyển tới Bàn Duyệt Hồ Sơ của Ban Quản Trị. Bạn có thể theo dõi trạng thái hoặc đăng nhập tài khoản gia sư để xem trước bảng điều hành.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button type="primary" className="rounded-xl bg-brand-indigo-600 font-bold" onClick={() => navigate('/tutor/dashboard')}>
                  Đến Bảng Điều Hành Gia Sư
                </Button>
                <Button className="rounded-xl" onClick={() => navigate('/admin/tutor-applications')}>
                  Xem Bàn Duyệt (Góc nhìn Admin)
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* STEP 1: Personal & KYC */}
              {currentStep === 0 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Bước 1: Thông Tin Cá Nhân & Xác Thực Căn Cước (KYC)</h3>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Họ và Tên (Khớp với CCCD):</label>
                    <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại:</label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Địa Chỉ Khu Vực Giảng Dạy:</label>
                      <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ảnh Chụp CCCD / Hộ Chiếu 2 Mặt (Bảo mật tuyệt đối):</label>
                    <Dragger beforeUpload={() => false} className="rounded-xl">
                      <p className="ant-upload-drag-icon text-brand-indigo-600 text-2xl mb-1"><InboxOutlined /></p>
                      <p className="text-xs font-bold text-slate-700 m-0">Kéo thả ảnh CCCD mặt trước & mặt sau</p>
                    </Dragger>
                  </div>
                </div>
              )}

              {/* STEP 2: Education & Degrees */}
              {currentStep === 1 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Bước 2: Học Vấn & Bằng Cấp Chứng Chỉ</h3>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trường ĐH / Học Vị Cao Nhất:</label>
                    <Input value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số Năm Kinh Nghiệm:</label>
                      <Input type="number" value={formData.experienceYears} onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })} className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hình Thức Giảng Dạy:</label>
                      <Select value={formData.teachingMode} onChange={(val) => setFormData({ ...formData, teachingMode: val })} className="w-full">
                        <Option value="Online">Chỉ dạy Online</Option>
                        <Option value="Offline">Chỉ dạy Tại nhà</Option>
                        <Option value="Both">Cả Online & Tại nhà</Option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tiểu Sử Sư Phạm & Phương Pháp Giảng Dạy:</label>
                    <TextArea rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bản Scan Bằng Tốt Nghiệp ĐH / Bảng Điểm / Chứng Chỉ IELTS:</label>
                    <Dragger beforeUpload={() => false} className="rounded-xl">
                      <p className="ant-upload-drag-icon text-brand-indigo-600 text-2xl mb-1"><InboxOutlined /></p>
                      <p className="text-xs font-bold text-slate-700 m-0">Tải lên file PDF hoặc ảnh scan bằng đại học</p>
                    </Dragger>
                  </div>
                </div>
              )}

              {/* STEP 3: Subjects & Video */}
              {currentStep === 2 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Bước 3: Môn Học Giảng Dạy & Video Bài Giảng Mẫu</h3>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Các Môn Đăng Ký Dạy:</label>
                    <Select mode="multiple" value={formData.subjects} onChange={(val) => setFormData({ ...formData, subjects: val })} className="w-full">
                      <Option value="Toán THPT">Toán THPT</Option>
                      <Option value="Toán THCS">Toán THCS</Option>
                      <Option value="Vật lý THPT">Vật lý THPT</Option>
                      <Option value="Luyện thi IELTS 6.5+">Luyện thi IELTS 6.5+</Option>
                      <Option value="Lập trình C# / .NET">Lập trình C# / .NET</Option>
                    </Select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Đường Dẫn Video Bài Giảng Mẫu 30 Phút (YouTube / Drive):</label>
                    <Input value={formData.trialLessonUrl} onChange={(e) => setFormData({ ...formData, trialLessonUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="rounded-xl" />
                    <p className="text-[11px] text-slate-400 mt-1 m-0">Video bài giảng giúp học viên đánh giá giọng nói và phương pháp truyền đạt trước khi đăng ký học.</p>
                  </div>
                </div>
              )}

              {/* STEP 4: Bank Account for Escrow Payouts */}
              {currentStep === 3 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Bước 4: Tài Khoản Ngân Hàng Thụ Hưởng Nhận Tiền Escrow</h3>
                  <Alert
                    type="info"
                    showIcon
                    message="Quy Chế Giải Ngân Vào Ví & Tài Khoản Ngân Hàng"
                    description="Sau mỗi buổi học hoàn thành và đối soát điểm danh 24h, tiền sẽ tự động chuyển vào Ví Khả Dụng. Bạn có thể rút tiền về tài khoản ngân hàng bên dưới bất kỳ lúc nào."
                    className="rounded-xl"
                  />
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngân Hàng Thụ Hưởng:</label>
                    <Select value={formData.bankName} onChange={(val) => setFormData({ ...formData, bankName: val })} className="w-full">
                      <Option value="Vietcombank">Vietcombank (Ngoại Thương Việt Nam)</Option>
                      <Option value="Techcombank">Techcombank (Kỹ Thương Việt Nam)</Option>
                      <Option value="MBBank">MBBank (Quân Đội)</Option>
                      <Option value="ACB">ACB (Á Châu)</Option>
                    </Select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số Tài Khoản:</label>
                    <Input value={formData.bankAccount} onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })} className="rounded-xl font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản (Không dấu):</label>
                    <Input value={formData.bankAccountName} onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })} className="rounded-xl font-bold uppercase" />
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button disabled={currentStep === 0} onClick={handlePrev} className="rounded-xl">
                  Quay Lại
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button type="primary" onClick={handleNext} className="rounded-xl bg-brand-indigo-600 font-bold">
                    Tiếp Tục
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleSubmit} className="rounded-xl bg-emerald-600 font-bold border-0 hover:bg-emerald-500">
                    Nộp Hồ Sơ Xét Duyệt
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
