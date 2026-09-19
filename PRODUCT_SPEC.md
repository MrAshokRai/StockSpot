# HACKATHON MASTER PRODUCT PROMPT

You are an expert **startup product strategist, UX/UI designer, full-stack engineer, AI engineer, cybersecurity engineer, database architect, and hackathon optimization expert**.

Design and build a practical, polished, secure, and technically realistic product based on the concept below.

The project must prioritize:

**Security → Reliability → Core functionality → Simple UX → Performance → AI usefulness → Scalability → Visual polish**

Do not over-engineer the MVP. A **small, complete, working product is more valuable than a large unfinished system**.

---

# 1. HACKATHON THEME

Primary theme:

**THEME 05 — Livelihood & Local Commerce**

Focus areas:

* Small-business tools
* Farmer & market platforms
* Gig-work matching
* Pricing & inventory
* Community marketplaces

The product may also incorporate relevant aspects of:

**THEME 01 — Cybersecurity, Privacy & Digital Trust**

* Secure authentication
* Identity/business verification
* Privacy-preserving architecture
* Secure access control
* Fraud prevention

Do not force unrelated features merely to fit multiple themes.

---

# 2. CORE PROBLEM

Customers often need a particular product but do not know:

* Which shop has it
* Whether the product is currently in stock
* How many units are available
* Whether the stock information is trustworthy
* Where the shop is located
* Whether travelling to the shop will be worthwhile
* Whether another nearby shop has the same or an equivalent product

At the same time, shops often do not know:

* What products customers in their area are looking for
* Which products are currently in high demand
* What products they should restock
* Where unmet demand exists
* How their inventory is performing

This creates a **supply-demand discovery gap**.

The goal is to connect:

**Customer demand ↔ Local business supply**

The platform should work nationwide and support products ranging from:

**Raw materials → Components → Wholesale goods → Retail products → Finished products**

---

# 3. CORE PRODUCT IDEA

Create a **nationwide real-time inventory discovery and demand-matching platform**.

The platform allows customers to search for a product and discover verified shops that currently have that product available.

The basic flow is:

**Search → Find product → Find shops → Check stock → Verify freshness → Reserve/order → Pickup or delivery**

The reverse flow is equally important:

**Customer demand → Demand signal → Seller insight → Seller stocks product → Customer finds product**

The product should not merely be an online marketplace.

It should function as a:

**Real-time local supply discovery + inventory management + demand intelligence platform.**

---

# 4. PRIMARY PRODUCT POSITIONING

Use this central positioning:

> “A real-time supply discovery and demand-matching platform that lets people find where a product is actually available, while helping local businesses understand what customers need and what they should stock.”

The central value proposition is:

### For customers

**“Find the product you need, where it is actually available.”**

### For sellers

**“Know what customers want and manage the inventory they can actually sell.”**

---

# 5. TWO MAIN ACCOUNT TYPES

## A. CUSTOMER ACCOUNT

Customers should be able to:

* Search products
* Search by category
* Search using natural language
* Search related/alternative products
* Find nearby shops
* Find shops anywhere in the country
* View shop location
* View current listed stock
* See stock quantity/range where appropriate
* See when stock was last updated
* See seller/shop verification status
* View product details
* Compare shops
* Ask sellers questions
* Request stock confirmation
* Reserve products
* Order products online
* Choose pickup or delivery
* Get directions to the shop
* Track order status
* Receive important stock alerts
* Request unavailable products

### Important customer feature: PRODUCT REQUEST

If no shop currently has a product:

Allow the customer to press:

**“Request this product”**

Store the demand.

Example:

> “47 customers in this area are currently looking for this product.”

Nearby sellers can receive demand opportunities.

This creates a two-sided supply-demand marketplace instead of only a seller-listing marketplace.

---

# 6. SELLER ACCOUNT

A seller must first create a verified business/shop profile.

Seller onboarding should include:

* Personal identity information
* Business information
* Shop name
* Shop category/type
* Contact information
* Shop location
* Business verification
* Identity verification where appropriate
* Opening hours
* Delivery/pickup options
* Shop description
* Business documents where required

After verification, sellers can:

* Create shop profile
* Add products
* Edit products
* Update inventory
* Add prices
* Add product images
* Add SKU/barcode
* Add product attributes
* Set minimum order quantity
* Set wholesale/retail pricing where applicable
* Manage reservations
* Manage orders
* Respond to customer inquiries
* Record sales
* Record purchases
* Record expenses
* View transaction history
* View demand analytics
* Receive restock recommendations
* Receive shortage alerts
* View local demand opportunities

---

