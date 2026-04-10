# NeoGear - Web bán phụ kiện điện tử (Node.js)

Landing page e-commerce theo tông màu xanh đậm + neon cyan, lấy cảm hứng từ hình mẫu bạn cung cấp.

## Chạy local

```bash
npm install
npm start
```

Mở: `http://localhost:3000`

## Cấu trúc

- `server.js`: Node.js + Express server.
- `public/index.html`: giao diện chính.
- `public/styles.css`: style theo tông màu dark-tech.
- `Dockerfile`: đóng gói container để deploy cloud.

## Deploy lên AWS

### Cách 1: AWS App Runner (đơn giản nhất)

1. Push code lên GitHub.
2. AWS Console → App Runner → Create service.
3. Source: chọn GitHub repo này.
4. Build command: `npm install`
5. Start command: `npm start`
6. Port: `3000`
7. Deploy.

### Cách 2: ECS Fargate (container)

1. Build image:
   ```bash
   docker build -t neogear .
   ```
2. Push image lên ECR.
3. Tạo ECS Task Definition (port 3000).
4. Tạo ECS Service (Fargate) + ALB.
5. Health check endpoint: `/health`.

## Health check

- `GET /health` → `{"status":"ok"}`
