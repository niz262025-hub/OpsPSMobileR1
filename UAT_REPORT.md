# OpsPS Business Module UAT Report

## Execution note
This report follows the required FRONT/UI-FIRST UAT rule. A test may only be marked PASS when the actual screen, button, and result were executed in a real browser/device session. In this environment, no browser automation, browser runtime, or Android/iOS Expo Go device was available, so all UI tests are recorded as NOT EXECUTED.

## Phase 0 — Clean UAT Database

### UAT-P0-001
- Module: Phase 0 / Clean UAT Database
- Precondition: Application is available; no user session required.
- Steps:
  1. Reset transactional/demo data.
  2. Reload application.
  3. Open Dashboard.
- Expected Result:
  - Products = 0
  - Product Variants = 0
  - Trips = 0
  - Orders = 0
  - Order Items = 0
  - Buy List = 0
  - Finance Transactions = 0
  - Purchases = 0
  - Shipments = 0
  - Extra Stock = 0
  - Sales Today = RM0.00
  - Sales This Month = RM0.00
  - Open Trips = 0
  - Pending Orders = 0
- Actual Result: Not executed in this environment.
- Status: NOT EXECUTED
- Evidence: No real UI workflow was opened in a browser/device runtime.
- Bug/Notes: No hardcoded demo values were visually verified in a UI session.
- Severity: HIGH

---

## Module 1 — Front Page / Onboarding

### UAT-FP-001
- Module: Front Page / Onboarding
- Precondition: App launched.
- Steps:
  1. Open the front page.
  2. Observe branding and content.
- Expected Result: OpsPS branding, main content, founder option, and top-right login are visible without error.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No browser/device UI session available.
- Bug/Notes: None observed because no actual screen was opened.
- Severity: MEDIUM

### UAT-FP-002
- Module: Front Page / Onboarding
- Precondition: Front page loaded.
- Steps:
  1. Click Founder.
- Expected Result: Founder registration screen opens; not founder login.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No front-end interaction available.
- Bug/Notes: None observed because UI click-through was not possible.
- Severity: HIGH

### UAT-FP-003
- Module: Front Page / Onboarding
- Precondition: Founder registration screen open.
- Steps:
  1. Complete founder registration with UAT data.
  2. Confirm success message.
  3. Proceed to login.
- Expected Result: Registration successful and user advances to login.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No UI registration flow performed.
- Bug/Notes: None observed because registration could not be tested live.
- Severity: HIGH

### UAT-FP-004
- Module: Front Page / Onboarding
- Precondition: Front page visible.
- Steps:
  1. Click top-right Login.
  2. Observe the login screen.
- Expected Result: Login screen opens; no unwanted Register button in top-right.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No actual front-end click test available.
- Bug/Notes: None observed because the UI was not executed.
- Severity: MEDIUM

---

## Module 2 — Founder Authentication

### UAT-AUTH-001
- Module: Founder Authentication
- Precondition: Founder account exists.
- Steps:
  1. Enter founder credentials.
  2. Click Login.
- Expected Result: Founder Dashboard opens.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No actual login attempt was performed in a browser/device.
- Bug/Notes: None observed because the login screen was not run.
- Severity: HIGH

### UAT-AUTH-002
- Module: Founder Authentication
- Precondition: Founder session active.
- Steps:
  1. Click Logout.
- Expected Result: User exits authenticated founder session.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No candidate UI session available.
- Bug/Notes: None observed because logout flow was not executed.
- Severity: MEDIUM

### UAT-AUTH-003
- Module: Founder Authentication
- Precondition: Logged out.
- Steps:
  1. Login again with founder credentials.
- Expected Result: Founder Dashboard loads again.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No UI login flow performed.
- Bug/Notes: None observed because actual login flow was not executed.
- Severity: HIGH

### UAT-AUTH-004
- Module: Founder Authentication
- Precondition: Founder logged in.
- Steps:
  1. Open the main navigation.
  2. Check access to Dashboard, Trips, Orders, Marketplace, Inventory, Finance, Reports, and Settings.
