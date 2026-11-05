import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import StatePanel from './StatePanel';

// Router-level errors and errors outside the router use the same safe fallback.
export function PageErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8 sm:py-12">
      <a href="/" aria-label="TutorHub — Về trang tìm gia sư" className="mx-auto mb-8 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Logo size={36} /></a>
      <StatePanel title="Chưa thể hiển thị trang này" headingAs="h1" icon="cloud_off" alert className="my-auto"
        description="Vui lòng tải lại trang. Nếu vẫn chưa mở được, bạn có thể quay về trang tìm gia sư."
        actions={<>
          <Button icon={<Icon name="refresh" size="sm" />} onClick={() => window.location.reload()}>Tải lại trang</Button>
          <Button as="a" href="/" variant="outline" icon={<Icon name="explore" size="sm" />}>Về trang tìm gia sư</Button>
        </>}
      />
      <p className="mt-8 text-center text-xs leading-5 text-fg-secondary">TutorHub · Kết nối gia sư, tiếp nối hành trình học</p>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <PageErrorFallback />;
    }

    return this.props.children;
  }
}
