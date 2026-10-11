import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function toLocalInputValue(date) {
  const pad = (value) => String(value).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function toSqlDateTime(value) {
  return value.replace("T", " ") + (value.length === 16 ? ":00" : "");
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusOptions(status, role) {
  if (role === "CUSTOMER") {
    return ["PENDING", "CONFIRMED"].includes(status)
      ? ["CANCELLED"]
      : [];
  }

  const transitions = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CANCELLED", "ACTIVE"],
    ACTIVE: ["COMPLETED"],
    CANCELLED: [],
    COMPLETED: [],
  };

  return transitions[status] || [];
}

/* ==========================================================================
   SVG Icons (Clean, crisp, inline vector icons)
   ========================================================================== */
function IconParking({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  );
}

function IconCheckCircle({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconAlertCircle({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconRefresh({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconSignOut({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconCalendar({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconShield({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconPlus({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCar({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function IconBolt({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconSearch({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconGoogle({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function IconEmptyState() {
  return (
    <svg className="empty-state-icon" viewBox="0 0 64 64" fill="none">
      <rect x="10" y="14" width="44" height="38" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="32" cy="30" r="10" fill="#E2E8F0" />
      <path d="M30 26h4v8h-4zM30 36h4v2h-4z" fill="#94A3B8" />
    </svg>
  );
}

function IconEye({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function getDefaultBookingForm() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const exitTime = new Date(tomorrow);
  exitTime.setHours(exitTime.getHours() + 1);

  return {
    customer_id: "",
    vehicle_id: "",
    slot_id: "",
    expected_entry_time: toLocalInputValue(tomorrow),
    expected_exit_time: toLocalInputValue(exitTime),
    booking_source: "ONLINE",
  };
}

function AuthScreen({
  mode,
  setMode,
  form,
  setForm,
  onSubmit,
  onGoogleSuccess,
  googleLoading,
  loading,
  error,
  notice,
}) {
  const isRegister = mode === "register";
  const [showPassword, setShowPassword] = useState(false);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function fillDemoUser(email, password) {
    setMode("login");
    setForm((prev) => ({
      ...prev,
      email,
      password,
    }));
  }

  // Initialize Google Identity Services button
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!window.google?.accounts?.id) {
      return;
    }

    if (clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onGoogleSuccess(response.credential);
          }
        },
      });

      const btnContainer = document.getElementById("google-signin-btn-container");
      if (btnContainer) {
        btnContainer.innerHTML = "";
        window.google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          width: 380,
          text: isRegister ? "signup_with" : "signin_with",
          shape: "pill",
        });
      }
    }
  }, [isRegister, onGoogleSuccess]);

  return (
    <main className="auth-page">
      {/* Visual Showcase Panel */}
      <section className="auth-visual">
        <div className="auth-visual-inner">
          <header className="brand">
            <div className="brand-icon-wrap">
              <IconParking className="brand-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-title">CPOS</span>
              <span className="brand-tag">Enterprise Mobility</span>
            </div>
          </header>

          <div className="hero-copy">
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              Smart Parking Management Engine
            </div>
            <h1>Commercial parking operations, streamlined in one platform.</h1>
            <p>
              Instantly secure parking spaces, monitor capacity in real time, and audit
              enterprise-wide parking transactions with complete role-based security.
            </p>

            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-check"><IconCheckCircle /></span>
                <div>
                  <strong>Role-Based Access</strong>
                  <span>Super Admin, Operator & Customer tiers</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-check"><IconCheckCircle /></span>
                <div>
                  <strong>Live Status Tracking</strong>
                  <span>Pending, Confirmed, Active & Completed transitions</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-check"><IconCheckCircle /></span>
                <div>
                  <strong>Tamper-Resistant Audits</strong>
                  <span>Immutable security logs for compliance</span>
                </div>
              </div>
            </div>
          </div>

          <footer className="hero-footer">
            <div className="hero-stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">System Uptime</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">256-bit</span>
              <span className="stat-label">Encrypted Access</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">Zero</span>
              <span className="stat-label">Slot Conflicts</span>
            </div>
          </footer>
        </div>
      </section>

      {/* Form Interaction Panel */}
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-mode-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                className={`mode-toggle-btn ${!isRegister ? "active" : ""}`}
                onClick={() => setMode("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                className={`mode-toggle-btn ${isRegister ? "active" : ""}`}
                onClick={() => setMode("register")}
              >
                Create Account
              </button>
            </div>

            <h2>{isRegister ? "Join CPOS Operations" : "Sign in to your account"}</h2>
            <p className="auth-subtitle">
              {isRegister
                ? "Register a customer account with your vehicle and license details."
                : "Welcome back! Enter your credentials or sign in with Google."}
            </p>
          </div>

          {error && (
            <div className="alert error" role="alert">
              <IconAlertCircle className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="alert success" role="status">
              <IconCheckCircle className="alert-icon" />
              <span>{notice}</span>
            </div>
          )}

          {/* Google Sign-in Section */}
          <div className="google-auth-section">
            <div id="google-signin-btn-container" className="google-btn-wrapper"></div>
            {(!import.meta.env.VITE_GOOGLE_CLIENT_ID || !window.google?.accounts?.id) && (
              <button
                type="button"
                className="google-fallback-button"
                disabled={googleLoading || loading}
                onClick={() => {
                  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                    alert("Please set VITE_GOOGLE_CLIENT_ID in your frontend .env file to enable Google OAuth 2.0 login.");
                  }
                }}
              >
                <IconGoogle className="btn-icon" />
                <span>{isRegister ? "Sign up with Google" : "Sign in with Google"}</span>
              </button>
            )}
          </div>

          {/* Quick Demo Logins for Presentations - All 4 SRS Roles */}
          <div className="demo-accounts-strip">
            <span className="demo-strip-label">Quick Demo Access (All 4 SRS Roles):</span>
            <div className="demo-chips">
              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoUser("cpos.test.auditadmin@example.com", "Test@12345")}
                title="Super Administrator: System settings, users, audit engine"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoUser("cpos.test.manager.day2@example.com", "Test@12345")}
                title="Branch Manager: Layouts, rates, reports, all branch bookings"
              >
                🏢 Branch Manager
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoUser("cpos.test.operator.day2@example.com", "Test@12345")}
                title="Parking Operator: Entry/exit check, slot status, QR/OTP verification"
              >
                🛠️ Parking Operator
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => fillDemoUser("day2.customer@example.com", "Test@12345")}
                title="Customer: Reserve slots, view own bookings"
              >
                🚗 Customer
              </button>
            </div>
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label htmlFor="reg-name">Full name</label>
                  <input
                    id="reg-name"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                    autoComplete="name"
                    maxLength={150}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-address">Address</label>
                  <input
                    id="reg-address"
                    required
                    placeholder="Street, City, Postal Code"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    autoComplete="street-address"
                    maxLength={500}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-license">Driving licence number</label>
                  <input
                    id="reg-license"
                    required
                    placeholder="e.g. DL-9824-71249"
                    value={form.driving_license_number}
                    onChange={(e) =>
                      update("driving_license_number", e.target.value)
                    }
                    maxLength={100}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <IconEyeOff className="toggle-eye-icon" />
                  ) : (
                    <IconEye className="toggle-eye-icon" />
                  )}
                </button>
              </div>
              {isRegister && (
                <span className="field-hint">Must be at least 8 characters.</span>
              )}
            </div>

            <button className="primary-button" disabled={loading || googleLoading} type="submit">
              {loading ? (
                <span className="btn-spinner-wrap">
                  <span className="spinner"></span>
                  Processing...
                </span>
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          <footer className="auth-card-footer">
            <span className="text-muted">
              {isRegister ? "Already registered?" : "Don't have an account?"}
            </span>{" "}
            <button
              className="text-button"
              type="button"
              onClick={() => setMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Sign in here" : "Register now"}
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("cpos_token") || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cpos_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    full_name: "",
    email: "",
    password: "",
    address: "",
    driving_license_number: "",
  });

  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Sync token & user to localStorage whenever they change
  useEffect(() => {
    if (token) {
      localStorage.setItem("cpos_token", token);
    } else {
      localStorage.removeItem("cpos_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("cpos_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("cpos_user");
    }
  }, [user]);

  // Prevent browser back arrow from exiting the app
  useEffect(() => {
    // Push state so back button is trapped inside the application
    window.history.pushState({ cpos: true }, "", window.location.href);

    const handlePopState = () => {
      // Re-push state so user stays in CPOS
      window.history.pushState({ cpos: true }, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState(null);
  const [auditError, setAuditError] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  const [bookingForm, setBookingForm] = useState(getDefaultBookingForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedFloor, setSelectedFloor] = useState("L1");

  // Production Parking Layout: 12 defined slots per floor with types & zones
  const PARKING_LOT_SLOTS = [
    { id: 1, number: "A-01", type: "Standard", floor: "L1", isEv: false, isHandicap: false },
    { id: 2, number: "A-02", type: "Standard", floor: "L1", isEv: false, isHandicap: false },
    { id: 3, number: "A-03", type: "EV Charging", floor: "L1", isEv: true, isHandicap: false },
    { id: 4, number: "A-04", type: "EV Charging", floor: "L1", isEv: true, isHandicap: false },
    { id: 5, number: "B-01", type: "Compact", floor: "L1", isEv: false, isHandicap: false },
    { id: 6, number: "B-02", type: "Compact", floor: "L1", isEv: false, isHandicap: false },
    { id: 7, number: "B-03", type: "Accessible", floor: "L1", isEv: false, isHandicap: true },
    { id: 8, number: "B-04", type: "Accessible", floor: "L1", isEv: false, isHandicap: true },
    { id: 9, number: "C-01", type: "VIP / Reserved", floor: "L1", isEv: false, isHandicap: false },
    { id: 10, number: "C-02", type: "VIP / Reserved", floor: "L1", isEv: true, isHandicap: false },
    { id: 11, number: "C-03", type: "Standard", floor: "L1", isEv: false, isHandicap: false },
    { id: 12, number: "C-04", type: "Standard", floor: "L1", isEv: false, isHandicap: false },
  ];

  const role = normalizeRole(user?.role);
  const isSuperAdmin = role === "SUPER_ADMINISTRATOR";
  const isStaff = ["PARKING_OPERATOR", "BRANCH_MANAGER", "SUPER_ADMINISTRATOR"].includes(role);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    async function loadDashboard() {
      setDataLoading(true);
      setError("");

      try {
        const profile = await api.me(token);

        if (cancelled) return;

        setUser(profile.user);

        const result = await api.getBookings(token, page, 5);

        if (cancelled) return;

        setBookings(result.data || []);
        setPagination(
          result.pagination || {
            page,
            limit: 5,
            total: result.count || 0,
            totalPages: 1,
          }
        );

        if (normalizeRole(profile.user.role) === "SUPER_ADMINISTRATOR") {
          try {
            const audit = await api.getAuditLogs(token, 1, 10);

            if (cancelled) return;

            setAuditLogs(audit.data || []);
            setAuditPagination(audit.pagination || null);
            setAuditError("");
          } catch (auditRequestError) {
            if (!cancelled) {
              setAuditError(auditRequestError.message);
            }
          }
        } else {
          setAuditLogs([]);
          setAuditPagination(null);
          setAuditError("");
        }
      } catch (requestError) {
        if (cancelled) return;

        setError(requestError.message);

        if (requestError.status === 401) {
          setToken(null);
          setUser(null);
          setBookings([]);
          setAuditLogs([]);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token, page, refreshKey]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setAuthLoading(true);

    try {
      if (mode === "register") {
        await api.register({
          full_name: authForm.full_name.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
          address: authForm.address.trim(),
          driving_license_number: authForm.driving_license_number.trim(),
        });

        setMode("login");
        setNotice("Registration successful! Please sign in with your credentials.");
      } else {
        const result = await api.login({
          email: authForm.email.trim(),
          password: authForm.password,
        });

        setToken(result.token);
        setUser(result.user);
        setPage(1);
        setNotice("");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setBookings([]);
    setAuditLogs([]);
    setPage(1);
    setError("");
    setNotice("");
    setMode("login");
    setAuthForm({
      full_name: "",
      email: "",
      password: "",
      address: "",
      driving_license_number: "",
    });
  }

  function updateBookingField(field, value) {
    setBookingForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleCreateBooking(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBookingLoading(true);

    try {
      const body = {
        vehicle_id: Number(bookingForm.vehicle_id),
        slot_id: Number(bookingForm.slot_id),
        expected_entry_time: toSqlDateTime(
          bookingForm.expected_entry_time
        ),
        expected_exit_time: toSqlDateTime(
          bookingForm.expected_exit_time
        ),
        booking_source: bookingForm.booking_source,
      };

      if (isStaff) {
        body.customer_id = Number(bookingForm.customer_id);
      }

      const result = await api.createBooking(token, body);

      setNotice(`Booking #${result.booking_id} created successfully.`);
      setBookingForm((previous) => ({
        ...previous,
        vehicle_id: "",
        slot_id: "",
      }));
      setPage(1);
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleStatusUpdate(bookingId, newStatus) {
    setError("");
    setNotice("");

    try {
      const result = await api.updateBookingStatus(
        token,
        bookingId,
        newStatus
      );

      setNotice(
        `Booking #${result.booking_id} status updated to ${result.booking_status}.`
      );

      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function refreshAuditLogs() {
    setAuditLoading(true);
    try {
      const result = await api.getAuditLogs(token, 1, 10);
      setAuditLogs(result.data || []);
      setAuditPagination(result.pagination || null);
      setAuditError("");
    } catch (requestError) {
      setAuditError(requestError.message);
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleGoogleSuccess(credential) {
    setError("");
    setNotice("");
    setGoogleLoading(true);

    try {
      const result = await api.googleLogin(credential);
      setToken(result.token);
      setUser(result.user);
      setPage(1);
      setNotice("Signed in with Google successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  if (!token || !user) {
    return (
      <AuthScreen
        mode={mode}
        setMode={(nextMode) => {
          setMode(nextMode);
          setError("");
          setNotice("");
        }}
        form={authForm}
        setForm={setAuthForm}
        onSubmit={handleAuthSubmit}
        onGoogleSuccess={handleGoogleSuccess}
        googleLoading={googleLoading}
        loading={authLoading}
        error={error}
        notice={notice}
      />
    );
  }

  const userInitials = (user.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell">
      {/* Top Enterprise Navigation */}
      <header className="topbar">
        <div className="topbar-container">
          <div className="brand">
            <div className="brand-icon-wrap">
              <IconParking className="brand-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-title">CPOS</span>
              <span className="brand-tag">Operations Portal</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status-chip">
              <span className="pulse-indicator"></span>
              <span className="status-chip-text">System Active</span>
            </div>

            <div className="user-profile-badge">
              <div className="user-avatar" title={user.full_name}>
                {userInitials}
              </div>
              <div className="user-meta">
                <span className="user-name">{user.full_name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <span className={`role-badge role-${role.toLowerCase()}`}>
                {user.role}
              </span>
            </div>

            <button
              className="secondary-button logout-btn"
              onClick={logout}
              title="Sign out of CPOS"
            >
              <IconSignOut className="btn-icon" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Page Heading & Breadcrumb */}
          <section className="page-header">
            <div>
              <div className="breadcrumb">
                <span>CPOS</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">Management Dashboard</span>
              </div>
              <h1>Operations Dashboard</h1>
              <p className="page-desc">
                Welcome back, <strong>{user.full_name}</strong>. Real-time overview of authorized bookings and capacity.
              </p>
            </div>

            <div className="header-actions">
              <button
                className="secondary-button"
                disabled={dataLoading}
                onClick={() => setRefreshKey((v) => v + 1)}
              >
                <IconRefresh className={`btn-icon ${dataLoading ? "spin" : ""}`} />
                <span>{dataLoading ? "Refreshing..." : "Refresh Data"}</span>
              </button>
            </div>
          </section>

          {/* Alert Banners */}
          {error && (
            <div className="alert error" role="alert">
              <IconAlertCircle className="alert-icon" />
              <div className="alert-content">
                <strong>Error encountered</strong>
                <p>{error}</p>
              </div>
              <button className="alert-dismiss" onClick={() => setError("")}>×</button>
            </div>
          )}

          {notice && (
            <div className="alert success" role="status">
              <IconCheckCircle className="alert-icon" />
              <div className="alert-content">
                <strong>Update Successful</strong>
                <p>{notice}</p>
              </div>
              <button className="alert-dismiss" onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {/* Metric Summary Cards */}
          <section className="summary-grid">
            <article className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">Total Reservations</span>
                <span className="summary-icon-tile icon-blue">
                  <IconCalendar />
                </span>
              </div>
              <div className="summary-value">{pagination.total}</div>
              <div className="summary-footer">
                <span className="summary-trend">All authorized records</span>
              </div>
            </article>

            <article className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">Active / Confirmed</span>
                <span className="summary-icon-tile icon-indigo">
                  <IconCar />
                </span>
              </div>
              <div className="summary-value">
                {bookings.filter((b) => ["ACTIVE", "CONFIRMED"].includes(b.booking_status)).length}
                <span className="value-sub"> on this page</span>
              </div>
              <div className="summary-footer">
                <span className="summary-trend">
                  {bookings.filter((b) => b.booking_status === "ACTIVE").length} vehicles currently parked
                </span>
              </div>
            </article>

            <article className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">Facility Access Tier</span>
                <span className="summary-icon-tile icon-emerald">
                  <IconShield />
                </span>
              </div>
              <div className="summary-value role-name">{user.role}</div>
              <div className="summary-footer">
                <span className="summary-trend">RBAC token verified · Level 1 Lot</span>
              </div>
            </article>
          </section>

          {/* Interactive Live Parking Lot Visualizer */}
          <section className="panel parking-map-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-badge highlight">REAL-TIME TELEMETRY</span>
                <div className="map-title-row">
                  <h2>Live Parking Facility Floor Map</h2>
                  <div className="floor-selector-group">
                    <button
                      type="button"
                      className={`floor-btn ${selectedFloor === "L1" ? "active" : ""}`}
                      onClick={() => setSelectedFloor("L1")}
                    >
                      Floor L1 (Main Ground)
                    </button>
                    <button
                      type="button"
                      className={`floor-btn ${selectedFloor === "L2" ? "active" : ""}`}
                      onClick={() => setSelectedFloor("L2")}
                    >
                      Floor L2 (Underground)
                    </button>
                  </div>
                </div>
                <p className="panel-subtitle">
                  Click any vacant slot to automatically allocate it in the booking form.
                </p>
              </div>

              {/* Status Legend */}
              <div className="map-legend">
                <div className="legend-item">
                  <span className="legend-dot vacant"></span>
                  <span>Vacant</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot occupied"></span>
                  <span>Occupied</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot confirmed"></span>
                  <span>Reserved</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot ev"></span>
                  <span>EV Charge</span>
                </div>
              </div>
            </div>

            {/* Parking Slots Grid */}
            <div className="parking-lot-grid">
              {PARKING_LOT_SLOTS.map((slot) => {
                // Determine slot real-time status from bookings
                const activeBooking = bookings.find(
                  (b) => Number(b.slot_id) === slot.id && ["ACTIVE", "CONFIRMED"].includes(b.booking_status)
                );

                const isOccupied = activeBooking?.booking_status === "ACTIVE";
                const isConfirmed = activeBooking?.booking_status === "CONFIRMED";
                const isSelected = Number(bookingForm.slot_id) === slot.id;

                let slotStatus = "VACANT";
                let statusBadgeClass = "slot-vacant";

                if (isOccupied) {
                  slotStatus = "OCCUPIED";
                  statusBadgeClass = "slot-occupied";
                } else if (isConfirmed) {
                  slotStatus = "RESERVED";
                  statusBadgeClass = "slot-reserved";
                }

                return (
                  <div
                    key={slot.id}
                    className={`parking-slot-card ${statusBadgeClass} ${isSelected ? "selected-slot" : ""}`}
                    onClick={() => {
                      if (!isOccupied) {
                        updateBookingField("slot_id", slot.id);
                        setNotice(`Slot #${slot.id} (${slot.number} - ${slot.type}) selected for booking.`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title={
                      isOccupied
                        ? `Slot ${slot.id} is currently Occupied by Booking #${activeBooking?.booking_id}`
                        : `Click to select Slot ${slot.id} for reservation`
                    }
                  >
                    <div className="slot-top">
                      <span className="slot-id-number">#{slot.id}</span>
                      <span className="slot-zone-pill">{slot.number}</span>
                    </div>

                    <div className="slot-center-visual">
                      {slot.isEv ? (
                        <IconBolt className="slot-icon ev-icon" />
                      ) : (
                        <IconCar className="slot-icon car-icon" />
                      )}
                      <span className="slot-status-label">{slotStatus}</span>
                    </div>

                    <div className="slot-bottom">
                      <span className="slot-type-label">{slot.type}</span>
                      {isSelected && <span className="selected-indicator">✓ Selected</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Content Split: Bookings Table vs Create Booking Form */}
          <section className="content-grid">
            {/* Bookings Table Panel */}
            <article className="panel bookings-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <span className="panel-badge">DATABASE RECORDS</span>
                  <h2>Authorized Reservations</h2>
                  <p className="panel-subtitle">
                    Manage bookings associated with your privileges.
                  </p>
                </div>

                <div className="panel-header-badges">
                  <span className="counter-pill">
                    {pagination.total} total items
                  </span>
                </div>
              </div>

              {/* Table Toolbar: Search and Status Filters */}
              <div className="table-toolbar">
                <div className="table-search-box">
                  <IconSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by ID, slot, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="toolbar-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="table-filter-tabs">
                  {["ALL", "ACTIVE", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`filter-tab-btn ${statusFilter === status ? "active" : ""}`}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "ALL" ? "All Bookings" : status}
                    </button>
                  ))}
                </div>
              </div>

              {dataLoading ? (
                <div className="loading-state">
                  <span className="spinner large"></span>
                  <p>Loading real-time booking records...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="empty-state">
                  <IconEmptyState />
                  <h3>No bookings found on this page</h3>
                  <p>
                    There are no bookings matching your account on page {page}. Use the form on the right to schedule a reservation.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="cpos-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Slot</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Status</th>
                        <th className="th-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings
                        .filter((booking) => {
                          if (statusFilter !== "ALL" && booking.booking_status !== statusFilter) {
                            return false;
                          }
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            String(booking.booking_id).includes(q) ||
                            String(booking.slot_id).includes(q) ||
                            String(booking.booking_status).toLowerCase().includes(q) ||
                            formatDate(booking.expected_entry_time).toLowerCase().includes(q)
                          );
                        })
                        .map((booking) => {
                        const options = getStatusOptions(
                          booking.booking_status,
                          role
                        );
                        const statusClass = `status-${String(
                          booking.booking_status
                        ).toLowerCase()}`;

                        return (
                          <tr key={booking.booking_id}>
                            <td className="cell-id">
                              <span className="id-badge">#{booking.booking_id}</span>
                            </td>
                            <td className="cell-slot">
                              <span className="slot-badge">Slot {booking.slot_id}</span>
                            </td>
                            <td className="cell-time">
                              {formatDate(booking.expected_entry_time)}
                            </td>
                            <td className="cell-time">
                              {formatDate(booking.expected_exit_time)}
                            </td>
                            <td className="cell-status">
                              <span className={`status-pill ${statusClass}`}>
                                <span className="status-dot"></span>
                                {booking.booking_status}
                              </span>
                            </td>
                            <td className="cell-actions">
                              {options.length > 0 ? (
                                <div className="action-buttons">
                                  {options.map((status) => {
                                    const isCancel = status === "CANCELLED";
                                    const isConfirm = status === "CONFIRMED";
                                    const isActive = status === "ACTIVE";

                                    let btnClass = "small-button";
                                    if (isCancel) btnClass += " btn-cancel";
                                    else if (isConfirm) btnClass += " btn-confirm";
                                    else if (isActive) btnClass += " btn-active";

                                    return (
                                      <button
                                        key={status}
                                        className={btnClass}
                                        onClick={() =>
                                          handleStatusUpdate(
                                            booking.booking_id,
                                            status
                                          )
                                        }
                                      >
                                        {isCancel ? "Cancel" : status}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="cell-muted-text">None</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Pagination */}
              <div className="pagination-bar">
                <button
                  className="secondary-button pagination-btn"
                  disabled={page <= 1 || dataLoading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  ← Previous
                </button>

                <div className="pagination-indicator">
                  <span>Page</span>
                  <strong>{pagination.page}</strong>
                  <span>of</span>
                  <strong>{Math.max(1, pagination.totalPages)}</strong>
                </div>

                <button
                  className="secondary-button pagination-btn"
                  disabled={
                    dataLoading ||
                    pagination.totalPages === 0 ||
                    page >= pagination.totalPages
                  }
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next →
                </button>
              </div>
            </article>

            {/* Create Reservation Form Panel */}
            <article className="panel reservation-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <span className="panel-badge highlight">DISPATCH FORM</span>
                  <h2>New Reservation</h2>
                  <p className="panel-subtitle">
                    Allocate an authorized parking slot and timeframe.
                  </p>
                </div>
              </div>

              <form className="booking-form" onSubmit={handleCreateBooking}>
                {isStaff && (
                  <div className="form-group">
                    <label htmlFor="bk-customer-id">
                      Customer ID <span className="required-star">*</span>
                    </label>
                    <input
                      id="bk-customer-id"
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 101"
                      value={bookingForm.customer_id}
                      onChange={(e) =>
                        updateBookingField("customer_id", e.target.value)
                      }
                    />
                    <span className="field-hint">Staff role requires selecting customer account.</span>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bk-vehicle-id">
                      Vehicle ID <span className="required-star">*</span>
                    </label>
                    <input
                      id="bk-vehicle-id"
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 5"
                      value={bookingForm.vehicle_id}
                      onChange={(e) =>
                        updateBookingField("vehicle_id", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bk-slot-id">
                      Slot ID <span className="required-star">*</span>
                    </label>
                    <input
                      id="bk-slot-id"
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 12"
                      value={bookingForm.slot_id}
                      onChange={(e) =>
                        updateBookingField("slot_id", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bk-entry-time">
                    Expected Entry Time <span className="required-star">*</span>
                  </label>
                  <input
                    id="bk-entry-time"
                    type="datetime-local"
                    required
                    value={bookingForm.expected_entry_time}
                    onChange={(e) =>
                      updateBookingField("expected_entry_time", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bk-exit-time">
                    Expected Exit Time <span className="required-star">*</span>
                  </label>
                  <input
                    id="bk-exit-time"
                    type="datetime-local"
                    required
                    value={bookingForm.expected_exit_time}
                    onChange={(e) =>
                      updateBookingField("expected_exit_time", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bk-source">Booking Source</label>
                  <select
                    id="bk-source"
                    value={bookingForm.booking_source}
                    onChange={(e) =>
                      updateBookingField("booking_source", e.target.value)
                    }
                  >
                    <option value="ONLINE">Online Portal</option>
                    <option value="WALK_IN">Walk-in Gate Terminal</option>
                  </select>
                </div>

                <button
                  className="primary-button create-booking-btn"
                  disabled={bookingLoading}
                  type="submit"
                >
                  {bookingLoading ? (
                    <span className="btn-spinner-wrap">
                      <span className="spinner"></span>
                      Allocating slot...
                    </span>
                  ) : (
                    <>
                      <IconPlus className="btn-icon" />
                      <span>Confirm Reservation</span>
                    </>
                  )}
                </button>

                {role === "CUSTOMER" && (
                  <div className="notice-box">
                    <strong>Customer Account Guarantee:</strong>
                    <span>Your customer ID is automatically attached to this reservation. The vehicle ID entered must belong to your verified profile.</span>
                  </div>
                )}
              </form>
            </article>
          </section>

          {/* Super Administrator Audit Log Panel */}
          {isSuperAdmin && (
            <section className="panel audit-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <span className="panel-badge security">SUPER-ADMIN AUDIT ENGINE</span>
                  <h2>System Security & Compliance Trail</h2>
                  <p className="panel-subtitle">
                    Immutable security log records tracking all privileged actions.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  disabled={auditLoading}
                  onClick={refreshAuditLogs}
                >
                  <IconRefresh className={`btn-icon ${auditLoading ? "spin" : ""}`} />
                  <span>{auditLoading ? "Syncing..." : "Sync Audit Trail"}</span>
                </button>
              </div>

              {auditError && (
                <div className="alert error" role="alert">
                  <IconAlertCircle className="alert-icon" />
                  <span>{auditError}</span>
                </div>
              )}

              {!auditError && auditLogs.length === 0 ? (
                <div className="empty-state">
                  <IconEmptyState />
                  <h3>No audit records found</h3>
                  <p>No activity has been logged in the audit trail yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="cpos-table audit-table">
                    <thead>
                      <tr>
                        <th>Audit ID</th>
                        <th>Actor / User</th>
                        <th>Module</th>
                        <th>Action Performed</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((entry) => (
                        <tr key={entry.audit_id}>
                          <td className="cell-id">
                            <span className="id-badge audit">#{entry.audit_id}</span>
                          </td>
                          <td className="cell-actor">
                            <span className="actor-email">
                              {entry.actor_email || `User #${entry.user_id}`}
                            </span>
                          </td>
                          <td className="cell-module">
                            <span className="module-badge">{entry.module_name}</span>
                          </td>
                          <td className="cell-action">
                            <span className="action-tag">{entry.action}</span>
                          </td>
                          <td className="cell-time">
                            {formatDate(entry.action_timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {auditPagination && (
                <div className="audit-footer">
                  <span className="text-muted">
                    Showing latest <strong>{auditLogs.length}</strong> of <strong>{auditPagination.total}</strong> system audit records.
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Clean Dashboard Footer */}
          <footer className="dashboard-footer">
            <div className="footer-content">
              <div className="footer-left">
                <strong>CPOS</strong> · Commercial Parking Operations System
              </div>
              <div className="footer-right">
                <span>Enterprise Edition v2.4</span>
                <span className="footer-dot">·</span>
                <span>Protected by RBAC Security Engine</span>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