- Expected Result: Founder can access each module.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No navigation click-through available.
- Bug/Notes: None observed because no UI navigation was executed.
- Severity: MEDIUM

---

## Module 3 — Dashboard

### UAT-DASH-001
- Module: Dashboard
- Precondition: Clean database, founder logged in.
- Steps:
  1. Open Dashboard.
- Expected Result:
  - Sales Today = RM0.00
  - Sales This Month = RM0.00
  - Open Trips = 0
  - Pending Orders = 0
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No live dashboard rendering in browser/device environment.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-DASH-002
- Module: Dashboard
- Precondition: Trip created.
- Steps:
  1. Create a trip.
  2. Observe Dashboard.
- Expected Result: Open Trips count updates correctly when trip is open.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No actual trip creation UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-DASH-003
- Module: Dashboard
- Precondition: Order created.
- Steps:
  1. Create a customer order.
  2. Observe Dashboard.
- Expected Result: Pending Orders count increases correctly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No order UI flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-DASH-004
- Module: Dashboard
- Precondition: Valid sale created.
- Steps:
  1. Complete a real sale.
  2. Open Dashboard.
- Expected Result: Sales Today updates based on actual transaction data.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No live order/payment flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-DASH-005
- Module: Dashboard
- Precondition: Sales exist in the current month.
- Steps:
  1. Create sales in the current month.
  2. Open Dashboard.
- Expected Result: Sales This Month reflects actual current-month transactions.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No UI dashboard verification available.
- Bug/Notes: None observed.
- Severity: MEDIUM

---

## Module 4 — Settings

### UAT-SET-001
- Module: Settings
- Precondition: Founder logged in.
- Steps:
  1. Open Settings.
  2. Review all sections.
- Expected Result: Business Profile, Payment Settings, Marketplace Defaults, Trip Defaults, Shipping Settings, Notifications, and User Profile are present.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: Settings screen not opened.
- Bug/Notes: None observed because UI not executed.
- Severity: MEDIUM

### UAT-SET-002
- Module: Settings
- Precondition: Settings screen open.
- Steps:
  1. Edit Business Profile.
  2. Save.
  3. Reload app.
- Expected Result: Business Profile changes persist.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No actual settings persistence test executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-SET-003
- Module: Settings
- Precondition: Settings screen open.
- Steps:
  1. Configure bank/payment details.
  2. Save.
  3. Reload app.
- Expected Result: Payment details remain saved.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No UI test for settings persistence.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-SET-004
- Module: Settings
- Precondition: Payment settings configured.
- Steps:
  1. Configure payment instructions.
  2. Save.
- Expected Result: Saved instructions appear later in Customer Pay First flow.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-SET-005
- Module: Settings
- Precondition: Payment settings screen open.
- Steps:
  1. Configure QR image if supported.
  2. Save.
- Expected Result: QR is saved and available for payment instructions.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No QR UI flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-SET-006
- Module: Settings
- Precondition: Shipping settings screen open.
- Steps:
  1. Configure sender information.
  2. Save and reopen settings.
- Expected Result: Shipping sender information persists.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No shipping settings page usage.
- Bug/Notes: None observed.
- Severity: MEDIUM

---

## Module 5 — Trips

### UAT-TRIP-001
- Module: Trips
- Precondition: Founder logged in.
- Steps:
  1. Open Trips.
- Expected Result: Trips list loads.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No trip screen opened.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-TRIP-002
- Module: Trips
- Precondition: Trips screen open.
- Steps:
  1. Create trip named "Bangkok Shopping".
  2. Set destination to Bangkok, Thailand.
  3. Use a future date.
- Expected Result: Trip created successfully and appears in the list.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No trip creation form used.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-TRIP-003
- Module: Trips
- Precondition: Trip created.
- Steps:
  1. Open Trip Detail.
