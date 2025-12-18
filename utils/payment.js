// // Utility to load Razorpay SDK
// const loadRazorpayScript = () => {
//   return new Promise((resolve) => {
//     // Check if already loaded
//     if (window.Razorpay) {
//       resolve(true);
//       return;
//     }

//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });
// };

// /**
//  * Handle Razorpay payment
//  * @param {Object} user - Firebase user object
//  * @param {number} amountINR - Amount in INR (e.g., 99 for ₹99)
//  * @param {string} planName - Name of the plan (e.g., "Weekly Grind", "Monthly Focus")
//  * @param {Function} onSuccess - Callback function on successful payment
//  * @returns {Promise<void>}
//  */
// export const handlePayment = async (user, amountINR, planName, onSuccess) => {
//   try {
//     console.log(`🚀 Initiating payment: ₹${amountINR} for ${planName}`);

//     // 1. Load Razorpay SDK
//     const isLoaded = await loadRazorpayScript();
//     if (!isLoaded) {
//       throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
//     }

//     // 2. Determine backend URL based on environment
//     const backendUrl = import.meta.env.DEV 
//       ? "http://localhost:5173/api/create-order"  // Vite dev proxy
//       : "/api/create-order";  // Production Vercel

//     console.log(`📡 Backend URL: ${backendUrl}`);

//     // 3. Create order on backend
//     const response = await fetch(backendUrl, {
//       method: "POST",
//       headers: { 
//         "Content-Type": "application/json",
//         "Accept": "application/json"
//       },
//       body: JSON.stringify({ 
//         amount: amountINR,
//         planName: planName 
//       }),
//     });

//     console.log(`📥 Response status: ${response.status}`);

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       console.error("❌ Backend error:", errorData);
//       throw new Error(errorData.message || `Server error: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log("✅ Order created:", data);

//     if (!data.order?.id) {
//       throw new Error("Invalid response from server - missing order ID");
//     }

//     // 4. Configure Razorpay checkout options
//     const options = {
//       key: "rzp_test_RoQMSgjJCLg7XE", // Your Razorpay test key
//       amount: data.order.amount, // Amount in paise
//       currency: data.order.currency,
//       name: "SolOS",
//       description: `${planName} - SolOS Pro Subscription`,
//       image: "/SolOS.png", // Your logo
//       order_id: data.order.id,
//       handler: async function (response) {
//         console.log("💳 Payment successful!");
//         console.log("Payment ID:", response.razorpay_payment_id);
//         console.log("Order ID:", response.razorpay_order_id);
//         console.log("Signature:", response.razorpay_signature);
        
//         // Call success callback
//         if (onSuccess) {
//           try {
//             await onSuccess(response);
//           } catch (callbackError) {
//             console.error("Error in success callback:", callbackError);
//             alert("Payment successful but failed to update account. Please contact support.");
//           }
//         }
//       },
//       prefill: {
//         name: user?.displayName || "",
//         email: user?.email || "",
//       },
//       notes: {
//         userId: user?.uid || "",
//         plan: planName,
//       },
//       theme: {
//         color: "#10b981", // Emerald-500
//         backdrop_color: "#000000"
//       },
//       modal: {
//         ondismiss: function() {
//           console.log("❌ Payment cancelled by user");
//         },
//         escape: true,
//         animation: true,
//         confirm_close: true
//       }
//     };

//     // 5. Open Razorpay checkout
//     console.log("🎯 Opening Razorpay checkout...");
//     const paymentObject = new window.Razorpay(options);
    
//     paymentObject.on('payment.failed', function (response) {
//       console.error("❌ Payment failed:", response.error);
//       alert(`Payment failed: ${response.error.description || 'Unknown error'}`);
//     });

//     paymentObject.open();

//   } catch (error) {
//     console.error("💥 Payment Error:", error);
    
//     // User-friendly error message
//     let errorMessage = "Could not initiate payment. ";
    
//     if (error.message.includes("internet connection")) {
//       errorMessage += "Please check your internet connection.";
//     } else if (error.message.includes("Server error")) {
//       errorMessage += "Server error. Please try again or contact support.";
//     } else {
//       errorMessage += error.message || "Please try again.";
//     }
    
//     alert(errorMessage);
//   }
// };

// /**
//  * Plan configurations for easy reference
//  */
// export const PLANS = {
//   WEEKLY: {
//     name: "Weekly Grind",
//     amount: 99,
//     duration: "week",
//     description: "Perfect for sprints"
//   },
//   MONTHLY: {
//     name: "Monthly Focus",
//     amount: 499,
//     duration: "month",
//     description: "Standard plan",
//     badge: "POPULAR"
//   },
//   YEARLY: {
//     name: "Yearly Commit",
//     amount: 4999,
//     duration: "year",
//     description: "Save 17%"
//   },
//   LIFETIME: {
//     name: "Founder Mode",
//     amount: 9999,
//     duration: "lifetime",
//     description: "One-time payment"
//   }
// };


// PASTE THIS INTO your utils/payment.js OR create it
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
    key: 'rzp_live_your_key_here', 
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