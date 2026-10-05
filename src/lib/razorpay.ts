// Razorpay type definition for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

// Loads Razorpay Checkout once; resolves to whether window.Razorpay is available.
export const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