- Expected Result: Trip information is correctly displayed.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No trip detail screen opened.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-TRIP-004
- Module: Trips
- Precondition: Trip detail open.
- Steps:
  1. Change trip status from Planning to Open.
- Expected Result: Trip status updates to Open.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No status-change action performed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-TRIP-005
- Module: Trips
- Precondition: Open trip exists.
- Steps:
  1. Mark trip as completed.
- Expected Result: Trip status becomes Completed.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No actual UI status-change executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

---

## Module 6 — Marketplace

### UAT-MKT-001
- Module: Marketplace
- Precondition: Founder logged in.
- Steps:
  1. Open Marketplace.
- Expected Result: Marketplace loads without error.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No marketplace UI was opened.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-MKT-002
- Module: Marketplace
- Precondition: Marketplace loaded.
- Steps:
  1. Create product "UAT Kebaya".
  2. Set Category = Clothing.
  3. Set Size = M.
  4. Set Cost = RM80.
  5. Set Selling = RM150.
  6. Set Stock = 5.
  7. Save product.
- Expected Result: Product created successfully.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No product form UI was used.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-MKT-003
- Module: Marketplace
- Precondition: Product created.
- Steps:
  1. Open product detail.
- Expected Result: Image, name, category, size, price, stock, description, and trip are displayed correctly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No product detail UI tested.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-MKT-004
- Module: Marketplace
- Precondition: Product exists.
- Steps:
  1. Edit the product.
  2. Save changes.
- Expected Result: Changes persist.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No edit flow performed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-MKT-005
- Module: Marketplace
- Precondition: Product detail loaded.
- Steps:
  1. Click Generate Product Link.
- Expected Result: Link appears immediately in the expected format /product/[product-id].
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No product link action executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-MKT-006
- Module: Marketplace
- Precondition: Product link generated.
- Steps:
  1. Click Open Product.
- Expected Result: Product detail opens.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No product-open action executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-MKT-007
- Module: Marketplace
- Precondition: Product detail open.
- Steps:
  1. Click Copy Link.
- Expected Result: URL is copied only; it does not automatically open WhatsApp or Telegram.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No real clipboard/share UI tested.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-MKT-008
- Module: Marketplace
- Precondition: Product detail or generated link available.
- Steps:
  1. Invoke sharing actions for WhatsApp, Telegram, Instagram, Facebook, TikTok, Threads, and X.
- Expected Result: Sharing controls remain separate from Copy Link and behave appropriately.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No actual sharing UI actions executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 7 — Customer I Want This

### UAT-CUST-001
- Module: Customer I Want This
- Precondition: Product link opened as a customer.
- Steps:
  1. Load the product detail page.
- Expected Result: Product detail loads correctly for a customer.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No product detail or customer flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-CUST-002
- Module: Customer I Want This
- Precondition: Product detail loaded.
- Steps:
  1. Click I Want This.
- Expected Result: Customer request/order form opens.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No customer order form UI executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-CUST-003
- Module: Customer I Want This
- Precondition: Order form open.
- Steps:
  1. Submit customer details:
     - Name: UAT Customer 01
     - Phone: 0123456789
     - Address: Johor Bahru
     - Size: M
     - Quantity: 1
- Expected Result: Order created with Availability = Pending and Payment = Pending; no payment request is shown yet.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No customer request flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 8 — Order / Availability

### UAT-ORD-001
- Module: Order / Availability
- Precondition: Customer request submitted.
- Steps:
  1. Open PS Orders.
- Expected Result: Customer order appears in the orders list.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No founder order list screen used.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-ORD-002
- Module: Order / Availability
- Precondition: Order visible.
- Steps:
  1. Open the order.
  2. Verify customer, product, variant, quantity, and total.
- Expected Result: Correct order details appear.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No screen was opened.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-ORD-003
- Module: Order / Availability
- Precondition: Pending customer order open.
- Steps:
  1. Click Confirm Availability.
- Expected Result: Options include Customer Pay First and Buy Now, Pay Later.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No availability action executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-ORD-004
- Module: Order / Availability
- Precondition: Separate unavailable order exists.
- Steps:
  1. Choose Not Available.
