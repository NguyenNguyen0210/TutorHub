import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { SectionShell } from './SectionShell';
import { LEARNING_FAQS } from '@/content/learningFaqs';



/**
 * ProfileFAQSection — Khu vực Câu hỏi thường gặp trên hồ sơ gia sư.
 * Hiển thị các câu hỏi thiết thực về quy định đổi lịch, quỹ bảo chứng Escrow
 * và quyền lợi học viên dạng accordion tương tác mượt mà.
 */
export default function ProfileFAQSection({ tutor, id = 'cau-hoi' }) {
  const [openIds, setOpenIds] = useState(new Set(['doi-lich']));

  const items = LEARNING_FAQS;

  const toggleItem = (itemId) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <SectionShell id={id} title="Câu hỏi thường gặp" icon="question_answer" className="mt-8">
      <Card padding="lg" className="rounded-2xl border border-border shadow-sm space-y-3.5">
        <div className="space-y-3">
          {items.map((item) => {
            const isOpen = openIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                  isOpen
                    ? 'border-blue-400/90 bg-blue-50/20 shadow-xs'
                    : 'border-border bg-surface hover:border-blue-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer transition-colors"
                >
                  <span
                    className={`text-[14px] sm:text-[15px] font-bold leading-snug transition-colors ${
                      isOpen ? 'text-blue-700' : 'text-slate-900 hover:text-blue-600'
                    }`}
                  >
                    {item.question}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ${
                      isOpen
                        ? 'bg-blue-100 text-blue-700 rotate-180'
                        : 'bg-neutral-100 text-slate-500'
                    }`}
                  >
                    <Icon name="expand_more" size="xs" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-[13px] sm:text-[13.5px] text-slate-600 leading-relaxed border-t border-border/50">
                    <p className="m-0">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-border/80 flex items-center justify-between gap-3 text-caption text-slate-600 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-[12px]">
            <Icon name="help_outline" size="xs" className="text-blue-600 shrink-0" />
            Bạn vẫn còn thắc mắc về khóa học hay quy trình đăng ký?
          </span>
          <a
            href={`/app/messages?tutorId=${tutor?.id}`}
            className="text-[12px] font-semibold text-blue-700 hover:text-blue-800 transition-colors inline-flex items-center gap-1 shrink-0"
          >
            <span>Nhắn tin hỏi gia sư</span>
            <Icon name="arrow_forward" size="xs" />
          </a>
        </div>
      </Card>
    </SectionShell>
  );
}

ProfileFAQSection.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.string,
  }),
  id: PropTypes.string,
};
