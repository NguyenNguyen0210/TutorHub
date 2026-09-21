import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

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

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/tutors';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-navy-950 p-6 text-center">
          <div className="max-w-md w-full bg-brand-navy-900 border border-brand-navy-800 rounded-brand-xl p-8 shadow-brand-xl">
            <div className="w-16 h-16 rounded-brand-lg bg-danger-subtle border border-danger/30 flex items-center justify-center text-danger mx-auto mb-4">
              <Icon name="warning" size="xl" />
            </div>
            <h2 className="text-headline-2 text-white mb-2">Đã Xảy Ra Sự Cố Bất Ngờ</h2>
            <p className="text-caption text-fg-muted mb-6 leading-relaxed">
              Hệ thống đã tự động bảo vệ trạng thái an toàn. Bạn có thể thử tải lại trang hoặc quay
              lại trang khám phá gia sư.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                icon={<Icon name="refresh" size="sm" />}
                onClick={this.handleReload}
                className="border-brand-navy-800 bg-brand-navy-800 text-fg-inverse hover:bg-brand-navy-700"
              >
                Tải Lại Trang
              </Button>
              <Button
                variant="primary"
                icon={<Icon name="explore" size="sm" />}
                onClick={this.handleGoHome}
              >
                Về Trang Khám Phá
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