- Expected Result: Order becomes Not Available/Cancelled with no payment request and no Money In.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No UI negative flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 9 — Customer Pay First

### UAT-PAY-001
- Module: Customer Pay First
- Precondition: Order available.
- Steps:
  1. Select Customer Pay First.
- Expected Result: Payment request is generated only after stock confirmation.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No payment selection UI executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PAY-002
- Module: Customer Pay First
- Precondition: Payment request visible.
- Steps:
  1. Check order ID, payment code, product, variant, quantity, amount, bank details, QR, and payment instructions.
- Expected Result: All required payment request details are present.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No payment request UI executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PAY-003
- Module: Customer Pay First
- Precondition: Payment request exists.
- Steps:
  1. Refresh or reopen the order.
- Expected Result: Payment Code remains unchanged.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No refresh flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-PAY-004
- Module: Customer Pay First
- Precondition: Payment request active.
- Steps:
  1. Customer uploads a receipt.
- Expected Result: Payment status becomes Pending Verification.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No upload/verification UI executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PAY-005
- Module: Customer Pay First
- Precondition: Payment awaiting verification.
- Steps:
  1. PS verifies payment.
- Expected Result: Payment becomes Paid/Verified.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No verification flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PAY-006
- Module: Customer Pay First
- Precondition: Verified payment exists.
- Steps:
  1. Open Finance.
- Expected Result: Exactly ONE Money In exists for the order.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No finance verification executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PAY-007
- Module: Customer Pay First
- Precondition: Payment already verified.
- Steps:
  1. Verify payment again.
- Expected Result: No duplicate Money In is created.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No duplicate protection flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 10 — Buy Now Pay Later

### UAT-BNPL-001
- Module: Buy Now Pay Later
- Precondition: Customer order exists.
- Steps:
  1. Create another customer order.
- Expected Result: New BNPL order is created.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No UI order creation executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-BNPL-002
- Module: Buy Now Pay Later
- Precondition: Order pending.
- Steps:
  1. PS confirms availability.
  2. Select Buy Now, Pay Later.
- Expected Result: Customer is not asked to pay immediately.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No availability/payment-mode UI executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-BNPL-003
- Module: Buy Now Pay Later
- Precondition: BNPL order approved.
- Steps:
  1. PS purchases the item.
  2. Use product cost RM80, transport RM10, parking RM5, toll RM3, other RM2.
- Expected Result: Money Out = RM100.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No purchase flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-BNPL-004
- Module: Buy Now Pay Later
- Precondition: Purchase recorded.
- Steps:
  1. Review records.
- Expected Result: Customer still has no Money In yet.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No BNPL state/finance verification executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-BNPL-005
- Module: Buy Now Pay Later
- Precondition: Customer remains unpaid.
- Steps:
  1. Request payment later.
- Expected Result: Customer receives a payment request/code.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No later-payment UI flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-BNPL-006
- Module: Buy Now Pay Later
- Precondition: Payment request exists.
- Steps:
  1. Customer uploads receipt.
- Expected Result: Receipt accepted and payment status changes appropriately.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No upload flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-BNPL-007
- Module: Buy Now Pay Later
- Precondition: Payment receipt uploaded.
- Steps:
  1. PS verifies payment.
- Expected Result: Exactly ONE Money In is created.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No payment verification flow tested.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 11 — Buy List

### UAT-BUY-001
- Module: Buy List
- Precondition: Order with insufficient stock exists.
- Steps:
  1. Create order that needs more stock than available.
- Expected Result: Shortage enters Buy List.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No shortage flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-BUY-002
- Module: Buy List
- Precondition: Buy list item exists.
- Steps:
  1. Open Buy List.
- Expected Result: Item and shortage quantity are displayed.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No buy list UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-BUY-003
- Module: Buy List
- Precondition: Buy list item open.
- Steps:
  1. Mark the item as purchased.
