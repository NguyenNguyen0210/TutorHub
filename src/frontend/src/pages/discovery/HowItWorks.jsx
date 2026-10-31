import React, { useEffect } from 'react';
import '@/styles/marketplace.css';
import HowItWorksHero, { HowItWorksTrustBar } from '@/components/how-it-works/HowItWorksHero';
import StepsSection from '@/components/how-it-works/StepsSection';
import WhyTutorHub from '@/components/how-it-works/WhyTutorHub';
import ReadyToStartCTA from '@/components/how-it-works/ReadyToStartCTA';
import FAQSection from '@/components/how-it-works/FAQSection';

export default function HowItWorks() {
  useEffect(() => {
    document.title = 'Cách hoạt động — TutorHub';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="marketplace-v2 min-h-screen bg-white">
      {/* Section 1: Hero Banner */}
      <HowItWorksHero />

      {/* Section 1.5: Cam kết chất lượng & Bảo chứng */}
      <HowItWorksTrustBar />

      {/* Section 2: Student Journey (4 steps) */}
      <StepsSection id="quy-trinh-hoc-vien" variant="student" />

      {/* Section 3: Tutor Journey (4 steps) */}
      <StepsSection id="quy-trinh-gia-su" variant="tutor" />

      {/* Section 4: Why TutorHub (4 Benefits đóng khung vững chắc) */}
      <WhyTutorHub />

      {/* Section 5: FAQ Accordion (Chia 2 cột đồng bộ, mở sẵn câu hỏi đầu tiên) */}
      <FAQSection />

      {/* Section 6: CTA Banner "Sẵn sàng bắt đầu?" (Đã dời xuống dưới FAQ, bỏ họa tiết đè chữ) */}
      <ReadyToStartCTA />
    </div>
  );
}
