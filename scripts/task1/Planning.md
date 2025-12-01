Create a cart chain event manager in js. The cart chain event manager is to modify Shopify's cart via different kinds of actions. A practical example of this is when the cart’s value is over $100, I want to automatically add a gift product to the cart. And maybe after the gift is added, I want to update the cart’s attribute with the gift’s variant id. These actions are obviously asynchronous, happening one after another. And depending on different stores, there might be different chain events.

Implementation examples:

addChainEvent({ name: ‘event name’, action: async (cart /* Shopify cart obj*/) => {
  // ... do something asynchronously here
  return newCart; // returning null or undefined will stop the chain from continueing
} })

startChainEvent(cart /* Shopify cart obj*/) // This ASYNC function trigger the events from the top

getCart() // returns the Shopify cart

Usage examples:

cartEventManager.addChainEvent({
  name: 'CHECK_AND_ADD_GIFT',
  action: async (cart) => {
    // script to check the cart and call /cart/add to add the gift, then call /cart.json to return the newCart. Return null if it's not time to add the gift yet
    return newCart
  }
})

cartEventManager.addChainEvent({
  name: 'UPDATE_CART_ATTRIBUTE',
  action: async (cart) => {
    // call /cart/update.js to update cart attribute and return the newCart
    return newCart
  }
})

const cart = await fetch('/cart.json').then(res => res.json)
await cartEventManager.startChainEvent(cart)
console.log('CHAIN FINISHED');


Create a cartEventManager class that can be used to add chain events and start the chain.