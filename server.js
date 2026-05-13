const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- DATABASE MÔ PHỎNG (In-memory) ---
// Dữ liệu sản phẩm với quản lý tồn kho
const safeImgs = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1527814050087-379381547969?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1527443154391-4207908b8b98?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544281679-1149e917d598?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80'
];

const categories = ['Audio', 'Accessories', 'Chargers', 'Displays', 'Cables', 'Wearables', 'Bags', 'Storage', 'Gaming'];
const productNames = [
  'Tai nghe ANC Pro X', 'Bàn phím cơ Aurora 75', 'Sạc GaN 100W NeoCharge', 'Chuột không dây Silent', 
  'Màn hình cong UltraWide 34"', 'Loa Bluetooth Bass Boost', 'Webcam 4K Pro Streamer', 'Microphone USB Podcaster', 
  'Tai nghe Thể thao Kháng Nước', 'Sạc dự phòng 20000mAh PD', 'Đế tản nhiệt Laptop RGB', 'Hub USB-C 8-in-1 Aluminum', 
  'Bàn di chuột Gaming XL', 'Cáp HDMI 2.1 Bọc Dù Siêu Bền', 'Giá đỡ điện thoại Hợp kim Nhôm', 'Đồng hồ thông minh Fitness+', 
  'Balo Laptop Chống Nước', 'Tai nghe True Wireless Earbuds', 'Ổ cứng SSD Portable 1TB', 'Bộ vệ sinh màn hình chuyên dụng', 
  'Tay cầm chơi game Wireless Pro', 'Loa Soundbar Mini', 'Router Wifi 6 Gigabit', 'USB 3.2 Flash Drive 128GB',
  'Đèn LED kẹp màn hình', 'Bàn phím số Numpad Không Dây', 'Bút cảm ứng Stylus Pen', 'Kính thực tế ảo VR Headset',
  'Thẻ nhớ MicroSDXC 256GB', 'Găng tay chơi game Mobile', 'Vỏ case máy tính Mini ITX', 'Quạt tản nhiệt điện thoại',
  'Tấm che Webcam', 'Cáp sạc đa năng 3-in-1', 'Bao da chống sốc Laptop 14"', 'Giá treo tai nghe RGB',
  'Đầu đọc thẻ nhớ đa năng', 'Miếng dán màn hình chống nhìn trộm', 'Dây đeo thay thế Apple Watch', 'Sạc không dây Magnetic 15W'
];

const products = productNames.map((name, idx) => ({
  id: (idx + 1).toString(),
  name: name,
  price: Math.floor(Math.random() * 40 + 5) * 50000,
  category: categories[idx % categories.length],
  stock: Math.floor(Math.random() * 150 + 10),
  img: safeImgs[idx % safeImgs.length]
}));

// Lưu trữ các đơn hàng
const orders = [];

// Lưu trữ thông tin khách hàng (In-memory, thực tế nên dùng Database)
const userProfiles = {}; // Key: userId hoặc sessionId, Value: thông tin khách hàng

// --- MIDDLEWARE & UTILS ---
// Kiểm tra hệ thống
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// --- API ENDPOINTS (ECOMMERCE STANDARD) ---

// 1. Lấy danh sách sản phẩm (Hỗ trợ lọc & tìm kiếm)
app.get('/api/products', (req, res) => {
  const { search, category, sort } = req.query;
  let result = [...products];

  if (category) {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }
  if (sort === 'price_asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    result.sort((a, b) => b.price - a.price);
  }

  res.json({ success: true, count: result.length, data: result });
});

// 2. Lấy chi tiết một sản phẩm theo ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
  }
  res.json({ success: true, data: product });
});

