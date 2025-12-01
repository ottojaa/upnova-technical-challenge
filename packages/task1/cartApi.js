import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CART_PATH = path.join(__dirname, "cart.json");

// Simulate GET /cart.json - Get current cart
async function getCart() {
  const data = await fs.readFile(CART_PATH, "utf-8");
  return JSON.parse(data);
}

// Simulate POST /cart/add - Add item to cart
async function addToCart({ id, price, quantity = 1, title }) {
  const cart = await getCart();

  const existingItem = cart.items.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ id, price, quantity, title });
  }

  cart.total_price = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await fs.writeFile(CART_PATH, JSON.stringify(cart, null, 2));
  return cart;
}

// Simulate POST /cart/update.js - Update cart attributes or quantities
async function updateCart({ attributes, updates }) {
  const cart = await getCart();

  if (attributes) {
    cart.attributes = { ...cart.attributes, ...attributes };
  }

  if (updates) {
    for (const [itemId, quantity] of Object.entries(updates)) {
      const item = cart.items.find((i) => i.id === itemId);
      if (item) {
        if (quantity === 0) {
          // Remove item if quantity is 0
          cart.items = cart.items.filter((i) => i.id !== itemId);
        } else {
          item.quantity = quantity;
        }
      }
    }

    cart.total_price = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  await fs.writeFile(CART_PATH, JSON.stringify(cart, null, 2));
  return cart;
}

async function removeFromCart({ id }) {
  const cart = await getCart();
  cart.items = cart.items.filter((item) => item.id !== id);
  cart.total_price = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  await fs.writeFile(CART_PATH, JSON.stringify(cart, null, 2));
  return cart;
}

async function clearCart() {
  const cart = await getCart();
  cart.items = [];
  cart.total_price = 0;
  await fs.writeFile(CART_PATH, JSON.stringify(cart, null, 2));
  return cart;
}

export { addToCart, clearCart, getCart, removeFromCart, updateCart };
