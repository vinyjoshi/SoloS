// // Utility to load Razorpay SDK
// This handles BOTH Razorpay and is called from the PricingModal

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
    alert('Failed to load Razorpay. Please try again.');
    return;
  }

  // Replace 'rzp_live_your_key_here' with your actual Razorpay key
  const options = {
    key: 'rzp_live_RtkOY8THFgeHAb', 
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
      }
    }
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};