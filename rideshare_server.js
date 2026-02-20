/**
 * RIDECHAIN – Campus Ride-Share API
 * Node.js + Express + in-memory store (swap for MongoDB/Postgres)
 * Run: node server.js
 */

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-memory stores (replace with DB) ──────────────────────────────────────
const db = {
  trips: [],
  bookings: [],
  users: {},
  ratings: [],
};

// ─── Middleware ───────────────────────────────────────────────────────────────
const requireWallet = (req, res, next) => {
  const wallet = req.headers["x-wallet-address"];
  if (!wallet) return res.status(401).json({ error: "Wallet address required in x-wallet-address header" });
  req.wallet = wallet;
  next();
};

// ─── Trips ────────────────────────────────────────────────────────────────────
// POST /api/trips — Create a trip
app.post("/api/trips", requireWallet, (req, res) => {
  const { origin, destination, distance_km, departure_time, seats_available, price_per_seat, driver_name } = req.body;

  if (!origin || !destination || !departure_time || !seats_available || !price_per_seat) {
    return res.status(400).json({ error: "Missing required fields: origin, destination, departure_time, seats_available, price_per_seat" });
  }
  if (origin === destination) return res.status(400).json({ error: "Origin and destination must differ" });
  if (price_per_seat <= 0) return res.status(400).json({ error: "Price must be greater than 0" });

  const trip = {
    trip_id: `TRIP_${uuidv4().slice(0, 8).toUpperCase()}`,
    driver_wallet: req.wallet,
    driver_name: driver_name || "Anonymous Driver",
    driver_rating: 0,
    origin, destination,
    distance_km: distance_km || null,
    departure_time,
    seats_available: parseInt(seats_available),
    seats_total: parseInt(seats_available),
    price_per_seat: parseFloat(price_per_seat),
    created_at: new Date().toISOString(),
    status: "active",
  };

  db.trips.push(trip);
  res.status(201).json(trip);
});

// GET /api/trips — List trips with filters
app.get("/api/trips", (req, res) => {
  const { origin, destination, date, min_seats } = req.query;
  let results = db.trips.filter((t) => t.status === "active");

  if (origin) results = results.filter((t) => t.origin.toLowerCase().includes(origin.toLowerCase()));
  if (destination) results = results.filter((t) => t.destination.toLowerCase().includes(destination.toLowerCase()));
  if (date) results = results.filter((t) => t.departure_time.startsWith(date));
  if (min_seats) results = results.filter((t) => t.seats_available >= parseInt(min_seats));

  res.json({ trips: results, count: results.length });
});