# 7. FLEXIBLE HIERARCHICAL BUSINESS ACCOUNTS

The seller system must support businesses of different sizes.

Do not hard-code only:

Owner → Employee.

Build a flexible **role + permission system**.

Example roles:

* Owner
* Administrator
* Manager
* Salesperson
* Inventory staff
* Accountant
* Delivery staff

Permissions should be independently configurable.

Example:

| Role            | Inventory |   Sales | Finance | Employees | Settings |
| --------------- | --------: | ------: | ------: | --------: | -------: |
| Owner           |      Full |    Full |    Full |      Full |     Full |
| Manager         |      Full |    Full | Limited |      Full |  Limited |
| Salesperson     |      View |    Full |      No |        No |       No |
| Inventory Staff |      Full | Limited |      No |        No |       No |
| Accountant      |      View |    View |    Full |        No |       No |

Also support:

**Custom roles**

A business owner should be able to define exactly what each employee can access.

The architecture must support:

**Single-person shop → Small business → Medium business → Multi-branch business**

---

# 8. MULTI-BRANCH SUPPORT

A business may have multiple locations.

Example:

**ABC Hardware**

* Kathmandu branch
* Lalitpur branch
* Pokhara branch

Customers should be able to see:

* Branch location
* Branch stock
* Branch price
* Branch opening hours
* Branch availability

Example:

> Product X
> Kathmandu: 12 available
> Lalitpur: 4 available
> Pokhara: 0 available

---

# 9. PRODUCT SYSTEM

Create a standardized product catalog.

Products should support:

* Product name
* Brand
* Category
* Subcategory
* Model
* Variant
* Size
* Unit
* SKU
* Barcode
* Product image
* Description
* Technical attributes
* Compatibility
* Retail price
* Wholesale price
* Minimum order quantity

The system should normalize different names for the same product.

Example:

* Coca Cola 500ml
* Coke 500 ML
* Coca-Cola 0.5L
* Coke Bottle 500ml

These may map to the same standardized product.

The system should support product-level normalization and semantic matching.

---

# 10. SMART PRODUCT SEARCH

The search system must support both:

### Exact search

Example:

> “Bosch GSB 500”

### Natural-language search

Example:

> “drill for concrete wall”

### Related-product search

Example:

> “phone charger for Samsung S23”

The system should understand:

* Synonyms
* Misspellings
* Product relationships
* Brand/model relationships
* Categories
* Compatibility
* Similar products
* Alternative products

Use AI/semantic search only where it provides real value.

---

# 11. EXACT MATCH + ALTERNATIVES

When the exact product is unavailable, show useful alternatives.

Example:

**Exact match**

* Bosch GSB 500

**Similar products**

* Bosch GSB 450
* Makita equivalent
* Another 500W drill

**Same-purpose alternatives**

* Cordless drill
* Impact drill

Clearly distinguish:

**Exact product vs Compatible alternative vs Similar product**

Do not falsely claim equivalence.

---

# 12. REAL-TIME INVENTORY

The platform should make inventory as close to real-time as practically possible.

Sellers can update stock through:

* Manual update
* Quick quantity adjustment
* Barcode scanning
* CSV/Excel import
* POS integration
* API integration

For MVP, implement manual update and at least one efficient bulk/import mechanism where practical.

Inventory records should maintain:

* Current quantity
* Last updated time
* Seller
* Branch
* Recent inventory changes
* Reservation quantity
* Available quantity

---

# 13. STOCK CONFIDENCE / FRESHNESS

Never blindly display stale inventory as guaranteed real-time stock.

Show:

**🟢 High confidence**

> 12–15 available
> Updated 4 minutes ago

**🟡 Lower confidence**

> Stock may have changed
> Updated 2 hours ago

The system should consider:

* Last inventory update
* Recent sales
* Reservations
* Seller confirmation
* POS integration
* Inventory changes
* Customer stock confirmations where appropriate

Create a transparent **stock freshness/confidence indicator**.

Do not fabricate exact accuracy.

---

# 14. RESERVE FOR PICKUP

Customers should be able to reserve an item.

Example:

> 3 available

Customer selects:

> Reserve 1

Seller receives the reservation.

The inventory system temporarily holds that quantity.

Customer receives:

> Reserved successfully
> Pick up within 30 minutes

This reduces the problem of customers travelling to a shop only to discover the item has sold.

---

# 15. CUSTOMER-SELLER INQUIRY SYSTEM

Customers should be able to ask:

* Is this product currently available?
* How many units are available?
* Is this exact model available?
* Can I reserve it?
* What is the current price?
* Is bulk quantity available?

