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
  name: "CHECK_AND_ADD_GIFT",
  action: async (cart) => {
    console.log("Checking cart value...");
    // Simulate checking cart and adding gift
    if (cart.total_price > 10000) {
      // over $100 (in cents)
      console.log("Adding gift product...");
      return { ...cart, items: [...cart.items, { id: "gift-123" }] };
    }
    return cart;
  },
});

cartEventManager.addChainEvent({
  name: "UPDATE_CART_ATTRIBUTE",
  action: async (cart) => {
    console.log("Updating cart attributes...");
    // Simulate updating cart attributes
    return { ...cart, attributes: { gift_added: "true" } };
  },
});

// Test the chain
const mockCart = {
  total_price: 15000, // $150
  items: [{ id: "product-1" }],
};

(async () => {
  await cartEventManager.startChainEvent(mockCart);
  console.log("CHAIN FINISHED");
  console.log("Final cart:", cartEventManager.getCart());
})();
