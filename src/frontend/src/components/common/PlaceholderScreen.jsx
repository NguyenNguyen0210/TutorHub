import React from 'react';
import { Card, Tag, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons';

export default function PlaceholderScreen({ screenId, title, route, roleTag, description, quickActions = [] }) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag color="indigo" className="font-mono text-xs">{route}</Tag>
            <Tag color="blue">{roleTag || 'Public'}</Tag>
            <Tag color="green">Stitch ID: {screenId.slice(0, 8)}</Tag>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <SafetyCertificateOutlined /> Bảo chứng Escrow 2 chiều
          </span>
        </div>
      </div>

      {/* Description Card */}
      <Card className="glass-card">
        <h3 className="font-bold text-slate-800 text-sm mb-2">Đặc Tả Nghiệp Vụ Màn Hình:</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">{description}</p>
        
        {quickActions.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-2">Điều Hướng & Tác Vụ Thử Nghiệm:</span>
            <Space wrap>
              {quickActions.map((act, idx) => (
                <Link key={idx} to={act.to}>
                  <Button type={act.primary ? 'primary' : 'default'} size="small" icon={<ArrowRightOutlined />}>
                    {act.label}
                  </Button>
                </Link>
              ))}
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
}