Use structured inquiry options plus optional chat/message.

Where possible, automatically answer questions using verified inventory information.

---

# 16. DELIVERY SYSTEM

The final product may support a flexible delivery system similar in concept to large local delivery platforms.

However:

### MVP should NOT attempt to recreate an entire Pathao-like logistics company.

For the MVP, support:

**Pickup**

and optionally:

**Seller-arranged delivery / delivery partner integration**

Order status may be:

**Order placed → Seller confirmed → Assigned → Out for delivery → Delivered**

Design the architecture so a more advanced delivery system can be added later.

Do not spend most hackathon time building fleet management, driver systems, maps logistics, complex routing, etc.

---

# 17. BUY NEARBY VS FIND ANYWHERE

Customers should have two primary search modes:

### FIND NEARBY

Example:

> Find this product within 5 km.

Show:

* Distance
* Stock
* Price
* Last updated
* Opening status
* Reserve/order button

### FIND ANYWHERE

Search nationwide.

Show:

* Available shops
* Locations
* Stock
* Price
* Delivery availability
* Seller information

---

# 18. DEMAND INTELLIGENCE

One of the product's most important differentiators should be converting customer searches into business intelligence.

Track anonymous/appropriate demand signals such as:

* Searches
* Product requests
* Reservations
* Order attempts
* Unavailable searches
* Local demand trends

Example:

> **Product demand in Kathmandu this week**

| Product   | Searches | Available Shops | Demand Gap |
| --------- | -------: | --------------: | ---------- |
| Product A |      420 |               8 | High       |
| Product B |      210 |              31 | Medium     |
| Product C |      180 |               2 | Very High  |

Sellers should receive insights such as:

> “86 customers in your area searched for this product, but only 2 nearby shops currently list it.”

This tells sellers what customers actually want.

---

# 19. DEMAND MAP

Create a seller-facing demand map.

Areas can be categorized by demand intensity.

Example:

**Kathmandu**

* Very high demand
* High demand
* Medium demand
* Low demand

Selecting an area should reveal:

> Top unmet demand
>
> 1. Water pump — 81 requests
> 2. Cement mixer parts — 63 requests
> 3. Solar inverter — 54 requests

This should help businesses discover stocking opportunities.

---

# 20. SHORTAGE AND ALERT SYSTEM

Customers can receive important alerts such as:

### Current shortage

> “Only 2 shops near you currently have this product.”

### Demand spike

> “Demand for this product has increased significantly.”

### Possible future shortage

> “Inventory is declining rapidly in your area.”

### Product unavailable

> “This product is currently unavailable near you.”

Sellers can receive:

### Restock opportunity

> “High demand detected in your area, but few sellers currently stock this product.”

### Inventory alert

> “Stock is below your configured threshold.”

### Demand opportunity

> “37 customers recently requested this product near your shop.”

Alerts should be configurable and avoid spam.

---

# 21. BASIC SELLER BUSINESS MANAGEMENT

Do not make accounting the central MVP.

For the MVP, provide:

* Sales records
* Purchase records
* Expense records
* Revenue
* Simple profit estimate
* Transaction history
* Basic exports

The architecture should allow future expansion into:

* Profit & loss statements
* Trading account
* Balance sheet
* Financial reports
* Tax records
* Payroll
* Bookkeeping
* Fiscal-year reporting

Do not allow this secondary feature to consume the core hackathon development time.

---

# 22. AI FEATURES

AI should be used selectively.

Prioritize these:

## AI #1 — Smart Product Search

Understands natural language, synonyms, spelling variations, and product relationships.

## AI #2 — Alternative Product Recommendation

Suggests products that may satisfy a similar need while clearly identifying differences.

## AI #3 — Demand Forecasting

Uses historical demand/sales/seasonality where sufficient data exists to estimate future demand.

## AI #4 — Supply-Demand Gap Detection

Detects:

**High demand + low supply**

and recommends potential stocking opportunities.

## AI #5 — Inventory Anomaly Detection

Detect unusual inventory behavior.

Example:

> “This product's stock decreased significantly faster than its recent average.”

AI should provide explainable reasoning where practical.

Do not use AI merely for marketing language or features that could be implemented more reliably with normal software logic.

---

# 23. B2B / WHOLESALE SUPPORT

The platform must not only serve ordinary consumers.

It should support:

* Restaurants
* Contractors
* Manufacturers
* Retailers
* Farmers
* Repair businesses
* Construction businesses
* Other organizations

Support:

* Bulk quantity
* MOQ
* Wholesale pricing
* Quote requests
* Business inquiries

