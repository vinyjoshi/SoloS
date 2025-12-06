#!/usr/bin/env node

/**
 * Payment Integration Verification Script
 * Run with: node verify-payment-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SolOS Payment Integration Verification\n');
console.log('='.repeat(60));

let issues = [];
let warnings = [];
let passed = [];

// Check 1: Environment file
console.log('\n📁 Checking environment configuration...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  passed.push('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('RAZORPAY_KEY_ID')) {
    passed.push('✅ RAZORPAY_KEY_ID found in .env.local');
  } else {
    issues.push('❌ RAZORPAY_KEY_ID not found in .env.local');
  }
  
  if (envContent.includes('RAZORPAY_KEY_SECRET')) {
    passed.push('✅ RAZORPAY_KEY_SECRET found in .env.local');
  } else {
    issues.push('❌ RAZORPAY_KEY_SECRET not found in .env.local');
  }
  
  if (envContent.includes('your_key_id_here') || envContent.includes('your_secret_key_here')) {
    warnings.push('⚠️  Environment variables contain placeholder values');
  }
} else {
  issues.push('❌ .env.local file not found');
  warnings.push('⚠️  Copy .env.example to .env.local and add your keys');
}

// Check 2: Payment utility file
console.log('\n💳 Checking payment utility...');
const paymentUtilPath = path.join(__dirname, 'utils', 'payment.js');
if (fs.existsSync(paymentUtilPath)) {
  passed.push('✅ utils/payment.js exists');
  
  const paymentContent = fs.readFileSync(paymentUtilPath, 'utf8');
  if (paymentContent.includes('handlePayment')) {
    passed.push('✅ handlePayment function found');
  } else {
    issues.push('❌ handlePayment function not found in payment.js');
  }
  
  if (paymentContent.includes('rzp_test_') || paymentContent.includes('rzp_live_')) {
    passed.push('✅ Razorpay key found in payment.js');
  } else {
    issues.push('❌ Razorpay key not configured in payment.js');
  }
} else {
  issues.push('❌ utils/payment.js not found');
}

// Check 3: API endpoint
console.log('\n🔌 Checking API endpoint...');
const apiPath = path.join(__dirname, 'api', 'create-order.js');
if (fs.existsSync(apiPath)) {
  passed.push('✅ api/create-order.js exists');
  
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  if (apiContent.includes('Razorpay')) {
    passed.push('✅ Razorpay SDK imported in API');
  } else {
    issues.push('❌ Razorpay SDK not imported in API');
  }
  
  if (apiContent.includes('RAZORPAY_KEY_ID') && apiContent.includes('RAZORPAY_KEY_SECRET')) {
    passed.push('✅ Environment variables referenced in API');
  } else {
    issues.push('❌ Environment variables not properly used in API');
  }
} else {
  issues.push('❌ api/create-order.js not found');
}

// Check 4: Vite config
console.log('\n⚡ Checking Vite configuration...');
const viteConfigPath = path.join(__dirname, 'vite.config.js');
if (fs.existsSync(viteConfigPath)) {
  passed.push('✅ vite.config.js exists');
  
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
  if (viteContent.includes('proxy') && viteContent.includes('/api')) {
    passed.push('✅ API proxy configured in Vite');
  } else {
    warnings.push('⚠️  API proxy not configured (may not work in local dev)');
  }
} else {
  issues.push('❌ vite.config.js not found');
}

// Check 5: Package dependencies
console.log('\n📦 Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check if razorpay is in dependencies or devDependencies
  const hasRazorpay = packageJson.dependencies?.razorpay || packageJson.devDependencies?.razorpay;
  if (hasRazorpay) {
    passed.push('✅ razorpay package installed');
  } else {
    issues.push('❌ razorpay package not found in package.json');
    warnings.push('⚠️  Run: npm install razorpay');
  }
} else {
  issues.push('❌ package.json not found');
}

// Check 6: App integration
console.log('\n🎨 Checking App.jsx integration...');
const appPath = path.join(__dirname, 'src', 'App.jsx');
if (fs.existsSync(appPath)) {
  passed.push('✅ src/App.jsx exists');
  
  const appContent = fs.readFileSync(appPath, 'utf8');
  if (appContent.includes('handlePayment')) {
    passed.push('✅ handlePayment imported in App.jsx');
  } else {
    issues.push('❌ handlePayment not imported in App.jsx');
  }
  
  if (appContent.includes('PricingModal')) {
    passed.push('✅ PricingModal component found');
  } else {
    issues.push('❌ PricingModal component not found');
  }
  
  const planCounts = (appContent.match(/handlePayment\(/g) || []).length;
  if (planCounts >= 4) {
    passed.push(`✅ ${planCounts} payment plans configured`);
  } else {
    warnings.push(`⚠️  Only ${planCounts} payment plans found (expected 4)`);
  }
} else {
  issues.push('❌ src/App.jsx not found');
}

// Generate Report
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION REPORT');
console.log('='.repeat(60) + '\n');

if (passed.length > 0) {
  console.log('✅ PASSED CHECKS:');
  passed.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (issues.length > 0) {
  console.log('❌ ISSUES FOUND:');
  issues.forEach(msg => console.log('  ' + msg));
  console.log('');
}

console.log('='.repeat(60));
if (issues.length === 0) {
  console.log('✅ Setup Complete! Ready to test payments.');
  console.log('\nNext steps:');
  console.log('1. Ensure .env.local has valid Razorpay keys');
  console.log('2. Run: npm run dev (in terminal 1)');
  console.log('3. Run: vercel dev (in terminal 2)');
  console.log('4. Test payment flow at http://localhost:5173');
} else {
  console.log('⚠️  Issues detected. Please fix the above errors.');
  console.log('\nCommon fixes:');
  console.log('1. Copy .env.example to .env.local and add keys');
  console.log('2. Run: npm install razorpay');
  console.log('3. Check file paths and imports');
}
console.log('='.repeat(60));

process.exit(issues.length > 0 ? 1 : 0);