// GET /api/trips/:id
app.get("/api/trips/:id", (req, res) => {
  const trip = db.trips.find((t) => t.trip_id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  res.json(trip);
});

// PATCH /api/trips/:id/complete
app.patch("/api/trips/:id/complete", requireWallet, (req, res) => {
  const trip = db.trips.find((t) => t.trip_id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.driver_wallet !== req.wallet) return res.status(403).json({ error: "Only the driver can complete this trip" });

  trip.status = "completed";
  // Mark all paid bookings as completed
  db.bookings.filter((b) => b.trip_id === trip.trip_id && b.status === "Paid")
    .forEach((b) => (b.status = "Completed"));

  res.json({ success: true, trip });
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
// POST /api/bookings — Create a booking
app.post("/api/bookings", requireWallet, (req, res) => {
  const { trip_id, seats_booked, payment_tx_id } = req.body;

  if (!trip_id || !seats_booked || !payment_tx_id) {
    return res.status(400).json({ error: "Missing: trip_id, seats_booked, payment_tx_id" });
  }

  const trip = db.trips.find((t) => t.trip_id === trip_id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.status !== "active") return res.status(400).json({ error: "Trip is no longer active" });
  if (parseInt(seats_booked) > trip.seats_available) {
    return res.status(400).json({ error: `Only ${trip.seats_available} seat(s) available` });
  }
  if (trip.driver_wallet === req.wallet) {
    return res.status(400).json({ error: "Driver cannot book their own ride" });
  }

  const booking = {
    booking_id: `BKG_${uuidv4().slice(0, 8).toUpperCase()}`,
    trip_id,
    rider_wallet: req.wallet,
    seats_booked: parseInt(seats_booked),
    total_price: parseFloat((trip.price_per_seat * parseInt(seats_booked)).toFixed(6)),
    status: "Paid",
    payment_tx_id,
    created_at: new Date().toISOString(),
  };

  trip.seats_available = Math.max(0, trip.seats_available - parseInt(seats_booked));
  if (trip.seats_available === 0) trip.status = "full";

  db.bookings.push(booking);
  res.status(201).json(booking);
});

// GET /api/bookings — Get bookings (filtered by wallet)
app.get("/api/bookings", requireWallet, (req, res) => {
  const { role } = req.query; // "rider" | "driver"
  let bookings = db.bookings;

  if (role === "driver") {
    const myTripIds = new Set(db.trips.filter((t) => t.driver_wallet === req.wallet).map((t) => t.trip_id));
    bookings = bookings.filter((b) => myTripIds.has(b.trip_id));
  } else {
    bookings = bookings.filter((b) => b.rider_wallet === req.wallet);
  }

  res.json({ bookings, count: bookings.length });
});

// PATCH /api/bookings/:id/complete
app.patch("/api/bookings/:id/complete", requireWallet, (req, res) => {
  const booking = db.bookings.find((b) => b.booking_id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const trip = db.trips.find((t) => t.trip_id === booking.trip_id);
  if (!trip || trip.driver_wallet !== req.wallet) {
    return res.status(403).json({ error: "Only the driver can complete this booking" });
  }

  booking.status = "Completed";
  res.json({ success: true, booking });
});

// ─── Ratings ──────────────────────────────────────────────────────────────────
// POST /api/ratings
app.post("/api/ratings", requireWallet, (req, res) => {
  const { trip_id, to_wallet, stars, comment } = req.body;

  if (!trip_id || !to_wallet || !stars) {
    return res.status(400).json({ error: "Missing: trip_id, to_wallet, stars" });
  }
  if (stars < 1 || stars > 5) return res.status(400).json({ error: "Stars must be between 1 and 5" });

  // Check if already rated
  const existing = db.ratings.find((r) => r.trip_id === trip_id && r.from_wallet === req.wallet && r.to_wallet === to_wallet);
  if (existing) return res.status(409).json({ error: "Already rated for this trip" });

  const rating = {
    rating_id: `RTG_${uuidv4().slice(0, 8).toUpperCase()}`,
    trip_id, from_wallet: req.wallet, to_wallet,
    stars: parseInt(stars), comment: comment || "",
    created_at: new Date().toISOString(),
  };

  db.ratings.push(rating);

  // Update driver rating average in trips
  const driverRatings = db.ratings.filter((r) => r.to_wallet === to_wallet);
  const avg = driverRatings.reduce((s, r) => s + r.stars, 0) / driverRatings.length;
  db.trips.filter((t) => t.driver_wallet === to_wallet).forEach((t) => (t.driver_rating = parseFloat(avg.toFixed(1))));

  res.status(201).json(rating);
});

// GET /api/ratings/:wallet
app.get("/api/ratings/:wallet", (req, res) => {
  const ratings = db.ratings.filter((r) => r.to_wallet === req.params.wallet);
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : 0;
  res.json({ ratings, average: parseFloat(avg.toFixed(1)), count: ratings.length });
});

// ─── Users / Profile ──────────────────────────────────────────────────────────
// GET /api/profile — Get profile for connected wallet
app.get("/api/profile", requireWallet, (req, res) => {
  const wallet = req.wallet;
  const myTrips = db.trips.filter((t) => t.driver_wallet === wallet);
  const myBookings = db.bookings.filter((b) => b.rider_wallet === wallet);
  const myRatings = db.ratings.filter((r) => r.to_wallet === wallet);
  const avgRating = myRatings.length ? myRatings.reduce((s, r) => s + r.stars, 0) / myRatings.length : 0;
  const totalEarned = db.bookings
    .filter((b) => myTrips.some((t) => t.trip_id === b.trip_id) && b.status !== "Pending")
    .reduce((s, b) => s + b.total_price, 0);
  const totalSpent = myBookings.filter((b) => b.status !== "Pending").reduce((s, b) => s + b.total_price, 0);

  res.json({
    wallet,
    rides_posted: myTrips.length,
    rides_booked: myBookings.length,
    avg_rating: parseFloat(avgRating.toFixed(1)),
    rating_count: myRatings.length,
    total_earned_algo: parseFloat(totalEarned.toFixed(6)),
    total_spent_algo: parseFloat(totalSpent.toFixed(6)),
    recent_transactions: myBookings.filter((b) => b.payment_tx_id).slice(-10),
  });
});

// ─── Fare Calculation ─────────────────────────────────────────────────────────
const RATE_PER_KM = 0.003;
app.post("/api/calculate-fare", (req, res) => {
  const { origin, destination, seats } = req.body;
  if (!origin || !destination) return res.status(400).json({ error: "origin and destination required" });
  // In production: call Maps API here
  const distance_km = Math.max(3, (origin.charCodeAt(0) + destination.charCodeAt(0) + origin.length + destination.length) % 40);
  const price_per_seat = parseFloat((distance_km * RATE_PER_KM).toFixed(4));
  const total = parseFloat((price_per_seat * (seats || 1)).toFixed(4));
  const est_time_min = Math.round(distance_km * 3);
  res.json({ distance_km, price_per_seat, total, est_time_min, rate_per_km: RATE_PER_KM });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", service: "RIDECHAIN API", version: "1.0.0" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚗 RIDECHAIN API running on port ${PORT}`));
