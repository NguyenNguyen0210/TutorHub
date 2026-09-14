import React from 'react';
import { Result, Button } from 'antd';
import { WarningOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';

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
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-3xl mx-auto mb-4">
              <WarningOutlined />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Đã Xảy Ra Sự Cố Bất Ngờ</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Hệ thống đã tự động bảo vệ trạng thái an toàn. Bạn có thể thử tải lại trang hoặc quay lại trang khám phá gia sư.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
                className="bg-slate-800 text-slate-200 border-slate-700 font-semibold text-xs h-10 px-5"
              >
                Tải Lại Trang
              </Button>
              <Button
                type="primary"
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs h-10 px-5 border-none shadow-lg shadow-indigo-900/30"
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
