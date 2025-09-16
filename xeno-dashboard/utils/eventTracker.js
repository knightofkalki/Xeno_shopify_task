const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xeno-shopify-task-pra7-git-main-boardlys-projects.vercel.app';

export const trackEvent = async (eventType, eventData, tenantId = '1') => {
  try {
    await fetch(`${BACKEND_URL}/api/events/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        eventType,
        eventData,
        userId: `user_${Date.now()}`,
        sessionId: `session_${Date.now()}`
      })
    });
  } catch (error) {
    console.error('Event tracking failed:', error);
  }
};

// Pre-defined event types
export const EVENTS = {
  CART_ABANDONMENT: 'cart_abandonment',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_ADDED_TO_CART: 'product_added_to_cart'
};
