import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';

export default function ServiceFaqs({ faqs }) {
  const faqList = Array.isArray(faqs) ? faqs : [];
  const [openIndex, setOpenIndex] = useState(0); // Open first item by default

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  if (faqList.length === 0) return null;

  return (
    <div id="faqs" className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-2xs">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Câu hỏi thường gặp về dịch vụ
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-neutral-100">
        {faqList.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div key={idx} className="py-4">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between gap-4 text-left transition-colors group"
              >
                <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600">
                  {faq.question}
                </span>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon name="keyboard_arrow_down" size="xs" className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6 animate-fadeIn">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

ServiceFaqs.propTypes = {
  faqs: PropTypes.array,
};
