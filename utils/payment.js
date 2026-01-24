// Utility to load Razorpay SDK
// This handles BOTH Razorpay and is called from the PricingModal.

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const handleRazorpayPayment = async (user, amount, description, onSuccess) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    // It's better to use a more user-friendly notification system than alert.
    console.error('Failed to load Razorpay. Please try again.');
    // Consider showing a toast notification or a message in your UI.
    return;
  }

  // Fetch the key from an environment variable.
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    console.error('Razorpay key is not configured. Make sure VITE_RAZORPAY_KEY_ID is set in your .env.local file.');
    // Handle this error appropriately.
    return;
  }

  const options = {
    key: razorpayKey, // Use the key from the environment variable.
    amount: amount * 100, // Amount in paise
    currency: 'INR',
    name: 'SolOS',
    description: description,
    handler: function (response) {
      onSuccess(response);
    },
    prefill: {
      name: user.displayName || 'User',
      email: user.email || '',
    },
    theme: {
      color: '#10b981',
    },
    modal: {
      ondismiss: function () {
        console.log('Payment cancelled');
      },
    },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};