// 3. Kiểm tra tính hợp lệ của giỏ hàng (Validate tồn kho & giá)
app.post('/api/cart/validate', (req, res) => {
  const { cart } = req.body; // Client gửi lên: [{ id, quantity }]
  if (!cart || !Array.isArray(cart)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu giỏ hàng không hợp lệ' });
  }

  let total = 0;
  const validatedCart = [];
  const outOfStockItems = [];

  for (const item of cart) {
    const product = products.find(p => p.id === item.id);
    if (!product) continue;

    if (item.quantity > product.stock) {
      outOfStockItems.push(product.name);
    } else {
      total += product.price * item.quantity;
      validatedCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      });
    }
  }

  if (outOfStockItems.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Sản phẩm không đủ số lượng trong kho: ${outOfStockItems.join(', ')}` 
    });
  }

  res.json({ success: true, validatedCart, total });
});

// 4. Xử lý đặt hàng (Checkout)
app.post('/api/checkout', (req, res) => {
  const { name, phone, address, cart, paymentMethod } = req.body;
  
  if (!name || !phone || !cart || cart.length === 0) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin giao hàng hoặc giỏ hàng trống!' });
  }

  // Xác thực lại giá tiền và tồn kho từ phía server (Bảo mật, chống gian lận)
  let calculatedTotal = 0;
  const orderDetails = [];

  for (const item of cart) {
    const product = products.find(p => p.id === item.id || p.name === item.name); // Hỗ trợ fallback cho font-end cũ
    if (!product) {
        return res.status(400).json({ success: false, message: `Sản phẩm ${item.name || item.id} không tồn tại` });
    }
    
    if (item.quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Sản phẩm ${product.name} đã hết hàng hoặc không đủ số lượng` });
    }

    calculatedTotal += product.price * item.quantity;
    orderDetails.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity
    });
  }

  // Trừ số lượng tồn kho (Deduct stock)
  orderDetails.forEach(item => {
    const p = products.find(prod => prod.id === item.productId);
    if(p) p.stock -= item.quantity;
  });

  // Tạo mã đơn hàng độc nhất
  const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const newOrder = {
    orderId,
    customer: { name, phone, address },
    items: orderDetails,
    total: calculatedTotal,
    paymentMethod: paymentMethod === 'BANK' ? 'BANK_TRANSFER' : 'COD',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  // Lưu vào "Database"
  orders.push(newOrder);

  // In log ra console hệ thống
  console.log('\n=== HỆ THỐNG E-COMMERCE: CÓ ĐƠN HÀNG MỚI ===');
  console.log(`Mã đơn: ${newOrder.orderId}`);
  console.log(`Khách hàng: ${name} (${phone})`);
  console.log(`Địa chỉ: ${address}`);
  console.log(`Tổng thanh toán: ${calculatedTotal.toLocaleString('vi-VN')}đ`);
  console.log(`Phương thức: ${newOrder.paymentMethod}`);
  console.log('Chi tiết sản phẩm:');
  orderDetails.forEach(i => console.log(` - ${i.name} x${i.quantity} (${i.price.toLocaleString('vi-VN')}đ/sp)`));
  console.log('============================================\n');

  res.status(200).json({ 
    success: true, 
    message: 'Đặt hàng và thanh toán thành công!',
    orderId: newOrder.orderId,
    total: newOrder.total
  });
});

// 5. Lấy thông tin đơn hàng theo ID
app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  res.json({ success: true, data: order });
});

// 6. API QUẢN LÝ THÔNG TIN KHÁCH HÀNG (USER PROFILE) ===

// 6.1 Lấy thông tin hồ sơ khách hàng
app.get('/api/user/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = userProfiles[userId];
  
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng' });
  }
  
  res.json({ success: true, data: profile });
});

// 6.2 Lưu hoặc cập nhật hồ sơ khách hàng
app.post('/api/user/profile', (req, res) => {
  const { userId, name, phone, address, email } = req.body;
  
  if (!userId || !name || !phone || !address) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
  }
  
  // Kiểm tra định dạng số điện thoại
  if (!/^[0-9\-\+\s]{10,}$/.test(phone)) {
    return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
  }
  
  const profile = {
    userId,
    name,
    phone,
    address,
    email: email || '',
    createdAt: userProfiles[userId]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  userProfiles[userId] = profile;
  
  res.status(200).json({ 
    success: true, 
    message: 'Đã lưu thông tin hồ sơ khách hàng',
    data: profile
  });
});

// 6.3 Xóa hồ sơ khách hàng
app.delete('/api/user/profile/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (!userProfiles[userId]) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng' });
  }
  
  delete userProfiles[userId];
  
  res.json({ success: true, message: 'Đã xóa hồ sơ khách hàng' });
});

app.listen(PORT, () => {
  console.log(`🚀 E-Commerce Backend running at http://localhost:${PORT}`);
});
