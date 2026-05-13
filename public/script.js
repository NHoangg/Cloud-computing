// Khởi tạo giỏ hàng từ localStorage để đồng bộ giữa các trang
let cart = JSON.parse(localStorage.getItem('neogear_cart')) || [];

function saveCart() {
  localStorage.setItem('neogear_cart', JSON.stringify(cart));
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Cập nhật số lượng trên icon giỏ hàng chung
function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const countEl = document.getElementById('cart-count');
  if(countEl) countEl.innerText = count;
}

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    checkAuth();

    const productRoot = document.getElementById('product-detail-root');
    if (productRoot) {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get('id');
      if (productId) {
        loadProductDetail(productId);
      } else {
        productRoot.innerHTML = '<div style="text-align:center; color: var(--muted); padding: 4rem 0;">Không tìm thấy sản phẩm. Vui lòng quay lại <a href="/products.html">danh sách sản phẩm</a>.</div>';
      }
    }
});

// Chức năng kiểm tra đăng nhập
window.checkAuth = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const loginLinks = document.querySelectorAll('a[href="/login.html"]');
  
  if (currentUser) {
    loginLinks.forEach(link => {
      // Thay thế nút đăng nhập thành thông tin user và nút đăng xuất
      const parentLi = link.parentElement;
      if(parentLi) {
          parentLi.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; color: var(--accent);">
                <span>👋 Chào, <a href="/profile.html" style="color: white; text-decoration: none; border-bottom: 1px dashed white; transition: 0.3s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='white'">${currentUser.fullname}</a></span>
                <a href="#" onclick="logout(event)" style="color: #ff4757; font-size: 0.85rem; border: 1px solid rgba(255, 71, 87, 0.3); padding: 0.2rem 0.6rem; border-radius: 12px; text-decoration: none; transition: 0.3s;" onmouseover="this.style.background='rgba(255, 71, 87, 0.1)'" onmouseout="this.style.background='transparent'">Đăng xuất</a>
            </div>
          `;
      }
    });
  }
}

window.logout = function(e) {
  e.preventDefault();
  localStorage.removeItem('currentUser');
  window.location.reload();
}

// Thêm sản phẩm từ trang chủ (Nút cứng trong index.html)
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    const name = e.target.getAttribute('data-name');
    const price = parseInt(e.target.getAttribute('data-price'));
    const img = e.target.getAttribute('data-img');
    addDynamicToCart(id, name, price, img, e.target);
  });
});

// Hàm dùng chung để thêm sản phẩm
window.addDynamicToCart = function(id, name, price, img, btnElement) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
        window.location.href = '/login.html';
        return;
    }

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id, name, price, img, quantity: 1, isSelected: true });
    }
    saveCart();
    updateCartCount();
    
    if(btnElement) {
        const originalText = btnElement.innerText;
        btnElement.innerText = 'Đã thêm ✓';
        setTimeout(() => { btnElement.innerText = originalText; }, 1000);
    } else {
        alert('Đã thêm sản phẩm vào giỏ hàng!');
    }
}

window.loadProductDetail = function(productId) {
  const root = document.getElementById('product-detail-root');
  if (!root) return;
  root.innerHTML = '<div style="text-align:center; color: var(--muted); padding: 4rem 0;">Đang tải chi tiết sản phẩm...</div>';

  fetch(`/api/products/${encodeURIComponent(productId)}`)
    .then(res => res.json())
    .then(result => {
      if (!result.success || !result.data) {
        root.innerHTML = '<div style="text-align:center; color: red; padding: 4rem 0;">Không tìm thấy sản phẩm. Vui lòng quay lại <a href="/products.html">danh sách sản phẩm</a>.</div>';
        return;
      }

      const p = result.data;
      const description = p.description || `Sản phẩm ${p.name} thuộc danh mục ${p.category}, được thiết kế cho trải nghiệm tiện lợi và hiệu suất cao. Chất lượng hoàn thiện, phù hợp nhu cầu người dùng hiện đại.`;

      root.innerHTML = `
        <div style="display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 2.5rem; align-items: start;">
          <div>
            <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">${p.category}</div>
            <h1 style="margin: 0 0 1rem 0; font-size: 2.4rem; line-height: 1.05;">${p.name}</h1>
            <div style="font-size: 1rem; line-height: 1.8; color: #e3e3e3; margin-bottom: 1.5rem; max-width: 680px;">${description}</div>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
              <span style="padding: 0.75rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.05); color: var(--muted);">Giá: <strong style="color: var(--accent);">${formatPrice(p.price)}</strong></span>
              <span style="padding: 0.75rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.05); color: var(--muted);">Kho còn: <strong>${p.stock}</strong></span>
              <span style="padding: 0.75rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.05); color: var(--muted);">Mã sản phẩm: <strong>${p.id}</strong></span>
            </div>
            <button class="btn btn--primary" onclick="addDynamicToCart('${p.id}', '${p.name}', ${p.price}, '${p.img}', this)" style="padding: 1rem 1.6rem;">Thêm vào giỏ</button>
          </div>
          <div style="border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.5rem; background: rgba(255,255,255,0.03);">
            <div style="font-size: 0.95rem; color: var(--muted); margin-bottom: 1rem;">Thông tin nhanh</div>
            <div style="display: grid; gap: 1rem;">
              <div style="display:flex; justify-content: space-between; color: #fff;"><span>Danh mục</span><strong>${p.category}</strong></div>
              <div style="display:flex; justify-content: space-between; color: #fff;"><span>Giá</span><strong>${formatPrice(p.price)}</strong></div>
              <div style="display:flex; justify-content: space-between; color: #fff;"><span>Tồn kho</span><strong>${p.stock}</strong></div>
              <div style="display:flex; justify-content: space-between; color: #fff;"><span>Mã sản phẩm</span><strong>${p.id}</strong></div>
            </div>
          </div>
        </div>
      `;
    })
    .catch(err => {
      console.error('Không thể tải chi tiết sản phẩm:', err);
      root.innerHTML = '<div style="text-align:center; color: red; padding: 4rem 0;">Lỗi tải chi tiết sản phẩm. Vui lòng thử lại.</div>';
    });
}

// Logic giỏ hàng (Chung cho Modal & Trang Cart)
window.updateQuantity = function(id, delta) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== id);
    }
    saveCart();
    updateCartCount();
    if(typeof renderCart === 'function') renderCart();
    if(typeof renderPageCart === 'function') renderPageCart();
  }
};

window.deleteItem = function(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartCount();
  if(typeof renderCart === 'function') renderCart();
  if(typeof renderPageCart === 'function') renderPageCart();
};

window.toggleSelect = function(id) {
  const item = cart.find(item => item.id === id);
  if(item) item.isSelected = !item.isSelected;
  saveCart();
  if(typeof renderCart === 'function') renderCart();
  if(typeof renderPageCart === 'function') renderPageCart();
};

// ==========================================
// RENDER CHO MODAL GIỎ HÀNG TRONG INDEX.HTML
// ==========================================
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeBtn = document.querySelector('.close-btn');

// Bỏ tính năng mở modal nếu đang nhấn vào link điều hướng thật sự
if(cartBtn && cartModal && cartBtn.getAttribute('href') === '#') {
  cartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    renderCart();
    cartModal.classList.add('show');
  });
}

if(closeBtn) {
  closeBtn.addEventListener('click', () => {
    if(cartModal) cartModal.classList.remove('show');
  });
}

window.renderCart = function() {
  const cartItemsContainer = document.getElementById('cart-items');
  if(!cartItemsContainer) return; // Nếu ko ở trang có modal giỏ hàng thì bỏ qua

  const totalPriceEl = document.getElementById('total-price');
  const selectedCountEl = document.getElementById('selected-count');

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div style="text-align: center; color: var(--muted); margin: 3rem 0; font-size: 1.1rem;">Giỏ hàng của bạn còn trống.</div>';
    if(totalPriceEl) totalPriceEl.innerText = '0đ';
    if(selectedCountEl) selectedCountEl.innerText = '0';
    return;
  }

  let html = '';
  let total = 0;
  let selectedCount = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    if(item.isSelected) { total += itemTotal; selectedCount += item.quantity; }
    
    html += `
      <div style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr 1fr; padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; text-align: center; ${item.isSelected ? 'background: rgba(61, 217, 255, 0.05);' : ''}; cursor: pointer; transition: 0.2s;" onclick="window.location.href='/product.html?id=${item.id}'" onmouseover="this.style.background='rgba(61, 217, 255, 0.1)'" onmouseout="this.style.background='${item.isSelected ? 'rgba(61, 217, 255, 0.05);' : 'transparent'}'">
        <div style="display: flex; align-items: center; gap: 1rem; text-align: left;">
          <input type="checkbox" onchange="event.stopPropagation(); toggleSelect('${item.id}')" ${item.isSelected ? 'checked' : ''} style="cursor:pointer; width: 18px; height: 18px; accent-color: var(--accent);" />
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <h4 style="margin:0; font-size: 0.95rem; font-weight: 500; color: var(--text);">${item.name}</h4>
            <span style="font-size: 0.82rem; color: var(--muted);">Mã: ${item.id}</span>
          </div>
        </div>
        <div style="color: var(--muted);">${formatPrice(item.price)}</div>
        <div style="display: flex; justify-content: center;">
          <div style="display:flex; border: 1px solid var(--accent-soft); border-radius: 4px; overflow: hidden;">
            <button onclick="event.stopPropagation(); updateQuantity('${item.id}', -1)" style="width:28px;height:28px;background:rgba(0,0,0,0.3);border:none;border-right:1px solid var(--accent-soft);color:#fff;cursor:pointer;">-</button>
            <span style="width:40px;height:28px;display:flex;align-items:center;justify-content:center;background:var(--bg-1);">${item.quantity}</span>
            <button onclick="event.stopPropagation(); updateQuantity('${item.id}', 1)" style="width:28px;height:28px;background:rgba(0,0,0,0.3);border:none;border-left:1px solid var(--accent-soft);color:#fff;cursor:pointer;">+</button>
          </div>
        </div>
        <div style="color: var(--accent); font-weight: 600;">${formatPrice(itemTotal)}</div>
        <div style="cursor: pointer; color: #ff6b6b;" onclick="event.stopPropagation(); deleteItem('${item.id}')">Xóa</div>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = html;
  if(totalPriceEl) totalPriceEl.innerText = formatPrice(total);
  if(selectedCountEl) selectedCountEl.innerText = selectedCount;
}

// ==========================================
// RENDER CHO TRANG CART.HTML
// ==========================================
window.renderPageCart = function() {
  const container = document.getElementById('cart-items-page');
  if(!container) return;

  const totalPriceEl = document.getElementById('total-price-page');
  const selectedCountEl = document.getElementById('selected-count-page');

  if (cart.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--muted); margin: 3rem 0; font-size: 1.1rem;">Giỏ hàng trống. Hãy mua thêm sản phẩm nhé!</div>';
    if(totalPriceEl) totalPriceEl.innerText = '0đ';
    if(selectedCountEl) selectedCountEl.innerText = '0';
    return;
  }

  let html = '';
  let total = 0;
  let selectedCount = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    if(item.isSelected) { total += itemTotal; selectedCount += item.quantity; }
    
    html += `
      <div style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr 1fr; padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; text-align: center; ${item.isSelected ? 'background: rgba(61, 217, 255, 0.05);' : ''}; cursor: pointer; transition: 0.2s;" onclick="window.location.href='/product.html?id=${item.id}'" onmouseover="this.style.background='rgba(61, 217, 255, 0.1)'" onmouseout="this.style.background='${item.isSelected ? 'rgba(61, 217, 255, 0.05);' : 'transparent'}'">
        <div style="display: flex; align-items: center; gap: 1rem; text-align: left;">
          <input type="checkbox" onchange="event.stopPropagation(); toggleSelect('${item.id}')" ${item.isSelected ? 'checked' : ''} style="cursor:pointer; width: 18px; height: 18px; accent-color: var(--accent);" />
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <h4 style="margin:0; font-size: 1rem; font-weight: 500; color: var(--text);">${item.name}</h4>
            <span style="font-size: 0.82rem; color: var(--muted);">Mã: ${item.id}</span>
          </div>
        </div>
        <div style="color: var(--muted);">${formatPrice(item.price)}</div>
        <div style="display: flex; justify-content: center;">
          <div style="display:flex; border: 1px solid var(--accent-soft); border-radius: 4px; overflow: hidden;">
            <button onclick="event.stopPropagation(); updateQuantity('${item.id}', -1)" style="width:32px;height:32px;background:rgba(0,0,0,0.3);border:none;border-right:1px solid var(--accent-soft);color:#fff;cursor:pointer;">-</button>
            <span style="width:50px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg-1);">${item.quantity}</span>
            <button onclick="event.stopPropagation(); updateQuantity('${item.id}', 1)" style="width:32px;height:32px;background:rgba(0,0,0,0.3);border:none;border-left:1px solid var(--accent-soft);color:#fff;cursor:pointer;">+</button>
          </div>
        </div>
        <div style="color: var(--accent); font-weight: 600;">${formatPrice(itemTotal)}</div>
        <div style="cursor: pointer; color: #ff6b6b; font-weight: 500;" onclick="event.stopPropagation(); deleteItem('${item.id}')">Xóa</div>
      </div>
    `;
  });

  container.innerHTML = html;
  if(totalPriceEl) totalPriceEl.innerText = formatPrice(total);
  if(selectedCountEl) selectedCountEl.innerText = selectedCount;
}