Example:

> “Need 50 kg rice”

or:

> “Need 100 bags cement”

This expands the platform beyond normal consumer shopping.

---

# 24. SELLER TRUST AND VERIFICATION

Show whether a seller is verified.

Example:

**ABC Hardware**

✅ Verified seller
📍 Kathmandu
🕒 Stock updated 8 min ago

The platform may calculate a simple seller reliability indicator using legitimate signals such as:

* Inventory freshness
* Reservation completion
* Order completion
* Cancellation rate
* Customer confirmations

Do not create misleading ratings.

---

# 25. SECURITY AND PRIVACY

Security is a first-class requirement.

Implement appropriate:

* Secure authentication
* Role-based access control
* Fine-grained permissions
* Database authorization
* Seller verification
* Input validation
* Server-side validation
* Rate limiting
* Audit logs
* Secure secret handling
* Secure API design
* Protection against unauthorized inventory modification
* Protection against unauthorized customer/business data access
* Privacy-preserving analytics
* Appropriate logging without leaking sensitive information

Never expose private customer information unnecessarily.

Never trust client-side authorization alone.

Use proper backend authorization and database-level access policies.

---

# 26. ADMIN SYSTEM

Create an admin dashboard with appropriate controls for:

* User management
* Seller verification
* Shop verification
* Product moderation
* Reports
* Suspicious activity review
* Inventory abuse detection
* Dispute handling
* Platform analytics
* System configuration

Admin access must be tightly protected.

---

# 27. MVP SCOPE

The hackathon MVP MUST prioritize the following:

## CUSTOMER

* Account
* Product search
* Smart search
* Shop discovery
* Location/distance
* Stock display
* Stock freshness
* Product details
* Seller verification
* Reserve item
* Customer inquiry
* Product request

## SELLER

* Seller onboarding
* Shop verification
* Shop profile
* Product management
* Inventory management
* Stock freshness
* Reservations
* Basic orders
* Basic transactions
* Demand insights

## CORE

* Product normalization
* Search
* Inventory
* Location
* Demand signals
* Notifications
* Permissions/security

## AI

* Smart search
* Alternative products
* Demand-gap detection
* Basic demand insight

---

# 28. FEATURES TO DEFER

Do not let these derail the MVP:

* Full Pathao-style delivery network
* Complex fleet/driver management
* Full accounting suite
* Full payroll platform
* Tax platform
* Lending/credit scoring
* Complex dynamic pricing
* Advanced POS ecosystem
* Large-scale banking integrations
* Excessive social features

Design for future expansion but implement only what is necessary for a convincing MVP.

---

# 29. IDEAL USER JOURNEY — CUSTOMER

Example:

A customer needs:

> “1.5 HP water pump”

They search the platform.

The system identifies the correct product and relevant alternatives.

Results show:

**Shop A**

* 3 available
* 1.2 km away
* Updated 4 min ago
* Verified
* Rs. X
* Reserve

**Shop B**

* 8 available
* 3.8 km away
* Updated 12 min ago
* Verified
* Rs. Y
* Reserve

Customer reserves one.

Seller confirms.

Customer chooses:

**Pickup**

or

**Delivery**

This should be extremely smooth.

---

# 30. IDEAL USER JOURNEY — SELLER

Seller logs in.

Dashboard shows:

> **Today's overview**
>
> Sales: Rs. X
> Inventory value: Rs. X
> Low-stock products: 7
> Pending reservations: 4
> New demand opportunities: 12

Then:

> **Demand opportunity**
>
> “Solar inverter searches increased 42% this week in your area.”

Seller can inspect demand and decide whether to stock it.

---

# 31. UX/UI REQUIREMENTS

The customer interface should be:

* Extremely simple
* Fast
* Mobile-first
* Search-centric
* Easy to understand
* Minimal unnecessary screens

Primary actions should be obvious:

**Search → Find → Verify → Reserve/Order**

The seller dashboard may be more information-dense but must remain understandable.

Use:

* Clear status indicators
* Consistent cards
* Strong search
* Maps where useful
* Clear stock states
* Clear CTA buttons
* Accessible typography
* Responsive design

Avoid feature overload.

---

# 32. TECHNICAL ARCHITECTURE

Design the system using a clean architecture such as:

**Frontend**
→ Web application

**Backend/API**
→ Authentication
→ Business logic
→ Product service
→ Inventory service
→ Search service
→ Demand service
→ Order/reservation service
→ Notification service

**Database**
→ Users
→ Businesses
→ Shops
→ Branches
→ Products
→ Inventory
→ Reservations
→ Orders
→ Transactions
→ Demand signals
→ Notifications
→ Audit logs

