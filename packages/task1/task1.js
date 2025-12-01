import { addToCart, clearCart, getCart } from "./cartApi.js";

class CartChainEventManager {
  constructor() {
    this.events = [];
    this.currentCart = null;
  }

  addChainEvent({ name, action }) {
    if (!name || !action || typeof action !== "function") {
      throw new Error("Event must have a name and an action function");
    }
    this.events.push({ name, action });
  }

  async startChainEvent(cart) {
    this.currentCart = cart;

    for (const event of this.events) {
      console.log(`Running event: ${event.name}`);
      const result = await event.action(this.currentCart);

      if (result === null || result === undefined) {
        console.log(`Chain stopped at: ${event.name}`);
        break;
      }

      this.currentCart = result;
    }

    return this.currentCart;
  }

  getCart() {
    return this.currentCart;
  }
}

// Example usage
const cartEventManager = new CartChainEventManager();

cartEventManager.addChainEvent({
  name: "CLEAR_CART",
  action: async () => {
    console.log("Clearing cart...");
    const newCart = await clearCart();
    return newCart;
  },
});

cartEventManager.addChainEvent({
  name: "ADD_ITEM",
  action: async (cart) => {
    console.log("Adding item to cart...");
    // Call /cart/add to add a new item
    const newCart = await addToCart({
      id: "product-2",
      price: 5000,
      quantity: 1,
      title: "Product 2",
    });
    return newCart;
  },
});

cartEventManager.addChainEvent({
  name: "ADD_ITEM",
  action: async (cart) => {
    console.log("Adding item to cart...");
    // Call /cart/add to add a new item
    const newCart = await addToCart({
      id: "product-2",
      price: 6000,
      quantity: 1,
      title: "Product 2",
    });
    return newCart;
  },
});

cartEventManager.addChainEvent({
  name: "CHECK_AND_ADD_GIFT",
  action: async (cart) => {
    console.log("Checking cart value...");

    if (cart.total_price > 10000) {
      console.log("Adding gift product...");
      const newCart = await addToCart({
        id: "gift-123",
        price: 0,
        quantity: 1,
        title: "Free Gift",
      });
      return newCart;
    }

    return null;
  },
});

cartEventManager.addChainEvent({
  name: "CLEAR_CART",
  action: async (cart) => {
    console.log("Clearing cart...");
    const newCart = await clearCart();
    return newCart;
  },
});

cartEventManager.addChainEvent({
  name: "CHECK_AND_ADD_GIFT",
  action: async (cart) => {
    console.log("Checking cart value...");

    if (cart.total_price > 10000) {
      console.log("Adding gift product...");
      const newCart = await addToCart({
        id: "gift-123",
        price: 0,
        quantity: 1,
        title: "Free Gift",
      });
      return newCart;
    }

    return null;
  },
});

(async () => {
  // Fetch the current cart from /cart.json
  const cart = await getCart();
  console.log("Initial cart:", cart);

  // Start the chain event
  await cartEventManager.startChainEvent(cart);

  console.log("CHAIN FINISHED");
  console.log("Final cart:", cartEventManager.getCart());
})();
