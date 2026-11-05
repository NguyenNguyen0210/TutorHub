// Display metadata only. Never changes error objects or HTTP/business outcomes.
const STATES = {
  network: { icon: 'wifi_off', title: 'Không thể kết nối', message: 'Vui lòng kiểm tra kết nối mạng rồi thử tải lại nội dung.', canRetry: true },
  notFound: { icon: 'search_off', title: 'Không tìm thấy nội dung', message: 'Vui lòng kiểm tra liên kết hoặc quay lại danh sách để chọn nội dung khác.', canRetry: false },
  unauthorized: { icon: 'lock', title: 'Bạn cần đăng nhập', message: 'Vui lòng đăng nhập để tiếp tục xem nội dung này.', canRetry: false },
  forbidden: { icon: 'lock', title: 'Bạn không có quyền xem nội dung này', message: 'Bạn có thể quay lại không gian của mình hoặc tìm nội dung khác.', canRetry: false },
  conflict: { icon: 'sync_problem', title: 'Chưa thể hoàn tất thao tác', message: 'Vui lòng tải lại thông tin, kiểm tra rồi thử lại.', canRetry: true },
  throttled: { icon: 'schedule', title: 'Vui lòng chờ một chút', message: 'Chưa thể tiếp tục lúc này. Bạn hãy chờ một chút rồi thử lại.', canRetry: true },
  server: { icon: 'cloud_off', title: 'Tạm thời chưa tải được nội dung', message: 'Vui lòng thử lại. Nếu vẫn chưa tải được, bạn có thể quay lại sau.', canRetry: true },
  unknown: { icon: 'menu_book', title: 'Chưa thể mở nội dung', message: 'Vui lòng thử tải lại nội dung hoặc quay lại trang trước.', canRetry: true },
};

export function getErrorPresentation(error) {
  const status = error?.status ?? error?.response?.status;
  const kind = status === 404 ? 'notFound'
    : status === 401 ? 'unauthorized'
    : status === 403 ? 'forbidden'
    : status === 409 ? 'conflict'
    : status === 429 ? 'throttled'
    : status >= 500 ? 'server'
    : status === 0 ? 'network'
    : error?.kind;
  const resolved = Object.hasOwn(STATES, kind) ? kind : 'unknown';
  return { ...STATES[resolved], kind: resolved };
}
