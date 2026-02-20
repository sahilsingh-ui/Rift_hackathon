import { useState, useEffect, useCallback, useRef } from "react";

// ─── Fonts & Global Styles ────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:#080d14;color:#e2eaf5;font-family:'DM Sans',sans-serif;overflow-x:hidden;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:#0d1420;}
::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px;}
::-webkit-scrollbar-thumb:hover{background:#2d5282;}
input,select,textarea{outline:none;font-family:inherit;}
button{cursor:pointer;font-family:inherit;}
a{text-decoration:none;color:inherit;}
@keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulseGreen{0%,100%{box-shadow:0 0 0 0 #00e56040}50%{box-shadow:0 0 0 12px #00e56000}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideOutRight{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes countUp{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
@keyframes ripple{0%{transform:scale(0);opacity:1}100%{transform:scale(4);opacity:0}}
@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes roadLine{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
.ride-card:hover{transform:translateY(-3px);box-shadow:0 20px 40px rgba(0,229,96,0.08)!important;}
.nav-link:hover{color:#00e560!important;}
.btn-primary{transition:all .2s;background:linear-gradient(135deg,#00e560,#00b347);color:#080d14;font-weight:700;border:none;border-radius:10px;padding:13px 28px;font-size:15px;letter-spacing:-.01em;}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px #00e56040;}
.btn-primary:active{transform:translateY(0);}
.btn-outline{transition:all .2s;background:transparent;color:#00e560;border:1.5px solid #00e56066;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;}
.btn-outline:hover{background:#00e56010;border-color:#00e560;}
.btn-ghost{transition:all .2s;background:transparent;color:#8ca0bc;border:1.5px solid #1e3a5f;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:500;}
.btn-ghost:hover{background:#0d1e33;color:#e2eaf5;border-color:#2d5282;}
.input-field{background:#0d1e33;border:1.5px solid #1e3a5f;border-radius:10px;padding:13px 16px;color:#e2eaf5;font-size:14px;width:100%;transition:border-color .2s;}
.input-field:focus{border-color:#00e560;}
.input-field::placeholder{color:#3d5a7a;}
.card{background:#0d1825;border:1px solid #1a2d45;border-radius:16px;transition:all .25s;}
.modal-overlay{position:fixed;inset:0;background:#00000088;backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .2s;}
.star{cursor:pointer;font-size:24px;transition:transform .15s;}
.star:hover{transform:scale(1.2);}
.status-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.05em;}
.toast{position:fixed;top:24px;right:24px;z-index:9999;min-width:300px;padding:14px 18px;border-radius:12px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 10px 40px #00000060;}
.tab-btn{padding:10px 20px;border:none;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:.03em;transition:all .2s;cursor:pointer;}
.tab-btn.active{background:#00e56020;color:#00e560;border:1px solid #00e56040;}
.tab-btn:not(.active){background:transparent;color:#4a6a8a;border:1px solid transparent;}
.tab-btn:not(.active):hover{color:#8ca0bc;background:#0d1e33;}
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const RATE_PER_KM = 0.003; // ALGO per km
const ALGO_PRICE_USD = 0.18;

// Campus locations with simulated distances
const LOCATIONS = [
  "Main Campus Gate", "Engineering Block A", "Science Faculty",
  "University Library", "Student Hostel North", "Student Hostel South",
  "Medical Faculty", "Business School", "Sports Complex",
  "City Center", "Train Station", "Airport Road",
  "Mall Road", "University Hospital", "Faculty of Arts",
];

// Simulated distance matrix (km)
function getDistance(a, b) {
  const seed = (a.charCodeAt(0) + b.charCodeAt(0) + a.length + b.length) % 40;
  return Math.max(3, seed + Math.random() * 5 | 0);
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_TRIPS = [
  {
    trip_id: "TRIP_001", driver_wallet: "ALGO_DRV_AHMED_001",
    driver_name: "Ahmed Raza", driver_rating: 4.8,
    origin: "Student Hostel North", destination: "Engineering Block A",
    distance_km: 7, departure_time: new Date(Date.now() + 3600000 * 2).toISOString(),
    seats_available: 3, seats_total: 4, price_per_seat: 0.021,
    created_at: new Date().toISOString(), status: "active",
  },
  {
    trip_id: "TRIP_002", driver_wallet: "ALGO_DRV_SARA_002",
    driver_name: "Sara Khan", driver_rating: 4.9,
    origin: "City Center", destination: "Main Campus Gate",
    distance_km: 12, departure_time: new Date(Date.now() + 3600000 * 4).toISOString(),
    seats_available: 2, seats_total: 3, price_per_seat: 0.036,
    created_at: new Date().toISOString(), status: "active",
  },
  {
    trip_id: "TRIP_003", driver_wallet: "ALGO_DRV_USMAN_003",
    driver_name: "Usman Malik", driver_rating: 4.5,
    origin: "Train Station", destination: "Business School",
    distance_km: 18, departure_time: new Date(Date.now() + 3600000 * 6).toISOString(),
    seats_available: 4, seats_total: 4, price_per_seat: 0.054,
    created_at: new Date().toISOString(), status: "active",
  },
  {
    trip_id: "TRIP_004", driver_wallet: "ALGO_DRV_ZARA_004",
    driver_name: "Zara Siddiqui", driver_rating: 5.0,
    origin: "Medical Faculty", destination: "City Center",
    distance_km: 9, departure_time: new Date(Date.now() + 3600000).toISOString(),
    seats_available: 1, seats_total: 2, price_per_seat: 0.027,
    created_at: new Date().toISOString(), status: "active",
  },
];

// ─── Utility Functions ────────────────────────────────────────────────────────
const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso) => new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
const fmtAlgo = (n) => Number(n).toFixed(4);
const genTxId = () => Array.from({ length: 52 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.random() * 32 | 0]).join("");
const genId = (prefix) => `${prefix}_${Date.now().toString(36).toUpperCase()}`;
const walletShort = (w) => w ? `${w.slice(0, 6)}...${w.slice(-4)}` : "";

// ─── Toast System ─────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={{
          background: t.type === "success" ? "#0d2e1a" : t.type === "error" ? "#2e0d0d" : "#0d1e33",
          border: `1px solid ${t.type === "success" ? "#00e56040" : t.type === "error" ? "#e5000040" : "#1e3a5f"}`,
          color: t.type === "success" ? "#00e560" : t.type === "error" ? "#e56060" : "#8ca0bc",
          animation: "slideInRight .3s ease",
        }}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "inherit", opacity: .5, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  return { toasts, add, remove };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    Pending: { bg: "#1e2a0d", color: "#a3e560", border: "#a3e56040", dot: "#a3e560" },
    Paid: { bg: "#0d1e2e", color: "#60b8e5", border: "#60b8e540", dot: "#60b8e5" },
    Completed: { bg: "#0d2e1a", color: "#00e560", border: "#00e56040", dot: "#00e560" },
    active: { bg: "#0d1e2e", color: "#60b8e5", border: "#60b8e540", dot: "#60b8e5" },
    cancelled: { bg: "#2e1a0d", color: "#e5a060", border: "#e5a06040", dot: "#e5a060" },
  }[status] ?? { bg: "#1a1a2e", color: "#8ca0bc", border: "#1e3a5f", dot: "#8ca0bc" };
  return (
    <span className="status-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s} className={readonly ? "" : "star"}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(s)}
          style={{ fontSize: readonly ? 14 : 24, cursor: readonly ? "default" : "pointer", transition: "transform .15s",
            color: s <= (hover || value) ? "#fbbf24" : "#1e3a5f" }}
        >★</span>
      ))}
      {readonly && value > 0 && <span style={{ fontSize: 12, color: "#8ca0bc", marginLeft: 4 }}>{value.toFixed(1)}</span>}
    </div>
  );
}

// ─── Wallet Connect Button ────────────────────────────────────────────────────
function WalletConnectButton({ wallet, onConnect, onDisconnect }) {
  const [open, setOpen] = useState(false);
  const fakeWallet = "ABCDEFGHIJKLMNOP" + Math.random().toString(36).slice(2, 10).toUpperCase() + "QRSTUVWXYZ";

  if (wallet) return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
        background: "#00e56015", border: "1px solid #00e56040", borderRadius: 10,
        color: "#00e560", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s"
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e560", animation: "pulseGreen 2s infinite", display: "inline-block" }} />
        {walletShort(wallet)}
        <span style={{ fontSize: 10, opacity: .7 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#0d1825", border: "1px solid #1a2d45", borderRadius: 12, padding: 6, minWidth: 180, zIndex: 500 }}>
          <div style={{ padding: "8px 12px", fontSize: 11, color: "#4a6a8a", fontFamily: "monospace", borderBottom: "1px solid #1a2d45", marginBottom: 4 }}>
            {wallet.slice(0, 20)}...
          </div>
          <button onClick={() => { setOpen(false); onDisconnect(); }} style={{ width: "100%", padding: "9px 12px", background: "none", border: "none", color: "#e56060", fontSize: 13, textAlign: "left", borderRadius: 8, cursor: "pointer" }}>
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );

  return (
    <button onClick={() => onConnect(fakeWallet)} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "9px 18px",
      background: "linear-gradient(135deg,#00e560,#00b347)", border: "none",
      borderRadius: 10, color: "#080d14", fontSize: 13, fontWeight: 700, cursor: "pointer",
      transition: "all .2s",
    }}>
      <span>⬡</span> Connect Pera Wallet
    </button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, wallet, onConnect, onDisconnect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    ["home", "Home"], ["find", "Find Ride"], ["post", "Post Ride"], ["profile", "Profile"]
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "#080d14ee", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #1a2d4580", padding: "0 24px", height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#00e560,#00b347)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🚗
        </div>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#e2eaf5", lineHeight: 1 }}>RIDECHAIN</div>
          <div style={{ fontSize: 9, color: "#4a6a8a", letterSpacing: ".12em" }}>CAMPUS • ALGORAND</div>
        </div>
      </button>

      {/* Desktop nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {navItems.map(([k, label]) => (
          <button key={k} className="nav-link" onClick={() => setPage(k)}
            style={{
              background: "none", border: "none", padding: "8px 14px",
              fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 8,
              color: page === k ? "#00e560" : "#8ca0bc",
              background: page === k ? "#00e56010" : "transparent",
              transition: "all .2s",
            }}>
            {label}
          </button>
        ))}
        {wallet && (
          <button onClick={() => setPage("dashboard")} className="nav-link"
            style={{ background: page === "dashboard" ? "#00e56010" : "none", border: "none", padding: "8px 14px", fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 8, color: page === "dashboard" ? "#00e560" : "#8ca0bc", transition: "all .2s" }}>
            Dashboard
          </button>
        )}
      </div>

      <WalletConnectButton wallet={wallet} onConnect={onConnect} onDisconnect={onDisconnect} />
    </nav>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
function BookingModal({ trip, wallet, onClose, onBook, addToast }) {
  const [seats, setSeats] = useState(1);
  const [step, setStep] = useState("confirm"); // confirm | paying | success
  const [txId, setTxId] = useState("");
  const total = (trip.price_per_seat * seats).toFixed(4);

  const handlePay = async () => {
    if (!wallet) { addToast("Please connect your Pera Wallet first!", "error"); return; }
    setStep("paying");
    await new Promise((r) => setTimeout(r, 2200));
    const tx = genTxId();
    setTxId(tx);
    setStep("success");
    onBook({ trip, seats: seats, total: parseFloat(total), txId: tx });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: "100%", maxWidth: 480, padding: 28, animation: "fadeSlideUp .3s ease", maxHeight: "90vh", overflowY: "auto" }}>
        {step === "confirm" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800 }}>Book Ride</h2>
              <button onClick={onClose} style={{ background: "#0d1e33", border: "none", borderRadius: 8, width: 32, height: 32, color: "#8ca0bc", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Trip summary */}
            <div style={{ background: "#080d14", border: "1px solid #1a2d45", borderRadius: 12, padding: 18, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a5f,#2d5282)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{trip.driver_name}</div>
                  <StarRating value={trip.driver_rating} readonly />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                {[
                  ["🟢 From", trip.origin],
                  ["🔴 To", trip.destination],
                  ["📅 Date", fmtDate(trip.departure_time)],
                  ["⏰ Time", fmtTime(trip.departure_time)],
                  ["📍 Distance", `${trip.distance_km} km`],
                  ["💺 Available", `${trip.seats_available} seats`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ color: "#4a6a8a", fontSize: 11, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 500, color: "#c8d8ec" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seat selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#8ca0bc", display: "block", marginBottom: 8 }}>Number of Seats</label>
              <div style={{ display: "flex", gap: 8 }}>
                {Array.from({ length: trip.seats_available }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setSeats(n)} style={{
                    width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${seats === n ? "#00e560" : "#1e3a5f"}`,
                    background: seats === n ? "#00e56015" : "#0d1e33", color: seats === n ? "#00e560" : "#8ca0bc",
                    fontWeight: 700, fontSize: 16, transition: "all .2s",
                  }}>{n}</button>
                ))}
              </div>
            </div>

            {/* Fare breakdown */}
            <div style={{ background: "#080d14", border: "1px solid #1a2d45", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#4a6a8a", marginBottom: 12 }}>FARE BREAKDOWN</div>
              {[
                ["Price per seat", `${fmtAlgo(trip.price_per_seat)} ALGO`],
                ["Seats", `× ${seats}`],
                ["Distance", `${trip.distance_km} km`],
                ["Network fee", "~0.001 ALGO"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "#8ca0bc" }}>
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1a2d45", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
                <span>Total</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#00e560" }}>{total} ALGO</div>
                  <div style={{ fontSize: 11, color: "#4a6a8a", fontWeight: 400 }}>≈ ${(parseFloat(total) * ALGO_PRICE_USD).toFixed(2)} USD</div>
                </div>
              </div>
            </div>

            {!wallet && (
              <div style={{ background: "#1e2a0d", border: "1px solid #a3e56040", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: "#a3e560" }}>
                ⚠ Connect your Pera Wallet to pay in ALGO
              </div>
            )}
            <button className="btn-primary" style={{ width: "100%" }} onClick={handlePay}>
              Pay {total} ALGO via Pera Wallet →
            </button>
          </>
        )}

        {step === "paying" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 60, height: 60, border: "3px solid #1e3a5f", borderTop: "3px solid #00e560", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Processing Payment</h3>
            <p style={{ color: "#4a6a8a", fontSize: 14 }}>Confirming on Algorand Testnet...</p>
            <div style={{ marginTop: 20, background: "#0d1e33", borderRadius: 8, padding: 10, fontSize: 11, color: "#4a6a8a", fontFamily: "monospace" }}>
              Broadcasting transaction to ALGO node...
            </div>
          </div>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "32px 20px", animation: "fadeSlideUp .4s ease" }}>
            <div style={{ width: 72, height: 72, background: "#00e56020", border: "2px solid #00e56040", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px", animation: "pulseGreen 2s infinite" }}>✓</div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#00e560", marginBottom: 8 }}>Payment Successful!</h3>
            <p style={{ color: "#8ca0bc", fontSize: 14, marginBottom: 24 }}>Your seat is confirmed. Have a safe ride!</p>
            <div style={{ background: "#080d14", border: "1px solid #1a2d45", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "#4a6a8a", marginBottom: 10, letterSpacing: ".08em" }}>TRANSACTION DETAILS</div>
              {[
                ["Amount Paid", `${total} ALGO`],
                ["Seats Booked", seats],
                ["Trip", `${trip.origin} → ${trip.destination}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "#4a6a8a" }}>{k}</span>
                  <span style={{ color: "#c8d8ec", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1a2d45", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#4a6a8a", marginBottom: 6 }}>TX ID</div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#00e560", wordBreak: "break-all" }}>{txId}</div>
              </div>
              <a href={`https://testnet.algoexplorer.io/tx/${txId}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", marginTop: 12, padding: "8px 14px", background: "#00e56010", border: "1px solid #00e56030", borderRadius: 8, color: "#00e560", fontSize: 12, textAlign: "center", textDecoration: "none" }}>
                View on AlgoExplorer Testnet →
              </a>
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rating Modal ─────────────────────────────────────────────────────────────
function RatingModal({ booking, trip, onClose, onRate }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 28, animation: "fadeSlideUp .3s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800 }}>Rate Your Ride</h2>
          <button onClick={onClose} style={{ background: "#0d1e33", border: "none", borderRadius: 8, width: 32, height: 32, color: "#8ca0bc", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{trip?.driver_name ?? "Driver"}</div>
          <div style={{ color: "#4a6a8a", fontSize: 13 }}>{trip?.origin} → {trip?.destination}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "#8ca0bc", display: "block", marginBottom: 10 }}>Your Rating</label>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="star" onClick={() => setStars(s)}
                style={{ fontSize: 36, color: s <= stars ? "#fbbf24" : "#1e3a5f", transition: "all .2s" }}>★</span>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <textarea className="input-field" rows={3} placeholder="Leave a comment (optional)..."
            value={comment} onChange={(e) => setComment(e.target.value)}
            style={{ resize: "none" }} />
        </div>
        <button className="btn-primary" style={{ width: "100%", opacity: stars === 0 ? .5 : 1 }}
          disabled={stars === 0} onClick={() => onRate(stars, comment)}>
          Submit Rating
        </button>
      </div>
    </div>
  );
}

// ─── Trip Card ─────────────────────────────────────────────────────────────────
function TripCard({ trip, wallet, onBook }) {
  const timeLeft = Math.max(0, Math.round((new Date(trip.departure_time) - Date.now()) / 60000));
  const hrs = Math.floor(timeLeft / 60), mins = timeLeft % 60;

  return (
    <div className="card ride-card" style={{ padding: 22, cursor: "default", transition: "all .25s", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#00e560,#00b347)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#1e3a5f,#2d5282)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{trip.driver_name}</div>
            <StarRating value={trip.driver_rating} readonly />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#00e560" }}>
            {fmtAlgo(trip.price_per_seat)}
          </div>
          <div style={{ fontSize: 11, color: "#4a6a8a" }}>ALGO/seat</div>
        </div>
      </div>

      {/* Route */}
      <div style={{ background: "#080d14", border: "1px solid #1a2d45", borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e560" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#c8d8ec" }}>{trip.origin}</span>
        </div>
        <div style={{ marginLeft: 3, borderLeft: "1.5px dashed #1e3a5f", height: 16, marginBottom: 8, marginLeft: 3 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e56060" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#c8d8ec" }}>{trip.destination}</span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {[
          ["📅", fmtDate(trip.departure_time)],
          ["⏰", fmtTime(trip.departure_time)],
          ["📍", `${trip.distance_km}km`],
          ["💺", `${trip.seats_available}/${trip.seats_total}`],
        ].map(([icon, val]) => (
          <div key={val} style={{ background: "#0d1e33", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 12, marginBottom: 3 }}>{icon}</div>
            <div style={{ fontSize: 11, color: "#8ca0bc", fontWeight: 500 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#4a6a8a" }}>
          {timeLeft > 0 ? `Departs in ${hrs > 0 ? `${hrs}h ` : ""}${mins}m` : "Departed"}
        </div>
        <button className="btn-primary" style={{ padding: "10px 22px", fontSize: 13 }}
          onClick={() => onBook(trip)} disabled={trip.seats_available === 0}>
          {trip.seats_available === 0 ? "Full" : "Book Seat →"}
        </button>
      </div>
    </div>
  );
}

// ─── Find Ride Page ───────────────────────────────────────────────────────────
function FindRide({ trips, wallet, addToast, onBookingDone }) {
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("");
  const [results, setResults] = useState(trips);
  const [bookingTrip, setBookingTrip] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    setSearched(true);
    let filtered = [...trips];
    if (origin) filtered = filtered.filter((t) => t.origin.toLowerCase().includes(origin.toLowerCase()));
    if (dest) filtered = filtered.filter((t) => t.destination.toLowerCase().includes(dest.toLowerCase()));
    if (seats) filtered = filtered.filter((t) => t.seats_available >= parseInt(seats));
    setResults(filtered);
  };

  const handleBook = (trip) => {
    if (!wallet) { addToast("Connect your wallet to book a ride!", "error"); return; }
    setBookingTrip(trip);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 34, fontWeight: 800, marginBottom: 8 }}>Find a Ride</h1>
        <p style={{ color: "#4a6a8a", fontSize: 15 }}>Search available campus rides and pay in ALGO</p>
      </div>

      {/* Search Panel */}
      <div className="card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 6 }}>FROM</label>
            <select className="input-field" value={origin} onChange={(e) => setOrigin(e.target.value)}>
              <option value="">Any origin</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 6 }}>TO</label>
            <select className="input-field" value={dest} onChange={(e) => setDest(e.target.value)}>
              <option value="">Any destination</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 6 }}>DATE</label>
            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 6 }}>MIN SEATS</label>
            <input type="number" className="input-field" placeholder="Any" min={1} max={8} value={seats} onChange={(e) => setSeats(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={search}>🔍 Search Rides</button>
          <button className="btn-ghost" onClick={() => { setOrigin(""); setDest(""); setDate(""); setSeats(""); setResults(trips); setSearched(false); }}>Clear</button>
        </div>
      </div>

      {/* Results */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#4a6a8a" }}>
          {searched ? `${results.length} rides found` : `${results.length} rides available`}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No rides found</h3>
          <p style={{ color: "#4a6a8a" }}>Try different locations or clear filters</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20 }}>
          {results.map((t) => (
            <TripCard key={t.trip_id} trip={t} wallet={wallet} onBook={handleBook} />
          ))}
        </div>
      )}

      {bookingTrip && (
        <BookingModal
          trip={bookingTrip} wallet={wallet} addToast={addToast}
          onClose={() => setBookingTrip(null)}
          onBook={(data) => { onBookingDone(data); setBookingTrip(null); addToast("Booking confirmed! Enjoy your ride 🚗", "success"); }}
        />
      )}
    </div>
  );
}

// ─── Post Ride Page ───────────────────────────────────────────────────────────
function PostRide({ wallet, addToast, onTripPosted }) {
  const [form, setForm] = useState({
    origin: "", destination: "", departure_date: "", departure_time: "",
    seats: "2", price_mode: "auto", price_per_seat: "",
  });
  const [calc, setCalc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const calculateFare = () => {
    if (!form.origin || !form.destination) { addToast("Select origin and destination", "error"); return; }
    if (form.origin === form.destination) { addToast("Origin and destination must differ", "error"); return; }
    const dist = getDistance(form.origin, form.destination);
    const fare = parseFloat((dist * RATE_PER_KM).toFixed(4));
    setCalc({ dist, fare });
    set("price_per_seat", fare.toFixed(4));
    addToast(`Estimated fare calculated: ${fare} ALGO`, "success");
  };

  const submit = async () => {
    if (!wallet) { addToast("Connect your wallet to post a ride", "error"); return; }
    if (!form.origin || !form.destination) { addToast("Origin and destination required", "error"); return; }
    if (!form.departure_date || !form.departure_time) { addToast("Departure date/time required", "error"); return; }
    if (!form.price_per_seat) { addToast("Calculate fare first", "error"); return; }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const trip = {
      trip_id: genId("TRIP"),
      driver_wallet: wallet,
      driver_name: "You",
      driver_rating: 0,
      origin: form.origin,
      destination: form.destination,
      distance_km: calc?.dist ?? getDistance(form.origin, form.destination),
      departure_time: new Date(`${form.departure_date}T${form.departure_time}`).toISOString(),
      seats_available: parseInt(form.seats),
      seats_total: parseInt(form.seats),
      price_per_seat: parseFloat(form.price_per_seat),
      created_at: new Date().toISOString(),
      status: "active",
    };

    onTripPosted(trip);
    setSubmitting(false);
    setSuccess(true);
    addToast("Ride posted successfully! 🚗", "success");
  };

  if (success) return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, background: "#00e56020", border: "2px solid #00e56040", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px", animation: "pulseGreen 2s infinite" }}>🚗</div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#00e560", marginBottom: 12 }}>Ride Posted!</h2>
      <p style={{ color: "#4a6a8a", marginBottom: 28 }}>Your ride is now visible to riders. They can book and pay in ALGO.</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button className="btn-primary" onClick={() => setSuccess(false)}>Post Another</button>
        <button className="btn-ghost" onClick={() => window.location.reload()}>View Dashboard</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 34, fontWeight: 800, marginBottom: 8 }}>Post a Ride</h1>
        <p style={{ color: "#4a6a8a", fontSize: 15 }}>Share your journey and earn ALGO</p>
      </div>

      {!wallet && (
        <div style={{ background: "#1e2a0d", border: "1px solid #a3e56040", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: "#a3e560" }}>
          ⚠ Connect your Pera Wallet to post rides and receive payments
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "grid", gap: 20 }}>

          {/* Route */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 8, letterSpacing: ".06em" }}>ORIGIN</label>
              <select className="input-field" value={form.origin} onChange={(e) => { set("origin", e.target.value); setCalc(null); }}>
                <option value="">Select pickup location</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 8, letterSpacing: ".06em" }}>DESTINATION</label>
              <select className="input-field" value={form.destination} onChange={(e) => { set("destination", e.target.value); setCalc(null); }}>
                <option value="">Select destination</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Date/Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 8, letterSpacing: ".06em" }}>DEPARTURE DATE</label>
              <input type="date" className="input-field" value={form.departure_date} onChange={(e) => set("departure_date", e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 8, letterSpacing: ".06em" }}>DEPARTURE TIME</label>
              <input type="time" className="input-field" value={form.departure_time} onChange={(e) => set("departure_time", e.target.value)} />
            </div>
          </div>

          {/* Seats */}
          <div>
            <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 8, letterSpacing: ".06em" }}>SEATS AVAILABLE</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} onClick={() => set("seats", String(n))} style={{
                  flex: 1, padding: "12px 0", borderRadius: 10,
                  border: `1.5px solid ${form.seats === String(n) ? "#00e560" : "#1e3a5f"}`,
                  background: form.seats === String(n) ? "#00e56015" : "#0d1e33",
                  color: form.seats === String(n) ? "#00e560" : "#4a6a8a", fontWeight: 700, fontSize: 15,
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Fare Calculator */}
          <div>
            <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 8, letterSpacing: ".06em" }}>FARE CALCULATION</label>
            <div style={{ display: "flex", gap: 10, marginBottom: calc ? 12 : 0 }}>
              <button className="btn-outline" style={{ flex: 1, padding: "13px" }} onClick={calculateFare}>
                ⚡ Calculate Estimated Fare
              </button>
            </div>

            {calc && (
              <div style={{ background: "#00e56008", border: "1px solid #00e56030", borderRadius: 10, padding: 16, animation: "fadeSlideUp .3s" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#4a6a8a", marginBottom: 4 }}>DISTANCE</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#c8d8ec" }}>{calc.dist} km</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#4a6a8a", marginBottom: 4 }}>RATE</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#c8d8ec" }}>{RATE_PER_KM}/km</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#4a6a8a", marginBottom: 4 }}>FARE/SEAT</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#00e560" }}>{calc.fare} ALGO</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom price override */}
          <div>
            <label style={{ fontSize: 12, color: "#4a6a8a", display: "block", marginBottom: 8, letterSpacing: ".06em" }}>PRICE PER SEAT (ALGO)</label>
            <input type="number" step="0.001" min="0" className="input-field" placeholder="Auto-calculated or enter custom"
              value={form.price_per_seat} onChange={(e) => set("price_per_seat", e.target.value)} />
            {form.price_per_seat && (
              <div style={{ fontSize: 12, color: "#4a6a8a", marginTop: 6 }}>
                ≈ ${(parseFloat(form.price_per_seat) * ALGO_PRICE_USD).toFixed(3)} USD per seat
              </div>
            )}
          </div>

          <button className="btn-primary" style={{ width: "100%", padding: "15px" }} onClick={submit} disabled={submitting}>
            {submitting ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ width: 18, height: 18, border: "2px solid #080d14", borderTop: "2px solid #080d1480", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                Posting ride...
              </span>
            ) : "🚗 Post Ride to RIDECHAIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Driver Dashboard ─────────────────────────────────────────────────────────
function DriverDashboard({ wallet, trips, bookings, addToast, onComplete, onRateRider }) {
  const myTrips = trips.filter((t) => t.driver_wallet === wallet);
  const [activeTab, setActiveTab] = useState("rides");
  const [ratingBooking, setRatingBooking] = useState(null);

  const getBookingsForTrip = (tripId) => bookings.filter((b) => b.trip_id === tripId);
  const totalEarned = bookings
    .filter((b) => b.status === "Paid" || b.status === "Completed")
    .filter((b) => myTrips.some((t) => t.trip_id === b.trip_id))
    .reduce((s, b) => s + b.total_price, 0);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Rides Posted", value: myTrips.length, icon: "🚗", color: "#00e560" },
          { label: "Total Bookings", value: bookings.filter((b) => myTrips.some((t) => t.trip_id === b.trip_id)).length, icon: "📋", color: "#60b8e5" },
          { label: "ALGO Earned", value: `${fmtAlgo(totalEarned)}`, icon: "⬡", color: "#a3e560" },
          { label: "Completed Rides", value: bookings.filter((b) => b.status === "Completed" && myTrips.some((t) => t.trip_id === b.trip_id)).length, icon: "✓", color: "#fbbf24" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#4a6a8a", marginTop: 6, letterSpacing: ".06em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["rides", "bookings"].map((t) => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "rides" ? "My Rides" : "Incoming Bookings"}
          </button>
        ))}
      </div>

      {activeTab === "rides" && (
        myTrips.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🚗</div>
            <p style={{ color: "#4a6a8a" }}>No rides posted yet. Post your first ride to start earning!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {myTrips.map((trip) => {
              const tripBookings = getBookingsForTrip(trip.trip_id);
              return (
                <div key={trip.trip_id} className="card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                        {trip.origin} → {trip.destination}
                      </div>
                      <div style={{ color: "#4a6a8a", fontSize: 13 }}>{fmtDate(trip.departure_time)} at {fmtTime(trip.departure_time)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <StatusBadge status={trip.status} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#00e560" }}>{fmtAlgo(trip.price_per_seat)} ALGO/seat</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#4a6a8a" }}>
                    <span>📍 {trip.distance_km}km</span>
                    <span>💺 {trip.seats_available}/{trip.seats_total} available</span>
                    <span>📋 {tripBookings.length} bookings</span>
                    <span>💰 {fmtAlgo(tripBookings.filter((b) => b.status !== "Pending").reduce((s, b) => s + b.total_price, 0))} ALGO collected</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === "bookings" && (
        <div style={{ display: "grid", gap: 12 }}>
          {bookings.filter((b) => myTrips.some((t) => t.trip_id === b.trip_id)).length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
              <p style={{ color: "#4a6a8a" }}>No bookings yet. Riders will appear here when they book your rides.</p>
            </div>
          ) : (
            bookings.filter((b) => myTrips.some((t) => t.trip_id === b.trip_id)).map((booking) => {
              const trip = myTrips.find((t) => t.trip_id === booking.trip_id);
              return (
                <div key={booking.booking_id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        Rider: <span style={{ fontFamily: "monospace", fontSize: 13, color: "#60b8e5" }}>{walletShort(booking.rider_wallet)}</span>
                      </div>
                      <div style={{ color: "#4a6a8a", fontSize: 13 }}>
                        {trip?.origin} → {trip?.destination} • {booking.seats_booked} seat(s) • {fmtAlgo(booking.total_price)} ALGO
                      </div>
                      {booking.payment_tx_id && (
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a6a8a", marginTop: 4 }}>
                          TX: {booking.payment_tx_id.slice(0, 20)}...
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <StatusBadge status={booking.status} />
                      {booking.status === "Paid" && (
                        <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}
                          onClick={() => onComplete(booking.booking_id)}>
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          trip={myTrips.find((t) => t.trip_id === ratingBooking.trip_id)}
          onClose={() => setRatingBooking(null)}
          onRate={(stars, comment) => {
            onRateRider(ratingBooking.booking_id, stars, comment);
            setRatingBooking(null);
            addToast("Rating submitted!", "success");
          }}
        />
      )}
    </div>
  );
}

// ─── Rider Dashboard ──────────────────────────────────────────────────────────
function RiderDashboard({ wallet, trips, bookings, addToast, onRate }) {
  const myBookings = bookings.filter((b) => b.rider_wallet === wallet);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [rated, setRated] = useState(new Set());

  const totalSpent = myBookings.filter((b) => b.status !== "Pending").reduce((s, b) => s + b.total_price, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Rides Booked", value: myBookings.length, icon: "🎫", color: "#00e560" },
          { label: "ALGO Spent", value: fmtAlgo(totalSpent), icon: "⬡", color: "#60b8e5" },
          { label: "Completed", value: myBookings.filter((b) => b.status === "Completed").length, icon: "✓", color: "#a3e560" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#4a6a8a", marginTop: 6, letterSpacing: ".06em" }}>{label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>My Bookings</h3>

      {myBookings.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🎫</div>
          <p style={{ color: "#4a6a8a" }}>No bookings yet. Find a ride and book with ALGO!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {myBookings.map((booking) => {
            const trip = trips.find((t) => t.trip_id === booking.trip_id);
            return (
              <div key={booking.booking_id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {trip?.origin ?? "Unknown"} → {trip?.destination ?? "Unknown"}
                    </div>
                    <div style={{ color: "#4a6a8a", fontSize: 13, marginBottom: 4 }}>
                      {booking.seats_booked} seat(s) • {fmtAlgo(booking.total_price)} ALGO
                      {trip && ` • ${fmtDate(trip.departure_time)}`}
                    </div>
                    {booking.payment_tx_id && (
                      <a href={`https://testnet.algoexplorer.io/tx/${booking.payment_tx_id}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "#00e560", fontFamily: "monospace" }}>
                        TX: {booking.payment_tx_id.slice(0, 16)}... ↗
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <StatusBadge status={booking.status} />
                    {booking.status === "Completed" && !rated.has(booking.booking_id) && (
                      <button className="btn-outline" style={{ padding: "7px 14px", fontSize: 12 }}
                        onClick={() => setRatingBooking(booking)}>
                        Rate Driver ★
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          trip={trips.find((t) => t.trip_id === ratingBooking.trip_id)}
          onClose={() => setRatingBooking(null)}
          onRate={(stars, comment) => {
            onRate(ratingBooking.booking_id, stars, comment);
            setRated((s) => new Set([...s, ratingBooking.booking_id]));
            setRatingBooking(null);
            addToast("Thanks for rating! Your feedback helps the community.", "success");
          }}
        />
      )}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function Dashboard({ wallet, trips, bookings, ratings, addToast, onTripComplete, onRate }) {
  const [tab, setTab] = useState("driver");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 34, fontWeight: 800, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: "#4a6a8a" }}>Manage your rides, bookings, and earnings</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {[["driver", "🚗 Driver View"], ["rider", "🎫 Rider View"]].map(([k, label]) => (
          <button key={k} className={`tab-btn ${tab === k ? "active" : ""}`} onClick={() => setTab(k)} style={{ padding: "11px 22px", fontSize: 14 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "driver" ? (
        <DriverDashboard wallet={wallet} trips={trips} bookings={bookings} addToast={addToast}
          onComplete={onTripComplete} onRateRider={onRate} />
      ) : (
        <RiderDashboard wallet={wallet} trips={trips} bookings={bookings} addToast={addToast} onRate={onRate} />
      )}
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function Profile({ wallet, trips, bookings, ratings, onConnect }) {
  if (!wallet) return (
    <div style={{ maxWidth: 480, margin: "100px auto", padding: "0 20px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>⬡</div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Connect Your Wallet</h2>
      <p style={{ color: "#4a6a8a", marginBottom: 28 }}>Link your Pera Wallet to view your profile, rides, and transaction history.</p>
      <WalletConnectButton wallet={null} onConnect={onConnect} onDisconnect={() => {}} />
    </div>
  );

  const myTrips = trips.filter((t) => t.driver_wallet === wallet);
  const myBookings = bookings.filter((b) => b.rider_wallet === wallet);
  const myRatings = ratings.filter((r) => r.to_wallet === wallet);
  const avgRating = myRatings.length ? (myRatings.reduce((s, r) => s + r.stars, 0) / myRatings.length) : 0;
  const totalEarned = bookings.filter((b) => myTrips.some((t) => t.trip_id === b.trip_id) && b.status !== "Pending").reduce((s, b) => s + b.total_price, 0);
  const totalSpent = myBookings.filter((b) => b.status !== "Pending").reduce((s, b) => s + b.total_price, 0);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      {/* Profile header */}
      <div className="card" style={{ padding: 32, marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#00e560,#00b347)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#00e56030,#00b34730)", border: "2px solid #00e56040", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Campus Rider</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#4a6a8a", marginBottom: 10, wordBreak: "break-all" }}>{wallet}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {myTrips.length > 0 && <span style={{ background: "#00e56015", color: "#00e560", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Driver</span>}
              {myBookings.length > 0 && <span style={{ background: "#60b8e515", color: "#60b8e5", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Rider</span>}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <StarRating value={parseFloat(avgRating.toFixed(1))} readonly />
            <div style={{ fontSize: 12, color: "#4a6a8a", marginTop: 4 }}>{myRatings.length} reviews</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          ["Rides Posted", myTrips.length, "#00e560"],
          ["Rides Booked", myBookings.length, "#60b8e5"],
          ["ALGO Earned", fmtAlgo(totalEarned), "#a3e560"],
          ["ALGO Spent", fmtAlgo(totalSpent), "#e5a060"],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "#4a6a8a", marginTop: 6, letterSpacing: ".06em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 18 }}>Transaction History</h3>
        {myBookings.filter((b) => b.payment_tx_id).length === 0 ? (
          <p style={{ color: "#4a6a8a", fontSize: 14 }}>No transactions yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {myBookings.filter((b) => b.payment_tx_id).map((b) => {
              const trip = trips.find((t) => t.trip_id === b.trip_id);
              return (
                <div key={b.booking_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#080d14", border: "1px solid #1a2d45", borderRadius: 10, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{trip?.origin} → {trip?.destination}</div>
                    <a href={`https://testnet.algoexplorer.io/tx/${b.payment_tx_id}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "monospace", fontSize: 11, color: "#00e560" }}>
                      {b.payment_tx_id.slice(0, 24)}... ↗
                    </a>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#e56060", fontWeight: 700, fontSize: 15 }}>−{fmtAlgo(b.total_price)} ALGO</div>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function Landing({ setPage, wallet, onConnect }) {
  const stats = [
    { n: "2,400+", label: "Students onboard" },
    { n: "18,000+", label: "ALGO transacted" },
    { n: "4.9★", label: "Avg driver rating" },
    { n: "100%", label: "On-chain payments" },
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", padding: "100px 24px 80px", textAlign: "center" }}>
        {/* Animated background */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,#00e56012,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", height: "1px", background: "#00e56015",
              width: "100%", top: `${20 + i * 20}%`, left: 0,
              animation: `roadLine ${3 + i}s linear infinite`, animationDelay: `${-i * 0.7}s`,
            }} />
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#00e56015", border: "1px solid #00e56040", borderRadius: 20, fontSize: 12, color: "#00e560", fontWeight: 600, marginBottom: 28, letterSpacing: ".08em" }}>
            ⬡ POWERED BY ALGORAND TESTNET
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(40px,7vw,72px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: "-.03em" }}>
            Campus rides.<br />
            <span style={{ background: "linear-gradient(135deg,#00e560,#60e5b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Paid in crypto.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(15px,2vw,19px)", color: "#4a6a8a", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
            The first campus ride-sharing platform where fares are settled instantly on Algorand blockchain. No cash. No trust issues.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ padding: "15px 34px", fontSize: 16 }} onClick={() => setPage("find")}>
              Find a Ride →
            </button>
            <button className="btn-outline" style={{ padding: "14px 30px", fontSize: 15 }} onClick={() => setPage("post")}>
              Post a Ride
            </button>
            {!wallet && (
              <WalletConnectButton wallet={null} onConnect={onConnect} onDisconnect={() => {}} />
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: "#0d1825", borderTop: "1px solid #1a2d45", borderBottom: "1px solid #1a2d45", padding: "28px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, textAlign: "center" }}>
          {stats.map(({ n, label }) => (
            <div key={label}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: "#00e560", animation: "countUp .5s ease" }}>{n}</div>
              <div style={{ fontSize: 12, color: "#4a6a8a", marginTop: 4, letterSpacing: ".06em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 38, fontWeight: 800, marginBottom: 12 }}>How it works</h2>
          <p style={{ color: "#4a6a8a", fontSize: 16 }}>Ride sharing in 4 simple steps</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
          {[
            { n: "01", icon: "⬡", title: "Connect Wallet", desc: "Link your Pera Wallet to authenticate and pay on Algorand Testnet" },
            { n: "02", icon: "🔍", title: "Find or Post", desc: "Search available campus rides or post your own route to earn ALGO" },
            { n: "03", icon: "💰", title: "Book & Pay", desc: "Book seats and pay the exact fare instantly in ALGO with zero middleman" },
            { n: "04", icon: "✓", title: "Ride & Rate", desc: "Complete the journey and rate each other to build campus trust" },
          ].map(({ n, icon, title, desc }) => (
            <div key={n} className="card" style={{ padding: 28, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 16, right: 16, fontFamily: "'Syne',sans-serif", fontSize: 40, fontWeight: 800, color: "#00e56010" }}>{n}</div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: "#4a6a8a", fontSize: 13, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#0d1825", borderTop: "1px solid #1a2d45", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#00e560,#00b347)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🚗</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>RIDECHAIN</span>
        </div>
        <p style={{ fontSize: 12, color: "#4a6a8a" }}>RIFT 2026 Hackathon • Algorand Open Innovation Track • Testnet Only</p>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [wallet, setWallet] = useState(null);
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [bookings, setBookings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const { toasts, add: addToast, remove } = useToast();

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ridechainState");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.wallet) setWallet(s.wallet);
        if (s.trips) setTrips(s.trips);
        if (s.bookings) setBookings(s.bookings);
        if (s.ratings) setRatings(s.ratings);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ridechainState", JSON.stringify({ wallet, trips, bookings, ratings }));
  }, [wallet, trips, bookings, ratings]);

  const handleConnect = (w) => {
    setWallet(w);
    addToast(`Wallet connected: ${walletShort(w)}`, "success");
  };

  const handleDisconnect = () => {
    setWallet(null);
    addToast("Wallet disconnected", "info");
  };

  const handleBookingDone = ({ trip, seats, total, txId }) => {
    const booking = {
      booking_id: genId("BKG"),
      trip_id: trip.trip_id,
      rider_wallet: wallet,
      seats_booked: seats,
      total_price: total,
      status: "Paid",
      payment_tx_id: txId,
      created_at: new Date().toISOString(),
    };
    setBookings((b) => [...b, booking]);
    setTrips((ts) => ts.map((t) => t.trip_id === trip.trip_id
      ? { ...t, seats_available: Math.max(0, t.seats_available - seats) }
      : t
    ));
  };

  const handleTripPosted = (trip) => setTrips((ts) => [trip, ...ts]);

  const handleComplete = (bookingId) => {
    setBookings((bs) => bs.map((b) => b.booking_id === bookingId ? { ...b, status: "Completed" } : b));
    addToast("Ride marked as completed!", "success");
  };

  const handleRate = (bookingId, stars, comment) => {
    const booking = bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return;
    const trip = trips.find((t) => t.trip_id === booking.trip_id);
    const rating = {
      rating_id: genId("RTG"),
      trip_id: booking.trip_id,
      from_wallet: wallet,
      to_wallet: wallet === booking.rider_wallet ? (trip?.driver_wallet ?? "") : booking.rider_wallet,
      stars, comment,
      created_at: new Date().toISOString(),
    };
    setRatings((rs) => [...rs, rating]);
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Toast toasts={toasts} remove={remove} />
      <Navbar page={page} setPage={setPage} wallet={wallet} onConnect={handleConnect} onDisconnect={handleDisconnect} />
      <main>
        {page === "home" && <Landing setPage={setPage} wallet={wallet} onConnect={handleConnect} />}
        {page === "find" && <FindRide trips={trips} wallet={wallet} addToast={addToast} onBookingDone={handleBookingDone} />}
        {page === "post" && <PostRide wallet={wallet} addToast={addToast} onTripPosted={handleTripPosted} />}
        {page === "dashboard" && wallet && <Dashboard wallet={wallet} trips={trips} bookings={bookings} ratings={ratings} addToast={addToast} onTripComplete={handleComplete} onRate={handleRate} />}
        {page === "profile" && <Profile wallet={wallet} trips={trips} bookings={bookings} ratings={ratings} onConnect={handleConnect} />}
      </main>
    </>
  );
}
