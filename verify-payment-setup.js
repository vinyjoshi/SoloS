#!/usr/bin/env node

/**
 * Payment Integration Verification Script
 * Run with: node verify-payment-setup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Check 2: API endpoint
console.log('\n🔌 Checking API endpoint...');
const apiPath = path.join(__dirname, 'api', 'create-order.js');
if (fs.existsSync(apiPath)) {
  passed.push('✅ api/create-order.js exists');

  const apiContent = fs.readFileSync(apiPath, 'utf8');
  if (apiContent.includes('RAZORPAY_KEY_ID') && apiContent.includes('RAZORPAY_KEY_SECRET')) {
    passed.push('✅ Environment variables referenced in API');
  } else {
    issues.push('❌ Environment variables not properly used in API');
  }
} else {
  issues.push('❌ api/create-order.js not found');
}

// Check 3: Payment utility
console.log('\n💳 Checking payment utility...');
const paymentUtilPath = path.join(__dirname, 'utils', 'payment.js');
if (fs.existsSync(paymentUtilPath)) {
  passed.push('✅ utils/payment.js exists');

  const paymentContent = fs.readFileSync(paymentUtilPath, 'utf8');
  if (paymentContent.includes('handleRazorpayPayment')) {
    passed.push('✅ handleRazorpayPayment function found');
  } else {
    issues.push('❌ handleRazorpayPayment function not found in payment.js');
  }
} else {
  issues.push('❌ utils/payment.js not found');
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

// Check 5: App integration
console.log('\n🎨 Checking App.jsx integration...');
const appPath = path.join(__dirname, 'src', 'App.jsx');
if (fs.existsSync(appPath)) {
  passed.push('✅ src/App.jsx exists');

  const appContent = fs.readFileSync(appPath, 'utf8');
  if (appContent.includes('PricingModal')) {
    passed.push('✅ PricingModal component found');
  } else {
    issues.push('❌ PricingModal component not found');
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
}
console.log('='.repeat(60));

process.exit(issues.length > 0 ? 1 : 0);