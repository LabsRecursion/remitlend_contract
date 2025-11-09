import { Button, Icon, Layout } from "@stellar/design-system";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { ThemeToggle } from "./components/ThemeToggle.tsx";
import { Routes, Route, Outlet, NavLink } from "react-router-dom";
import Debugger from "./pages/Debugger.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import BorrowerDashboard from "./pages/BorrowerDashboard.tsx";
import LenderDashboard from "./pages/LenderDashboard.tsx";
import VerificationFlow from "./pages/VerificationFlow.tsx";
import { AdminPage } from "./pages/AdminPage.tsx";
import { NotificationProvider } from "./components/NotificationSystem.tsx";

const AppLayout: React.FC = () => (
  <main>
    <Layout.Header
      projectId="RemitLend"
      projectTitle="RemitLend"
      contentRight={
        <>
          <nav style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <NavLink
              to="/verify"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  Verify
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/borrow"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  Borrow
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/lend"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  Lend
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/admin"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  Admin
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/debug"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  <Icon.Code02 size="md" />
                  Debug
                </Button>
              )}
            </NavLink>
          </nav>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <ThemeToggle />
            <ConnectAccount />
          </div>
        </>
      }
    />
    <Outlet />
    <Layout.Footer>
      <span>
        © {new Date().getFullYear()} RemitLend. Licensed under the{" "}
        <a
          href="http://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Apache License, Version 2.0
        </a>
        .
      </span>
    </Layout.Footer>
  </main>
);

function App() {
  return (
    <NotificationProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify" element={<VerificationFlow />} />
          <Route path="/borrow" element={<BorrowerDashboard />} />
          <Route path="/lend" element={<LenderDashboard />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/debug" element={<Debugger />} />
          <Route path="/debug/:contractName" element={<Debugger />} />
        </Route>
      </Routes>
    </NotificationProvider>
  );
}

export default App;
