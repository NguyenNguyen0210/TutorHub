import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';

export default function ServiceSyllabus({ curriculum, totalSessions, sessionDurationMinutes }) {
  const sessions = Array.isArray(curriculum) ? curriculum : [];

  // Open first 2 sessions by default
  const [openSessions, setOpenSessions] = useState(() => {
    const initial = {};
    if (sessions.length > 0) initial[0] = true;
    if (sessions.length > 1) initial[1] = true;
    return initial;
  });

  const toggleSession = (index) => {
    setOpenSessions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isAllOpen = sessions.length > 0 && sessions.every((_, idx) => openSessions[idx]);

  const toggleAll = () => {
    if (isAllOpen) {
      setOpenSessions({});
    } else {
      const all = {};
      sessions.forEach((_, idx) => {
        all[idx] = true;
      });
      setOpenSessions(all);
    }
  };

  const totalMinutes = (Number(totalSessions) || sessions.length) * (Number(sessionDurationMinutes) || 90);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div id="syllabus" className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
              Lộ trình & Nội dung khóa học
            </h2>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Tổng cộng <strong className="text-fg">{totalSessions || sessions.length} buổi học</strong> •{' '}
            <strong className="text-fg">{totalHours} giờ học</strong> chuyên sâu cá nhân hóa.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary-600 hover:text-brand-primary-700 bg-brand-primary-50/80 hover:bg-brand-primary-100/80 px-3.5 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            <Icon name={isAllOpen ? 'unfold_less' : 'unfold_more'} size="xs" className="w-4 h-4" />
            <span>{isAllOpen ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}</span>
          </button>
        )}
      </div>

      {/* Sessions Accordion List */}
      <div className="mt-6 flex flex-col gap-3">
        {sessions.map((item, index) => {
          const isOpen = Boolean(openSessions[index]);
          const sessionNum = item.sessionIndex || index + 1;
          const formattedNum = sessionNum < 10 ? `0${sessionNum}` : sessionNum;

          return (
            <div
              key={index}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-brand-primary-300 bg-gradient-to-b from-brand-primary-50/30 to-white shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSession(index)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-extrabold shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-brand-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 group-hover:bg-neutral-200'
                    }`}
                  >
                    Buổi {formattedNum}
                  </span>

                  <span className="text-sm sm:text-base font-bold text-fg line-clamp-1">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-500 font-medium bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-100">
                    <Icon name="schedule" size="xs" className="w-3.5 h-3.5 text-fg-muted" />
                    {item.durationMinutes || sessionDurationMinutes || 90} phút
                  </span>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-brand-primary-100 text-brand-primary-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    <Icon name="keyboard_arrow_down" size="xs" className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-brand-primary-100/60 flex flex-col gap-3.5 animate-fadeIn">
                  {item.description && (
                    <p className="text-sm text-fg-secondary leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {Array.isArray(item.keyTopics) && item.keyTopics.length > 0 && (
                    <div className="bg-white/80 rounded-lg p-3.5 border border-neutral-100">
                      <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
                        Trọng tâm kiến thức & Kỹ năng đạt được:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.keyTopics.map((topic, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-700">
                            <Icon
                              name="check_circle"
                              size="xs"
                              className="w-4 h-4 text-success-strong shrink-0 mt-0.5"
                            />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

ServiceSyllabus.propTypes = {
  curriculum: PropTypes.array,
  totalSessions: PropTypes.number,
  sessionDurationMinutes: PropTypes.number,
};
