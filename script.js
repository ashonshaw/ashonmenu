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

// 简单的 MD5 实现（用于又拍云签名）
function md5(str) {
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        } else return (lResult ^ lX8 ^ lY8);
    }
    function f(x, y, z) { return (x & y) | ((~x) & z); }
    function g(x, y, z) { return (x & z) | (y & (~z)); }
    function h(x, y, z) { return (x ^ y ^ z); }
    function i(x, y, z) { return (y ^ (x | (~z))); }
    function ff(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function gg(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function hh(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function ii(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function convertToWordArray(str) {
        var lWordCount;
        var lMessageLength = str.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }
    function wordToHex(lValue) {
        var wordToHexValue = "", wordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
        }
        return wordToHexValue;
    }
    var x = Array();
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    x = convertToWordArray(str);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = ff(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = ff(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = ff(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = ff(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = ff(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = ff(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = ff(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = ff(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = ff(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = ff(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = ff(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = ff(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = ff(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = ff(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = ff(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = ff(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = gg(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = gg(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = gg(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = gg(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = gg(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = gg(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = gg(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = gg(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = gg(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = gg(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = gg(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = gg(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = gg(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = gg(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = gg(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = hh(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = hh(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = hh(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = hh(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = hh(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = hh(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = hh(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = hh(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = hh(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = hh(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = hh(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = hh(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = hh(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = hh(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = hh(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = hh(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = ii(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = ii(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = ii(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = ii(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = ii(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = ii(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = ii(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = ii(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = ii(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = ii(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = ii(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = ii(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = ii(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = ii(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = ii(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = ii(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

async function uploadToUpYun(base64Data) {
    const bucket = 'ashonmenu';
    const operator = 'ashonshaw';
    const password = '7NXR53nJlX1TIvMz78KSmw1crf8uxvKU';
    const domain = 'ashonmenu.test.upcdn.net';
    
    const fileName = `dish-images/${Date.now()}.jpg`;
    const uri = `/${bucket}/${fileName}`;
    const url = `https://v0.api.upyun.com${uri}`;
    
    const blob = await fetch(base64Data).then(r => r.blob());
    
    // 按照 PHP 代码的签名方式
    const method = 'PUT';
    const date = new Date().toUTCString();
    
    // 签名：先对密码做 MD5，然后用 HMAC-SHA1 签名
    const passwordMD5 = md5(password);
    
    // 签名字符串：PUT&uri&date
    const signStr = `${method}&${uri}&${date}`;
    
    // 使用 HMAC-SHA1，密钥是密码的 MD5
    const encoder = new TextEncoder();
    const signData = encoder.encode(signStr);
    const keyData = encoder.encode(passwordMD5);
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, signData);
    const signatureArray = new Uint8Array(signature);
    const signatureHex = Array.from(signatureArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    const signatureBase64 = btoa(signatureHex);
    
    console.log('上传参数:', {
        url,
        method,
        uri,
        date,
        operator,
        signature: signatureBase64
    });
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': 'UPYUN ' + operator + ':' + signatureBase64,
            'Date': date
        },
        body: blob
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        throw new Error('上传失败：' + response.statusText + ' - ' + errorText);
    }
    
    return `https://${domain}/${fileName}`;
}
