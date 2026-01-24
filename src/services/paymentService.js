
const BASE_API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Creates a new order on the backend.
 * @param {number} amount - The amount for the order.
 * @returns {Promise<any>} - The order data from the server.
 */
export const createOrder = async (amount) => {
  const response = await fetch(`${BASE_API_URL}/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create order: ${errorText}`);
  }

  return response.json();
};

/**
 * Verifies the payment signature on the backend.
 * @param {object} paymentData - The payment data to be verified.
 * @returns {Promise<any>} - The verification result from the server.
 */
export const verifyPayment = async (paymentData) => {
  const response = await fetch(`${BASE_API_URL}/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to verify payment: ${errorText}`);
  }

  return response.json();
};

/**
 * Loads the Razorpay SDK script dynamically.
 * @returns {Promise<boolean>} - True if the script is loaded, otherwise false.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Handles the entire Razorpay payment flow.
 * @param {object} user - The user object.
 * @param {number} amount - The payment amount.
 * @param {string} description - A description for the payment.
 */
export const handlePayment = async ({ user, amount, description }) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Failed to load payment gateway. Please try again.');
    return;
  }

  try {
    const { order } = await createOrder(amount);
    
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount, 
      currency: order.currency,
      name: 'SolOS',
      description,
      order_id: order.id,
      handler: async function (response) {
        try {
          await verifyPayment({
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          alert('Payment successful!');
          // Here, you might want to redirect the user or update the UI.
        } catch (error) {
          console.error("Payment verification failed:", error);
          alert('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: user?.displayName || 'Anonymous User',
        email: user?.email || '',
      },
      theme: {
        color: '#10b981',
      },
      modal: {
        ondismiss: function () {
          console.log('Payment cancelled');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error("Payment initiation failed:", error);
    alert('Could not initiate payment. Please try again later.');
  }
};
