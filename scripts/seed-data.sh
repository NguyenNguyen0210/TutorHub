#!/usr/bin/env bash
# ==============================================================================
# TutorHub Seed Data Loader Script
# Nạp dữ liệu mẫu từ src/backend/seedData.sql vào PostgreSQL container
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SQL_FILE="${ROOT_DIR}/src/backend/seedData.sql"
ENV_FILE="${ROOT_DIR}/.env"

# Load default config or from .env
POSTGRES_USER="tutorhub"
POSTGRES_DB="tutorhub"
CONTAINER_NAME="tutorhub-postgres"

if [ -f "$ENV_FILE" ]; then
    # Read variables if defined
    USER_FROM_ENV=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '\r"' || true)
    DB_FROM_ENV=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '\r"' || true)
    [ -n "$USER_FROM_ENV" ] && POSTGRES_USER="$USER_FROM_ENV"
    [ -n "$DB_FROM_ENV" ] && POSTGRES_DB="$DB_FROM_ENV"
fi

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Lỗi: Không tìm thấy file $SQL_FILE"
    exit 1
fi

# 1. Kiểm tra container Postgres có đang chạy không
echo "🔍 Đang kiểm tra container $CONTAINER_NAME..."
if ! docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" --format '{{.Names}}' | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Lỗi: Container '${CONTAINER_NAME}' chưa được khởi chạy!"
    echo "💡 Hãy chạy lệnh: docker compose up -d postgres"
    exit 1
fi

# 2. Kiểm tra xem Migration đã được áp dụng chưa (kiểm tra bảng Users)
echo "🔍 Kiểm tra trạng thái schema database..."
if ! docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select to_regclass('public.\"Users\"')" 2>/dev/null | grep -q "Users"; then
    echo "⚠️  Cảnh báo: Bảng 'Users' chưa tồn tại trong database!"
    echo "💡 Bạn cần chạy EF Core Migration trước khi seed data:"
    echo "   dotnet ef database update --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api"
    echo "   (Hoặc đợi container tutorhub-api khởi động hoàn tất nếu chạy full docker compose)"
    exit 1
fi

# 3. Xác nhận trước khi TRUNCATE (trừ khi có cờ --force hoặc -y)
AUTO_CONFIRM=false
for arg in "$@"; do
    if [ "$arg" == "-y" ] || [ "$arg" == "--force" ]; then
        AUTO_CONFIRM=true
    fi
done

if [ "$AUTO_CONFIRM" = false ]; then
    echo "⚠️  CẢNH BÁO: Thao tác này sẽ TRUNCATE (xóa sạch) dữ liệu hiện tại trong DB và nạp lại seedData.sql!"
    read -p "👉 Bạn có chắc chắn muốn tiếp tục? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "🚫 Đã hủy thao tác."
        exit 0
    fi
fi

# 4. Thực thi nạp seedData.sql
echo "⏳ Đang nạp dữ liệu từ seedData.sql vào database '$POSTGRES_DB'..."
docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q < "$SQL_FILE"

echo "✅ Nạp dữ liệu mẫu thành công!"
echo "🔑 Mật khẩu mặc định cho tất cả tài khoản test: Test@123"

