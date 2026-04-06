const firebaseConfig = {
    apiKey: "AIzaSyA8wF1J93bQxPSJimjFFvCwI7MUK4IKZ3I",
    authDomain: "ashonmenu.firebaseapp.com",
    databaseURL: "https://ashonmenu-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ashonmenu",
    storageBucket: "ashonmenu.firebasestorage.app",
    messagingSenderId: "442441864874",
    appId: "1:442441864874:web:909e3dbdeac7cc4af3a2d3",  
    measurementId: "G-4Y1DE9LCL4"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let dishes = [];
let orders = [];
let cart = [];
let currentCategory = '全部';
let currentImageData = null;

const categories = ['全部', '猪肉类', '排骨类', '禽肉类', '水产类', '西餐类', '牛肉类', '蛋类', '蔬菜类', '其他类'];

const loginScreen = document.getElementById('login-screen');
const shopScreen = document.getElementById('shop-screen');
const addDishScreen = document.getElementById('add-dish-screen');
const customerScreen = document.getElementById('customer-screen');
const orderSuccessScreen = document.getElementById('order-success-screen');

function listenToDishes() {
    database.ref('dishes').on('value', (snapshot) => {
        const data = snapshot.val();
        dishes = data ? Object.values(data) : [];
        renderDishList();
        renderCustomerDishList();
    });
}

function listenToOrders() {
    database.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        orders = data ? Object.values(data) : [];
        renderOrderList();
    });
}

listenToDishes();
listenToOrders();

document.getElementById('chef-btn').addEventListener('click', () => {
    loginScreen.style.display = 'none';
    shopScreen.style.display = 'block';
    renderDishList();
    renderOrderList();
});

document.getElementById('customer-btn').addEventListener('click', () => {
    loginScreen.style.display = 'none';
    customerScreen.style.display = 'block';
    renderCategoryTabs();
    renderCustomerDishList();
    renderCart();
});

document.getElementById('back-to-login-shop').addEventListener('click', () => {
    shopScreen.style.display = 'none';
    loginScreen.style.display = 'block';
});

document.getElementById('back-to-login-customer').addEventListener('click', () => {
    customerScreen.style.display = 'none';
    loginScreen.style.display = 'block'; 
    cart = [];
});

document.getElementById('add-dish-btn').addEventListener('click', () => {
    shopScreen.style.display = 'none';
    addDishScreen.style.display = 'block';
    currentImageData = null;
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';
});
                        
document.getElementById('dish-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImageData = event.target.result;
            document.getElementById('image-preview').src = currentImageData;
            document.getElementById('image-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}); 

let editingDishId = null;

document.getElementById('save-dish').addEventListener('click', async () => {
    const name = document.getElementById('dish-name').value;
    const category = document.getElementById('dish-category').value;

    if (name) {
        try {
            let imageUrl = null;
            if (currentImageData) {
                imageUrl = await uploadToUpYun(currentImageData);
            }
            
            if (editingDishId) {
                const dishToUpdate = dishes.find(dish => dish.id === editingDishId);
                if (dishToUpdate) {
                    const updatedDish = {
                        id: editingDishId,
                        name,
                        category,
                        imageUrl: imageUrl || dishToUpdate.imageUrl
                    };
                    await database.ref(`dishes/${editingDishId}`).set(updatedDish);
                }
                editingDishId = null;
            } else {
                const newDishId = Date.now().toString();
                const newDish = {
                    id: newDishId,
                    name,
                    category,
                    imageUrl: imageUrl
                };
                await database.ref(`dishes/${newDishId}`).set(newDish);
            }
            
            document.getElementById('dish-name').value = '';
            document.getElementById('dish-image').value = '';
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('image-preview').src = '';
            currentImageData = null;
            
            addDishScreen.style.display = 'none';
            shopScreen.style.display = 'block';
        } catch (error) {
            console.error('Error saving dish:', error);
            alert('保存失败，请重试！');
        }
    }
});

document.getElementById('cancel-add-dish').addEventListener('click', () => {
    addDishScreen.style.display = 'none';
    shopScreen.style.display = 'block';
    editingDishId = null;
    currentImageData = null;
    document.getElementById('dish-name').value = '';
    document.getElementById('dish-image').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';
});

function editDish(dishId) {
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
        editingDishId = dishId;
        document.getElementById('dish-name').value = dish.name;
        document.getElementById('dish-category').value = dish.category;
        
        if (dish.imageUrl) {
            currentImageData = dish.imageUrl;
            document.getElementById('image-preview').src = dish.imageUrl;
            document.getElementById('image-preview').style.display = 'block';
        } else {
            currentImageData = null;
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('image-preview').src = '';
        }
        
        addDishScreen.style.display = 'block';
        shopScreen.style.display = 'none';
    }
}

function deleteDish(dishId) {
    if (confirm('确定要删除这个菜品吗？')) {
        database.ref(`dishes/${dishId}`).remove();
    }
}

function renderDishList() {
    const dishList = document.getElementById('dish-list');
    dishList.innerHTML = '';
    
    dishes.forEach(dish => {
        const dishItem = document.createElement('div');
        dishItem.className = 'dish-item';
        const imageHtml = dish.imageUrl 
            ? `<img src="${dish.imageUrl}" class="dish-image">` 
            : '<div class="no-image">暂无图片</div>';
        dishItem.innerHTML = `
            ${imageHtml}
            <h4>${dish.name}</h4>
            <div class="category">${dish.category}</div>
            <button class="edit-dish" data-id="${dish.id}">修改</button>
            <button class="delete-dish" data-id="${dish.id}">删除</button>
        `;
        dishList.appendChild(dishItem);
    });
    
    document.querySelectorAll('.edit-dish').forEach(button => {
        button.addEventListener('click', () => {
            const dishId = button.dataset.id;
            editDish(dishId);
        });
    });
    
    document.querySelectorAll('.delete-dish').forEach(button => {
        button.addEventListener('click', () => {
            const dishId = button.dataset.id;
            deleteDish(dishId);
        });
    });
}

function renderOrderList() {
    const orderList = document.getElementById('order-list');
    orderList.innerHTML = '';
    
    if (orders.length === 0) {
        orderList.innerHTML = '<p>暂无订单</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        let orderItemsHTML = '';
        order.items.forEach(item => {
            orderItemsHTML += `${item.name} x ${item.quantity}<br>`;
        });
        orderItem.innerHTML = `
            <h4>订单 #${order.id}</h4>
            <div>${orderItemsHTML}</div>
            <div>时间：${new Date(order.time).toLocaleString()}</div>
        `;
        orderList.appendChild(orderItem);
    });
}

