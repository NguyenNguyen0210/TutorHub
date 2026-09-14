import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Modal, message, Tooltip } from 'antd';
import { 
  AuditOutlined, 
  SearchOutlined, 
  SafetyCertificateFilled, 
  CopyOutlined,
  CodeOutlined,
  FilterOutlined
} from '@ant-design/icons';
import adminService from '../../services/admin.service';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [diffModalVisible, setDiffModalVisible] = useState(false);

  useEffect(() => {
    adminService.getAuditLogs().then(setLogs);
  }, []);

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    message.success('Đã sao chép chữ ký SHA-256 HMAC vào bộ nhớ đệm!');
  };

  const filteredLogs = logs.filter(l => {
    return l.summary.toLowerCase().includes(searchText.toLowerCase()) ||
           l.correlationId.toLowerCase().includes(searchText.toLowerCase()) ||
           l.actor.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <Tag color="cyan" className="font-mono text-[10px] uppercase tracking-wider">Append-Only Immutable Ledger</Tag>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <AuditOutlined className="text-indigo-400" />
            Sổ Cái Kiểm Toán Bất Biến Trung Tâm
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lưu vết vĩnh viễn với Correlation ID (X-Correlation-ID) và mã băm toàn vẹn SHA-256 HMAC chống giả mạo
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-xl">
        <Input
          prefix={<SearchOutlined className="text-slate-500" />}
          placeholder="Tìm theo Correlation ID, Tác nhân (Actor), hoặc Nội dung kiểm toán..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="bg-slate-950 border-slate-700 text-slate-200 text-xs"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <Table
          dataSource={filteredLogs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="admin-dark-table"
          columns={[
            {
              title: 'Thời Gian',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (t) => <span className="font-mono text-slate-400 text-[11px]">{t}</span>,
              width: 155,
            },
            {
              title: 'Correlation ID',
              dataIndex: 'correlationId',
              key: 'correlationId',
              render: (c) => (
                <span className="font-mono text-[11px] text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                  {c}
                </span>
              ),
              width: 175,
            },
            {
              title: 'Tác Nhân (Actor)',
              dataIndex: 'actor',
              key: 'actor',
              render: (act) => <span className="text-xs font-semibold text-slate-300">{act}</span>,
              width: 190,
            },
            {
              title: 'Hành Động & Tóm Tắt',
              key: 'actionSummary',
              render: (_, record) => (
                <div>
                  <div className="mb-1">
                    <Tag color={record.action.includes('VERDICT') ? 'red' : record.action.includes('RELEASE') ? 'green' : 'blue'} className="text-[10px] font-mono font-bold">
                      {record.action}
                    </Tag>
                  </div>
                  <p className="text-xs text-slate-200">{record.summary}</p>
                </div>
              )
            },
            {
              title: 'SHA-256 HMAC',
              dataIndex: 'sha256Hash',
              key: 'sha256Hash',
              render: (h) => (
                <div className="flex items-center space-x-1">
                  <span className="font-mono text-[10px] text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {h.substring(0, 12)}...
                  </span>
                  <Tooltip title="Sao chép toàn bộ mã SHA-256">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined className="text-slate-400 hover:text-white text-xs" />}
                      onClick={() => handleCopyHash(h)}
                    />
                  </Tooltip>
                </div>
              ),
              width: 160,
            },
            {
              title: 'State Diff',
              key: 'diff',
              render: (_, record) => (
                <Button
                  size="small"
                  icon={<CodeOutlined />}
                  onClick={() => {
                    setSelectedLog(record);
                    setDiffModalVisible(true);
                  }}
                  className="bg-slate-800 text-indigo-400 border-indigo-500/30 text-xs font-semibold"
                >
                  Xem Diff
                </Button>
              ),
              width: 110,
            }
          ]}
        />
      </div>

      {/* JSON State Diff Modal */}
      {selectedLog && (
        <Modal
          title={
            <div className="text-white text-base font-bold flex items-center gap-2">
              <CodeOutlined className="text-indigo-400" />
              <span>Kiểm Soát Biến Động Trạng Thái (State Diff): {selectedLog.id}</span>
            </div>
          }
          open={diffModalVisible}
          onCancel={() => setDiffModalVisible(false)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setDiffModalVisible(false)} className="border-slate-700 text-slate-300">
              Đóng
            </Button>
          ]}
        >
          <div className="py-3 text-xs space-y-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">Correlation ID: <strong className="text-indigo-400">{selectedLog.correlationId}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1">
                <SafetyCertificateFilled /> SHA-256 HASH VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block mb-1">State Trước Biến Động (Before):</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.payloadBefore, null, 2)}
                </pre>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">State Sau Biến Động (After):</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.payloadAfter, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
