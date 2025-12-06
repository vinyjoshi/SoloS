import Razorpay from "razorpay";

export default async function handler(req, res) {
  // 1. CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // 2. Method validation
  if (req.method !== "POST") {
    return res.status(405).json({ 
      error: "Method not allowed",
      message: "This endpoint only accepts POST requests" 
    });
  }

  try {
    // 3. Validate environment variables
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("❌ Missing Razorpay credentials");
      console.error("KEY_ID exists:", !!keyId);
      console.error("KEY_SECRET exists:", !!keySecret);
      
      return res.status(500).json({ 
        error: "Server configuration error",
        message: "Payment service credentials not configured. Please contact support.",
        debug: process.env.NODE_ENV === 'development' ? {
          keyIdPresent: !!keyId,
          keySecretPresent: !!keySecret
        } : undefined
      });
    }

    // 4. Validate and parse request body
    const { amount, planName } = req.body;
    
    console.log("📝 Request body:", { amount, planName, bodyType: typeof req.body });
    
    if (!amount) {
      return res.status(400).json({ 
        error: "Missing amount",
        message: "Amount is required in request body" 
      });
    }

    const amountNumber = Number(amount);
    
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ 
        error: "Invalid amount",
        message: `Amount must be a positive number. Received: ${amount}` 
      });
    }

    // 5. Initialize Razorpay
    console.log("🔧 Initializing Razorpay...");
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 6. Create Razorpay order
    const amountInPaise = Math.round(amountNumber * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${planName?.replace(/\s+/g, '_') || 'solos'}`,
      notes: {
        plan: planName || 'SolOS Pro',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || 'development'
      }
    };

    console.log(`💳 Creating order: ₹${amountNumber} (${amountInPaise} paise) - ${planName || 'Unknown Plan'}`);
    const order = await razorpay.orders.create(options);
    console.log(`✅ Order created: ${order.id}`);

    // 7. Return order details
    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        receipt: order.receipt
      }
    });

  } catch (error) {
    // 8. Enhanced error handling
    console.error("❌ Razorpay Order Creation Error:", {
      message: error.message,
      statusCode: error.statusCode,
      description: error.error?.description,
      code: error.error?.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Determine appropriate status code
    const statusCode = error.statusCode || 500;
    
    // Provide user-friendly error messages
    let userMessage = "Failed to initiate payment. Please try again.";
    
    if (error.error?.code === 'BAD_REQUEST_ERROR') {
      userMessage = "Invalid payment details. Please check and try again.";
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      userMessage = "Payment service authentication failed. Please contact support.";
    }

    return res.status(statusCode).json({ 
      error: "Payment initiation failed",
      message: userMessage,
      debug: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        code: error.error?.code,
        description: error.error?.description
      } : undefined
    });
  }
}