function renderCategoryTabs() {
    const categoryTabs = document.getElementById('category-tabs');
    categoryTabs.innerHTML = '';
    
    categories.forEach(category => {
        const tab = document.createElement('div');
        tab.className = `category-tab ${category === currentCategory ? 'active' : ''}`;
        tab.textContent = category;
        tab.addEventListener('click', () => {
            currentCategory = category;
            renderCategoryTabs();
            renderCustomerDishList();
        });
        categoryTabs.appendChild(tab);
    });
}

function renderCustomerDishList() {
    const dishList = document.getElementById('customer-dish-list');
    dishList.innerHTML = '';
    
    const filteredDishes = currentCategory === '全部' 
        ? dishes 
        : dishes.filter(dish => dish.category === currentCategory);
    
    filteredDishes.forEach(dish => {
        const dishItem = document.createElement('div');
        dishItem.className = 'dish-item';
        const imageHtml = dish.imageUrl 
            ? `<img src="${dish.imageUrl}" class="dish-image">` 
            : '<div class="no-image">暂无图片</div>';
        dishItem.innerHTML = `
            ${imageHtml}
            <h4>${dish.name}</h4>
            <div class="category">${dish.category}</div>
            <button class="add-to-cart" data-id="${dish.id}">加入购物车</button>
        `;
        dishList.appendChild(dishItem);
    });
    
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const dishId = button.dataset.id;
            addToCart(dishId);
        });
    });
}

function addToCart(dishId) {
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
        const existingItem = cart.find(item => item.id === dishId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: dish.id,
                name: dish.name,
                quantity: 1
            });
        }
        renderCart();
    }
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    cartItems.innerHTML = '';
    
    let total = 0;
    cart.forEach(item => {
        total += item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <button class="remove-from-cart" data-id="${item.id}">删除</button>
        `;
        cartItems.appendChild(itemEl);
    });
    
    totalPriceEl.textContent = `总价：${total} 道菜`;
    
    document.querySelectorAll('.remove-from-cart').forEach(button => {
        button.addEventListener('click', () => {
            const dishId = button.dataset.id;
            removeFromCart(dishId);
        });
    });
}

function removeFromCart(dishId) {
    const index = cart.findIndex(item => item.id === dishId);
    if (index !== -1) {
        cart.splice(index, 1);
        renderCart();
    }
}

document.getElementById('submit-order').addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('购物车是空的！');
        return;
    }
    
    const newOrderId = Date.now().toString();
    const newOrder = {
        id: newOrderId,
        items: cart,
        time: new Date().toISOString()
    };
    
    await database.ref(`orders/${newOrderId}`).set(newOrder);
    
    cart = [];
    customerScreen.style.display = 'none';
    orderSuccessScreen.style.display = 'block';
    
    setTimeout(() => {
        orderSuccessScreen.style.display = 'none';
        loginScreen.style.display = 'block';
    }, 2000);
});

async function uploadToUpYun(base64Data) {
    const bucket = 'ashonmenu';
    const operator = 'ashonshaw';
    const password = '7NXR53nJlX1TIvMz78KSmw1crf8uxvKU';
    const domain = 'ashonmenu.test.upcdn.net';
    
    const fileName = `dish-images/${Date.now()}.jpg`;
    const uri = `/${bucket}${fileName}`;
    const url = `http://v0.api.upyun.com${uri}`;
    
    const blob = await fetch(base64Data).then(r => r.blob());
    
    // 按照 PHP 代码的签名方式
    const method = 'PUT';
    const date = new Date().toUTCString();
    
    // 签名：先对密码做 MD5，然后用 HMAC-SHA1 签名
    const encoder = new TextEncoder();
    const passwordBytes = await crypto.subtle.digest('MD5', encoder.encode(password));
    const passwordArray = new Uint8Array(passwordBytes);
    
    // 签名字符串：PUT&uri&date
    const signStr = `${method}&${uri}&${date}`;
    const signData = encoder.encode(signStr);
    
    // 使用 HMAC-SHA1，密钥是密码的 MD5
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        passwordArray,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, signData);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': 'UPYUN ' + operator + ':' + signatureBase64,
            'Date': date
        },
        body: blob
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error('上传失败：' + response.statusText + ' - ' + errorText);
    }
    
    return `http://${domain}${fileName}`;
}