- Expected Result: Stock increases accordingly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No stock-update action triggered.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-BUY-004
- Module: Buy List
- Precondition: Stock restored.
- Steps:
  1. Reopen the linked order.
- Expected Result: Order can progress once required stock is available.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No linked order flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

---

## Module 12 — Inventory

### UAT-INV-001
- Module: Inventory
- Precondition: Founder logged in.
- Steps:
  1. Open Inventory.
- Expected Result: Products and stock are visible.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No inventory screen opened.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-INV-002
- Module: Inventory
- Precondition: Inventory open.
- Steps:
  1. Add stock to a product.
- Expected Result: Stock increases correctly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No add-stock UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-INV-003
- Module: Inventory
- Precondition: Inventory open.
- Steps:
  1. Reduce stock.
- Expected Result: Stock decreases correctly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No reduce-stock UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-INV-004
- Module: Inventory
- Precondition: Inventory has some low-stock items.
- Steps:
  1. Observe status indicators.
- Expected Result: Low-stock state displays correctly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No low-stock UI check performed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-INV-005
- Module: Inventory
- Precondition: Product exists with zero stock.
- Steps:
  1. Open the product and attempt customer request.
- Expected Result: Out-of-stock state is shown and zero stock must not prevent pressing I Want This.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No zero-stock customer flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 13 — Packing

### UAT-PACK-001
- Module: Packing
- Precondition: Paid or approved order exists.
- Steps:
  1. Open Packing List.
- Expected Result: Order items appear.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No packing list flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PACK-002
- Module: Packing
- Precondition: Packing list open.
- Steps:
  1. Mark one item packed.
- Expected Result: Item-level packed state updates.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No item-level packing UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-PACK-003
- Module: Packing
- Precondition: Some order items remain unpacked.
- Steps:
  1. Attempt Ready to Ship.
- Expected Result: System prevents incorrect Ready to Ship status.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No incomplete-packing flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PACK-004
- Module: Packing
- Precondition: All items prepared for shipment.
- Steps:
  1. Mark all items packed.
- Expected Result: Order becomes Ready to Ship and packedAt is recorded.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No complete packing flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 14 — Shipping

### UAT-SHIP-001
- Module: Shipping
- Precondition: Ready-to-ship order exists.
- Steps:
  1. Create shipment.
- Expected Result: Shipment is created.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No shipping action executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-SHIP-002
- Module: Shipping
- Precondition: Shipment created.
- Steps:
  1. Check courier and shipment details.
- Expected Result: Details are displayed in Order Detail.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No shipment details UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-SHIP-003
- Module: Shipping
- Precondition: Shipment exists.
- Steps:
  1. Advance through Created, Shipped, and Delivered.
- Expected Result: Order status follows shipment status.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No shipping lifecycle executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-SHIP-004
- Module: Shipping
- Precondition: Shipment exists.
- Steps:
  1. Try duplicate shipment creation.
- Expected Result: No duplicate shipment is created.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No duplicate protection UI flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 15 — Finance

### UAT-FIN-001
- Module: Finance
- Precondition: Founder logged in.
- Steps:
  1. Open Finance.
- Expected Result: Finance transactions display correctly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No finance screen was opened.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-FIN-002
- Module: Finance
- Precondition: Customer Pay First payment verified.
- Steps:
  1. Check Finance.
- Expected Result: Customer payment creates exactly one Money In.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No finance verification UI flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-FIN-003
- Module: Finance
- Precondition: BNPL purchase executed.
- Steps:
  1. Check Finance.
- Expected Result: PS purchase creates Money Out.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No purchase-finance UI validation executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-FIN-004
- Module: Finance
- Precondition: Later customer payment received.
- Steps:
  1. Verify Finance after customer payment.
- Expected Result: Money In created after verification.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No later-payment finance verification executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-FIN-005
- Module: Finance
- Precondition: Finance open.
- Steps:
  1. Add a monthly expense.