**AI layer**
→ Search understanding
→ Recommendations
→ Demand intelligence

**Storage**
→ Product images
→ Business documents where appropriate

Use a scalable architecture, but keep the implementation appropriate for a hackathon.

---

# 33. SUPABASE / NETLIFY COMPATIBILITY

Prefer practical hackathon-friendly infrastructure.

Potential architecture:

**Frontend:** React / Next.js / similar
**Hosting:** Netlify
**Backend/database/auth/storage:** Supabase
**AI:** inexpensive/free or local models where practical
**Maps/location:** appropriate API/service
**Notifications:** email/web/push/messaging service where realistically available

Do not introduce unnecessary infrastructure.

Keep secrets server-side.

Use environment variables.

Do not hard-code API keys.

---

# 34. DEMONSTRATION STRATEGY

The final demo should tell one simple story:

### PROBLEM

> “I need a specific item, but I don't know which shop has it.”

### SOLUTION

Search the product.

### LIVE DISCOVERY

Show actual shops and inventory.

### TRUST

Show:

* Verified seller
* Stock quantity
* Last updated time

### ACTION

Reserve the product.

### REVERSE MARKETPLACE

Show a product that is unavailable.

Customer requests it.

Then show seller demand intelligence:

> “Customers are actively looking for this.”

This demonstrates:

**Demand → Supply**

### AI

Demonstrate smart search and demand-gap detection.

### BUSINESS VALUE

Show how sellers can use demand information to make stocking decisions.

This should be the centerpiece of the presentation.

---

# 35. SUCCESS METRICS

Define measurable product metrics such as:

### Customer

* Search-to-result success rate
* Search-to-reservation conversion
* Product discovery time
* Stock freshness
* Successful reservations

### Seller

* Inventory update frequency
* Demand opportunities discovered
* Stockout reduction
* Product requests fulfilled

### Platform

* Percentage of searches with useful results
* Inventory freshness
* Reservation success rate
* Demand-supply matching rate

Do not claim business improvements such as “reduces dead stock by 30%” unless supported by actual testing/data.

---

# 36. FUTURE EXPANSION

Design the architecture to support future:

* Full delivery marketplace
* POS synchronization
* Barcode ecosystem
* Advanced accounting
* Payroll
* Tax reporting
* Wholesale marketplace
* Farmer marketplace
* Supplier discovery
* Business analytics
* Demand forecasting
* Dynamic pricing
* Credit/financing tools
* Cross-region commerce
* Messaging integrations
* Mobile applications

These are future capabilities, not MVP requirements.

---

# 37. IMPORTANT PRODUCT PRINCIPLE

The platform must NOT become:

> “A huge app containing every business feature.”

The central product must remain:

> **Find what you need → know where it is → know whether it is likely available → reserve/order it.**

And for sellers:

> **Know what customers want → manage your inventory → discover unmet demand → sell more effectively.**

Every feature should support one of these two loops.

---

# 38. REQUIRED OUTPUT FROM YOU

Before implementation, produce:

1. Final refined product concept
2. Product name suggestions
3. One-sentence value proposition
4. Problem statement
5. Target users
6. Core user journeys
7. MVP feature list
8. Features explicitly excluded from MVP
9. User roles and permissions
10. Database schema
11. System architecture
12. API structure
13. AI architecture
14. Security model
15. UI/UX page structure
16. Customer dashboard design
17. Seller dashboard design
18. Admin dashboard design
19. Demand intelligence design
20. Inventory freshness logic
21. Product search architecture
22. Reservation/order workflow
23. Notification strategy
24. Testing strategy
25. Deployment plan
26. Hackathon demo flow
27. Future roadmap
28. Potential technical risks
29. Potential business/product risks
30. Mitigations for those risks

Then produce the implementation in the smallest practical sequence that creates a **fully working end-to-end MVP**.

Prioritize working functionality over unnecessary polish.

Do not create fake functionality.

Do not fabricate inventory, demand data, verification, AI results, financial calculations, or delivery tracking without clearly marking demo/mock data.

Whenever a feature cannot be genuinely implemented within the MVP, create a clean extension point instead of pretending it works.

The final product should feel like a **real, trustworthy nationwide local-commerce infrastructure product**, while remaining realistic for a hackathon prototype.

# FINAL PRODUCT NORTH STAR

**Customers should be able to find a real product at a real shop with trustworthy stock information.**

**Sellers should be able to understand real customer demand and manage their supply accordingly.**

That supply-demand connection is the heart of the product.
