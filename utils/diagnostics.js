/**
 * Payment System Diagnostics
 * Run this in browser console to check payment integration health
 */

export const runPaymentDiagnostics = async () => {
  console.log("🔍 Starting Payment System Diagnostics...\n");

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Razorpay Script Loading
  console.log("Test 1: Checking Razorpay SDK...");
  if (window.Razorpay) {
    results.passed.push("✅ Razorpay SDK loaded successfully");
  } else {
    results.failed.push("❌ Razorpay SDK not loaded");
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error("Failed to load"));
        document.body.appendChild(script);
      });
      results.warnings.push("⚠️  Razorpay SDK loaded on-demand (should be pre-loaded)");
    } catch (e) {
      results.failed.push("❌ Cannot load Razorpay SDK - check internet connection");
    }
  }

  // Test 2: Backend Connectivity
  console.log("Test 2: Testing backend endpoint...");
  try {
    const backendUrl = import.meta.env.DEV 
      ? "http://localhost:5173/api/create-order"
      : "/api/create-order";
    
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 })  // Test with ₹1
    });

    if (response.ok) {
      results.passed.push("✅ Backend endpoint accessible");
      const data = await response.json();
      if (data.order?.id) {
        results.passed.push("✅ Order creation successful (test order ID: " + data.order.id + ")");
      } else {
        results.warnings.push("⚠️  Backend responded but order format unexpected");
      }
    } else {
      const errorText = await response.text();
      results.failed.push(`❌ Backend error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    results.failed.push(`❌ Cannot reach backend: ${error.message}`);
  }

  // Test 3: Environment Check
  console.log("Test 3: Checking environment...");
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;
  results.passed.push(`✅ Running in ${mode} mode (Dev: ${isDev})`);

  // Test 4: CORS Check
  console.log("Test 4: CORS configuration...");
  results.warnings.push("⚠️  CORS check requires backend logs - check server console");

  // Generate Report
  console.log("\n" + "=".repeat(60));
  console.log("📊 DIAGNOSTIC REPORT");
  console.log("=".repeat(60) + "\n");

  if (results.passed.length > 0) {
    console.log("✅ PASSED TESTS:");
    results.passed.forEach(msg => console.log("  " + msg));
    console.log("");
  }

  if (results.warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    results.warnings.forEach(msg => console.log("  " + msg));
    console.log("");
  }

  if (results.failed.length > 0) {
    console.log("❌ FAILED TESTS:");
    results.failed.forEach(msg => console.log("  " + msg));
    console.log("");
  }

  const status = results.failed.length === 0 ? "HEALTHY ✅" : "ISSUES DETECTED ⚠️";
  console.log("=".repeat(60));
  console.log(`System Status: ${status}`);
  console.log("=".repeat(60));

  return {
    healthy: results.failed.length === 0,
    results
  };
};

// Auto-run in development
if (import.meta.env.DEV) {
  console.log("💡 Payment diagnostics available. Run: runPaymentDiagnostics()");
  window.runPaymentDiagnostics = runPaymentDiagnostics;
}
