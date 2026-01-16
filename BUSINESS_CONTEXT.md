# Schedulux: Business Context & Brainstorming Framework

## 🚀 Project Identity
**Name:** Schedulux
**Current State:** Advanced Beta (Feature complete for Scheduling, Foundation ready for Marketplace)
**Core Mission:** To transition from a utility-based "Scheduling Tool" into a growth-focused "Exposure Engine" for small service-based businesses.

---

## 💎 The Value Proposition
Unlike generic schedulers (Calendly, Square Appointments) that focus solely on *logistics* (managing existing demand), Schedulux aims to solve the harder problem: **Discovery** (generating new demand).

### 1. The Utility Layer (The "Hook")
*A professional-grade operations platform that runs the business.*
- **Multi-Storefront Management:** One owner can manage multiple physical locations seamlessly.
- **Complex Availability Engine:** Handles priority-based overrides (e.g., "Open 9-5, but closed for lunch, except on Fridays, and closed for Xmas").
- **Reliability:** Dual-booking modes (Instant vs. Request) with enterprise-grade race condition protection (PostgreSQL Advisory Locks).
- **Compliance:** Full audit trails and history tracking for every change.

### 2. The Exposure Layer (The "Differentiator")
*Turning operational data into marketing assets.*
- **Marketplace Network:** Aggregating supply (open slots) across all tenants to create a searchable destination for consumers.
- **Yield Management:** converting "dead inventory" (empty slots in the next 24h) into "Flash Deals" to attract budget-conscious discovery.
- **Visual Discovery:** "Book the Look" — Search by portfolio/result (e.g., "Balayage") rather than just business name.
- **Hyper-Local SEO:** Every storefront page is engineered to be a micro-site that outranks the business's own generic website.

---

## 🧠 Brainstorming Vectors
*Use these prompts to generate ideas for features, pivots, and marketing strategies.*

### Vector A: The "OpenTable" Effect (Aggregated Supply)
*How do we leverage the fact that we hold the master calendar for hundreds of businesses?*
- **Question:** How can we design a "Search Engine" that prioritizes *availability* over *lists*? (e.g., "Find me a barber open *right now*")
- **Technical Asset:** We have a high-performance `AvailabilityService` that can query slots in milliseconds.

### Vector B: "Yield Management" for Services (Dynamic Pricing)
*Airlines change prices based on demand. Why can't Salons?*
- **Question:** How can we automate "Flash Sales" so vendors don't have to manually manage them?
- **Idea:** "Happy Hour" pricing rules automatically applied to low-traffic times.

### Vector C: Community Cross-Pollination
*Small businesses rely on word-of-mouth. How do we digitize that?*
- **Question:** How can a coffee shop on Schedulux automatically drive traffic to the barber shop next door (also on Schedulux) after a purchase?
- **Concept:** "The Neighborhood Network" — Post-booking/payment referral loops.

### Vector D: The "Zero-Effort" Website
*Most small businesses have terrible websites.*
- **Question:** Can Schedulux be the *only* web presence a business needs?
- **Requirement:** Needs rich media (portfolio galleries), robust SEO (Schema.org injection), and social proof (reviews) built directly into the booking flow.

---

## 🏗️ Technical Foundation (Context for Feasibility)
*We are not starting from scratch. We have a modern, scalable stack:*
- **Backend:** Node.js / Express / TypeScript
- **Database:** PostgreSQL 15 (JSONB for flexibility, Geospatial ready, complex indexing)
- **Frontend:** React 18 / Tailwind / Vite
- **Architecture:** Multi-tenant by design (Storefronts isolated but queryable).

---

## 🎯 Target Audience
- **Primary:** High-touch service providers (Salons, Barbers, Tattoo Artists, Personal Trainers).
- **Secondary:** Professional services (Accountants, Consultants) who need complex rule management.
- **Pain Point:** "I'm good at my craft, but I'm bad at marketing and tech. I want a tool that brings me customers, not just organizes them."