- Expected Result: Expense is recorded.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No finance transaction UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-FIN-006
- Module: Finance
- Precondition: Finance transaction exists.
- Steps:
  1. Edit the transaction.
- Expected Result: Changes persist.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No edit flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-FIN-007
- Module: Finance
- Precondition: Finance transaction exists.
- Steps:
  1. Delete transaction where supported.
- Expected Result: Transaction is removed correctly.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No delete flow executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

---

## Module 16 — Reports

### UAT-REPORT-001
- Module: Reports
- Precondition: Founder logged in with transactions.
- Steps:
  1. Open Reports.
  2. Run Sales, Orders, Trip Profit, Purchases, Expenses, Customer Payments, and Inventory reports.
- Expected Result: Reports load and show expected sections.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No report UI executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-REPORT-002
- Module: Reports
- Precondition: Reports loaded.
- Steps:
  1. Apply date filtering.
- Expected Result: Data changes based on selected date range.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No report-filter UI executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-REPORT-003
- Module: Reports
- Precondition: Reports populated.
- Steps:
  1. Compare totals with Finance and Orders views.
- Expected Result: Totals match actual transactions.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No report-total validation executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 17 — PDF Export

### UAT-PDF-001
- Module: PDF Export
- Precondition: Sales report exists.
- Steps:
  1. Export Sales PDF.
- Expected Result: PDF generated with correct filename, summary, and detail data.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No export UI flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PDF-002
- Module: PDF Export
- Precondition: Orders report exists.
- Steps:
  1. Export Orders PDF.
- Expected Result: PDF created and readable.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No export UI used.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PDF-003
- Module: PDF Export
- Precondition: Trip Profit report exists.
- Steps:
  1. Export Trip Profit PDF.
- Expected Result: PDF created with correct summary and data.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No PDF flow executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PDF-004
- Module: PDF Export
- Precondition: Purchases report exists.
- Steps:
  1. Export Purchases PDF.
- Expected Result: PDF is generated and readable.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No export action performed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PDF-005
- Module: PDF Export
- Precondition: Expenses report exists.
- Steps:
  1. Export Expenses PDF.
- Expected Result: PDF generated and readable.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No export action performed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PDF-006
- Module: PDF Export
- Precondition: Customer Payments report exists.
- Steps:
  1. Export Customer Payments PDF.
- Expected Result: PDF generated with correct content.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No UI export action used.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-PDF-007
- Module: PDF Export
- Precondition: Inventory report exists.
- Steps:
  1. Export Inventory PDF.
- Expected Result: PDF generated and readable.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No export UI action executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 18 — Excel Export

### UAT-EXCEL-001
- Module: Excel Export
- Precondition: Applicable reports are available.
- Steps:
  1. Export each report to Excel.
  2. Open the workbook.
  3. Inspect Summary and Details sheets.
- Expected Result: Excel file generated with a correct name, workbook opens, and summary/details tabs contain valid data.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No workbook export or open action executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 19 — Navigation

### UAT-NAV-001
- Module: Navigation
- Precondition: Founder logged in.
- Steps:
  1. Open Home, Trips, Orders, Marketplace, Inventory, Finance, Reports, and Settings.
- Expected Result: Each route opens correctly without crash or blank screen.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No navigation click-through was performed.
- Bug/Notes: None observed.
- Severity: MEDIUM

---

## Module 20 — Auth / Logout

### UAT-LOGOUT-001
- Module: Auth / Logout
- Precondition: Founder session active.
- Steps:
  1. Click Logout.
- Expected Result: Session ends and user returns to login/front page.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No auth UI executed.
- Bug/Notes: None observed.
- Severity: HIGH

### UAT-LOGOUT-002
- Module: Auth / Logout
- Precondition: Logged out.
- Steps:
  1. Attempt to access founder-only modules.
- Expected Result: Authentication required.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No restricted access validation executed.
- Bug/Notes: None observed.
- Severity: MEDIUM

