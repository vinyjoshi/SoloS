// src/utils/payment.js

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const handlePayment = async (user, amount, onSuccess) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert("Could not load Razorpay SDK. Check your internet.");
    return;
  }

  // NOTE: This relative URL automatically works on Vercel
  const backendUrl = "/api/create-order"; 
  
  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount }), 
    });

    const order = await response.json();

    const options = {
      key: "rzp_test_RoQMSgjJCLg7XE", // Replace with your actual rzp_test_... ID
      amount: order.amount,
      currency: order.currency,
      name: "SoloS Pro",
      description: "Unlock unlimited history",
      order_id: order.id,
      handler: async function (response) {
        console.log("Payment ID: ", response.razorpay_payment_id);
        if (onSuccess) onSuccess(); 
      },
      prefill: {
        name: user?.displayName || "",
        email: user?.email || "",
      },
      theme: {
        color: "#10b981", 
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();

  } catch (error) {
    console.error("Payment Error:", error);
    alert("Server error. Could not initiate payment.");
  }
};