# Rentoza - Rent. Ride. Explore.

Full-stack vehicle rental platform: React + Vite, Node + Express, MongoDB Atlas (Mongoose), JWT.

## Run

```bash
# 1) Backend
cd server
cp .env.example .env      # fill MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD
npm install
npm run seed              # creates the admin from .env (no public admin signup)
npm run dev               # http://localhost:5000  ->  /api/health

# 2) Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173  ->  redirects to /login
```

## Key rules implemented
- Login has 3 roles (Customer / Rental Owner / Admin); backend rejects a role mismatch. Signup has only Customer / Rental Owner.
- Owner signup creates owner (pending) + rental (pending); no auto login. Admin approves owner, then rental. Vehicles go live directly; admin can remove or restore them.
- Owners approve/reject/complete customer bookings. Admin only monitors bookings.
- Server calculates days x pricePerDay and blocks overlapping pending/confirmed bookings.
- Rental location is GeoJSON with a 2dsphere index; nearby search uses `$geoNear` (default 25 km, max 100 km).
- Customer live location stays in sessionStorage only; it is saved to MongoDB only if the customer taps "Save current location" in Profile.
- Vehicle images are URLs (no file upload). Password reset link is printed to the server console (no email service).

## Test order
Follow section 39 of your requirements: health -> signup -> owner pending -> admin approves owner, rental, vehicle -> customer books -> owner approves -> complete -> review -> support.