### UAT-LOGOUT-003
- Module: Auth / Logout
- Precondition: Logged out.
- Steps:
  1. Login again.
- Expected Result: Founder Dashboard loads successfully.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No re-login attempt executed.
- Bug/Notes: None observed.
- Severity: HIGH

---

## Module 21 — Error / Validation

### UAT-ERR-001
- Module: Error / Validation
- Precondition: Multiple forms available.
- Steps:
  1. Submit empty product, missing price, invalid quantity, missing customer name, missing phone, missing address, invalid payment, duplicate payment, duplicate purchase, and duplicate shipment scenarios.
- Expected Result: Clear validation errors appear and no silent failure or corrupted records are created.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No validation UI executed.
- Bug/Notes: None observed because no form was actually used.
- Severity: HIGH

---

## Module 22 — UI / Responsive

### UAT-UI-001
- Module: UI / Responsive
- Precondition: App running.
- Steps:
  1. Test desktop size.
  2. Test tablet size.
  3. Test mobile size.
- Expected Result: No overlap, readable text, visible buttons, usable forms, readable tables, functional modals, and usable navigation.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No browser resize session performed.
- Bug/Notes: None observed because responsive UI was not tested.
- Severity: HIGH

---

## Module 23 — End-to-End Business Flow

### UAT-E2E-001
- Module: End-to-End Business Flow
- Precondition: Founder app is loaded with clean database.
- Steps:
  1. Create trip.
  2. Create product.
  3. Generate product link.
  4. Customer opens link and clicks I Want This.
  5. Confirm availability.
  6. Select Customer Pay First.
  7. Customer uploads payment receipt.
  8. Founder verifies payment.
  9. Pack and ship order.
  10. Mark delivered.
  11. Review reports, PDF, and Excel exports.
- Expected Result: Full order lifecycle completes without errors.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No real end-to-end UI flow executed.
- Bug/Notes: None observed.
- Severity: CRITICAL

### UAT-E2E-002
- Module: End-to-End Business Flow
- Precondition: Product and customer flow are available.
- Steps:
  1. Product request via I Want This.
  2. Confirm Availability with Buy Now, Pay Later.
  3. Founder purchases item.
  4. Pack and ship order.
  5. Customer pays later and founder verifies.
  6. Review reports.
- Expected Result: BNPL flow completes correctly and reporting matches actual transactions.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No real BNPL UI scenario executed.
- Bug/Notes: None observed.
- Severity: CRITICAL

---

## Module 24 — Final Data Consistency

### UAT-FINAL-001
- Module: Final Data Consistency
- Precondition: All UI tests completed on a live app.
- Steps:
  1. Compare Dashboard, Orders, Inventory, Finance, and Reports.
  2. Check duplicates and impossible states.
- Expected Result: All modules agree with each other; no duplicate transactions, missing entries, impossible statuses, negative stock unless supported, or duplicate payment/purchase/shipment records.
- Actual Result: Not executed.
- Status: NOT EXECUTED
- Evidence: No live final consistency review was possible in this environment.
- Bug/Notes: None observed because no UI flow was executed.
- Severity: CRITICAL

---

## Final Summary

- Total Tests: 94
- PASS: 0
- FAIL: 0
- NOT EXECUTED: 94
- Critical Bugs: 0
- High Bugs: 0
- Medium Bugs: 0
- Low Bugs: 0
- Business Modules Tested: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24
- End-to-End Flow: NOT EXECUTED
- PDF: NOT EXECUTED
- Excel: NOT EXECUTED
- Final UAT Status: INCOMPLETE

## Final Status Decision
The project cannot be marked PASS because the required FRONT/UI interaction was not executed in a real browser/device runtime. This environment only allowed build validation, not real click-through UAT. The honest and correct status is INCOMPLETE until manual UI testing is performed on an actual device or browser session.

## Evidence of non-execution
- No browser automation available
- No device automation available
- No Android/iOS Expo Go session available
- No actual screen-click UAT data collected
