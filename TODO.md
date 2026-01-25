### Pre-Launch TODO List

**Critical Tasks (Must be completed before launch):**

*   [ ] **Secure the Application:**
    *   [ ] Restrict CORS to the application's domain.
    *   [ ] Move Firebase API keys to a `.env` file.
*   [ ] **Harden Payment Integration:**
    *   [x] Implement Server-Side PayPal Verification.
    *   [x] Create a Robust Razorpay Webhook with signature verification and idempotent handling.
    *   [x] Implement a `listen` Endpoint for Webhooks.
*   [ ] **Add Automated Testing:**
    *   [ ] Create a test suite for core functionality.
    *   [ ] Create tests for payment flows.

**Recommended Tasks (Highly recommended before launch):**

*   [ ] **Code Cleanup:**
    *   [ ] Remove `TODO` comments.
    *   [ ] Address remaining data consistency issues.
*   [ ] **Final Review:**
    *   [ ] Perform a final review of the entire codebase.
