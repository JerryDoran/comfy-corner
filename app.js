const cartButton = document.querySelector('.cart-btn');
const closeCartButton = document.querySelector('.close-cart');
const clearCartButton = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');

// Declare our array to hold the items that are in our cart
let cart = [];

// Buttons
let buttonsDOM = [];

// Getting the product
class Products {
  async getProducts() {
    try {
      let result = await fetch('products.json');
      let data = await result.json();
      let products = data.items;
      // Mapping the products array to return data fields that mean something to us
      products = products.map(item => {
        // Destructuring the json file to pull out the data we want.
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// UI - For displaying products
class UI {
  displayProducts(products) {
    // console.log(products);
    let result = '';
    products.forEach(product => {
      result += `
        <!-- Single Product -->
        <article class="product">
          <div class="img-container">
            <img
              class="product-img"
              src=${product.image}
              alt="product"
            />
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"> add to cart</i>
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>$${product.price}</h4>
        </article>
        `;
    });
    productsDOM.innerHTML = result;
  }
  getBagButtons() {
    // Using the spread operator to create an array of the bag buttons
    // Doing this prevents us from getting a 'Node list'
    const buttons = [...document.querySelectorAll('.bag-btn')];
    buttonsDOM = buttons;
    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);
      // If an item is in the cart then we will let the user know and disable
      // the button
      if (inCart) {
        button.innerText = ' In Cart';
        button.disabled = true;
      }
      button.addEventListener('click', event => {
        event.target.innerText = ' In Cart';
        // event.target.disabled = true;
        button.disabled = true;

        // Get product from products based on the id of button clicked
        // Destructuring by creating an array using spread operator to return
        // properties of each product clicked on plus an additional property of
        // 'amount' with a default value set to 1 for the cart.
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        // Add products to the cart
        cart = [...cart, cartItem];

        // Save cart in local storage
        Storage.saveCart(cart);

        // Set cart value.  Using key word 'this' because we are in the UI class
        // but in a method of the UI class
        this.setCartValues(cart);

        // Display cart item
        this.addCartItem(cartItem);
        // Show the cart
        // this.showCart();
      });
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `<img src=${item.image} alt="product" />
    <div>
      <h4>${item.title}</h4>
      <h5>$${item.price}</h5>
      <span class="remove-item" data-id=${item.id}>remove</span>
    </div>
    <div>
      <i class="fas fa-chevron-up" data-id=${item.id}></i>
      <p class="item-amount">${item.amount}</p>
      <i class="fas fa-chevron-down" data-id=${item.id}></i>
    </div>`;
    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showCart');
  }

  setupAPP() {
    // Assign values from local storage to the cart array
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartButton.addEventListener('click', this.showCart);
    closeCartButton.addEventListener('click', this.hideCart);
  }

  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showCart');
  }

  cartLogic() {
    // Access the clear cart button
    clearCartButton.addEventListener('click', () => {
      this.clearCart();
    });

    // Cart functionality (remove and increase items).  Need the call back to take
    // an event arg (e) to target the specific event.  This will get us the specific element
    // targeted and we can use that class to specify functionality
    cartContent.addEventListener('click', e => {
      if (e.target.classList.contains('remove-item')) {
        let removeItem = e.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if (e.target.classList.contains('fa-chevron-up')) {
        let addAmount = e.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (e.target.classList.contains('fa-chevron-down')) {
        let minusAmount = e.target;
        let id = minusAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          minusAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(minusAmount.parentElement.parentElement);
          this.removeItem(id);
        }
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      }
    });
  }

  clearCart() {
    // Get id's of all items in cart
    let cartItems = cart.map(item => item.id);

    // Loop over the array of cart items and get id that is in cart to remove
    cartItems.forEach(id => this.removeItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
  }

  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }
}

// Local Storage
class Storage {
  // Save product information in local storage database
  static saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }

  // Get product information from local storage
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'));
    return products.find(product => product.id === id);
  }

  // Save cart items to local storage
  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  // Assign local storage items to the 'cart' array
  static getCart() {
    return localStorage.getItem('cart')
      ? JSON.parse(localStorage.getItem('cart'))
      : [];
  }
}

// This line of code executes when the page is loaded in the browser
document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI();
  const products = new Products();

  // Set up Application
  ui.setupAPP();

  // Get all products
  products
    .getProducts()
    .then(products => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});

// J-Query Menu Animation
$('.menu').on('click', function() {
  $(this).toggleClass('active');
  $('.overlay').toggleClass('menu-open');
});

$('.navbar a').on('click', function() {
  $('.menu').removeClass('active');
  $('.overlay').removeClass('menu-open');
});
