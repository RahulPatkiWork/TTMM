# TTMM - State Tracking

## Current Status
- **Phase 1 (Foundation):** Completed.
- **Phase 2 (Backend & Logic):** Completed.
- **Phase 3 (Frontend Foundation):** Completed.
- **Phase 4 (Pro Features):** Completed.
  - [x] Integrate Gemini Vision API for receipt scanning.
  - [x] Create UI for claiming extracted line items (Itemized Split).
  - [x] Implement Proportional Tax/Tip math engine.
  - [x] Integrate Google Maps Geocoding API for location tagging.

## Verification Results
1. **Scenario A (Cyclical Debt):** PASS
2. **Scenario B (The Rogue Cent):** PASS
3. **Add Expense Validation:** PASS
4. **Itemized Split Math:**
   - Input: ₹500 item (User A), ₹100 item (User B), ₹60 tax.
   - Output: User A tax = ₹50, User B tax = ₹10. **PASS**

## API Constraints Implemented
- **Validation Barrier:** `POST /api/expenses` enforces `sum(splits) === total_amount_cents`.
- **Dynamic Settlement:** `GET /api/groups/:id/balances` returns the mathematically simplified graph.
- **Gemini Vision:** `POST /api/receipts/scan` uses `responseMimeType: "application/json"` and strict schema.
- **Location Tagging:** `POST /api/location/geocode` uses Google Maps API to return localized place names.

## Next Steps
- **COMPLETED**