// ==========================================
// RENDER CHO TRANG CHECKOUT.HTML
// ==========================================
window.renderCheckoutPage = function() {
    const container = document.getElementById('checkout-items');
    if(!container) return;

    const selectedItems = cart.filter(item => item.isSelected);
    if(selectedItems.length === 0) {
        container.innerHTML = '<div style="color: var(--muted); padding: 1rem;">Không có sản phẩm nào. Vui lòng quay lại giỏ hàng.</div>';
        document.getElementById('submit-order-btn').disabled = true;
        document.getElementById('submit-order-btn').style.opacity = '0.5';
        return;
    }

    let html = '';
    let total = 0;
    selectedItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; background: rgba(0,0,0,0.2); padding: 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.2s; position: relative;" onmouseover="this.style.background='rgba(61, 217, 255, 0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'" onclick="window.location.href='/product.html?id=${item.id}'">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.3rem;">
                    <div style="font-size: 0.95rem; color: var(--text); font-weight: 500; margin-bottom: 0.3rem;">${item.name}</div>
                    <div style="font-size: 0.85rem; color: var(--muted);">Số lượng: ${item.quantity}</div>
                </div>
                <div style="font-weight: 600; color: var(--accent);">${formatPrice(itemTotal)}</div>
            </div>
        `;
    });
    container.innerHTML = html;
    document.getElementById('chk-subtotal').innerText = formatPrice(total);
    document.getElementById('chk-total').innerText = formatPrice(total);

    // Tự động điền thông tin nếu từ trang profile
    const params = new URLSearchParams(window.location.search);
    if(params.get('autofill') === 'true') {
      setTimeout(() => loadSavedUserInfo(), 500);
    }
}

// Sự kiện Select All (Dùng chung)
const selectAllCheckbox = document.getElementById('select-all');
if(selectAllCheckbox) {
  selectAllCheckbox.addEventListener('change', (e) => {
    cart.forEach(item => item.isSelected = e.target.checked);
    saveCart();
    if(typeof renderCart === 'function') renderCart();
    if(typeof renderPageCart === 'function') renderPageCart();
  });
}

// ==========================================
// HÀM LOAD THÔNG TIN KHÁCH HÀNG ĐÃ LƯU
// ==========================================
window.loadSavedUserInfo = function() {
  const userProfile = JSON.parse(localStorage.getItem('userProfile'));
  
  if(!userProfile || (!userProfile.name && !userProfile.phone && !userProfile.address)) {
    alert('Bạn chưa có thông tin lưu. Vui lòng truy cập trang Hồ sơ để cập nhật.');
    window.location.href = '/user.html';
    return;
  }

  // Điền thông tin vào form checkout
  const nameField = document.getElementById('chk-name');
  const phoneField = document.getElementById('chk-phone');
  const addressField = document.getElementById('chk-address');

  if(nameField) nameField.value = userProfile.name || '';
  if(phoneField) phoneField.value = userProfile.phone || '';
  if(addressField) addressField.value = userProfile.address || '';

  // Thông báo thành công
  const notification = document.createElement('div');
  notification.innerHTML = '✓ Đã tải thông tin khách hàng!';
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(76, 209, 55, 0.9);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
