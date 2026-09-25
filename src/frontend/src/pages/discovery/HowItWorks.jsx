import React, { useEffect } from 'react';
import HowItWorksHero from '@/components/how-it-works/HowItWorksHero';
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
    <div className="min-h-screen bg-white">
      {/* Section 1: Hero Banner */}
      <HowItWorksHero />

      {/* Section 2: Student Journey (4 steps) */}
      <div className="pt-6 sm:pt-8">
        <StepsSection variant="student" />
      </div>

      {/* Section 3: Tutor Journey (4 steps) */}
      <div className="pt-2 sm:pt-4">
        <StepsSection variant="tutor" />
      </div>

      {/* Section 4: Why TutorHub (4 Benefits) */}
      <WhyTutorHub />

      {/* Section 5: CTA Banner "Sẵn sàng bắt đầu?" */}
      <ReadyToStartCTA />

      {/* Section 6: FAQ Accordion */}
      <FAQSection />
    </div>
  );
}
