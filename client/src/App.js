import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";
import AlertsPage from "./pages/AlertsPage";
import AlertDetailsPage from "./pages/AlertDetailsPage";
import QuantumRiskPage from "./pages/QuantumRiskPage";
import WebhookEventsPage from "./pages/WebhookEventsPage";
import StreamingMonitorPage from "./pages/StreamingMonitorPage";
import RagTestPage from "./pages/RagTestPage";
import "./App.css";

function AppNavbar() {
  const location = useLocation();

  const alertsActive =
    location.pathname === "/" || location.pathname.startsWith("/alerts/");

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="brand">
            A<span className="brand-accent">u</span>ra
          </Link>

          <div className="navbar-links">
            <Link
              to="/"
              className={alertsActive ? "navbar-link navbar-link-active" : "navbar-link"}
            >
              Alerts
            </Link>

            <NavLink
              to="/webhook-events"
              className={({ isActive }) =>
                isActive ? "navbar-link navbar-link-active" : "navbar-link"
              }
            >
              Webhook Events
            </NavLink>

            <NavLink
              to="/quantum-risk"
              className={({ isActive }) =>
                isActive ? "navbar-link navbar-link-active" : "navbar-link"
              }
            >
              Quantum Risk
            </NavLink>

            <NavLink
              to="/streaming-monitor"
              className={({ isActive }) =>
                isActive ? "navbar-link navbar-link-active" : "navbar-link"
              }
            >
              Streaming Monitor
            </NavLink>

            <NavLink
              to="/rag-test"
              className={({ isActive }) =>
                isActive ? "navbar-link navbar-link-active" : "navbar-link"
              }
            >
              RAG Test
            </NavLink>
          </div>
        </div>

        <p className="navbar-subtitle">
          Autonomous Cloud Remediation Engine
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppNavbar />

      <Routes>
        <Route path="/" element={<AlertsPage />} />
        <Route path="/alerts/:id" element={<AlertDetailsPage />} />
        <Route path="/quantum-risk" element={<QuantumRiskPage />} />
        <Route path="/webhook-events" element={<WebhookEventsPage />} />
        <Route path="/streaming-monitor" element={<StreamingMonitorPage />} />
        <Route path="/rag-test" element={<RagTestPage />} />
      </Routes>
    </Router>
  );
}

export default App;