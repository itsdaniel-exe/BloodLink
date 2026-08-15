import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Landing from "./pages/Landing.jsx";
import RegisterDonor from "./pages/RegisterDonor.jsx";
import DonorPortal from "./pages/DonorPortal.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Requests from "./pages/Requests.jsx";
import Inventory from "./pages/Inventory.jsx";
import MlInsights from "./pages/MlInsights.jsx";
import Assistant from "./pages/Assistant.jsx";

function OpsLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="h-full flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function OpsPage({ children }) {
  return (
    <ProtectedRoute>
      <OpsLayout>{children}</OpsLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegisterDonor />} />
        <Route path="/my/:donorId" element={<DonorPortal />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route
          path="/dashboard"
          element={
            <OpsPage>
              <Dashboard />
            </OpsPage>
          }
        />
        <Route
          path="/requests"
          element={
            <OpsPage>
              <Requests />
            </OpsPage>
          }
        />
        <Route
          path="/inventory"
          element={
            <OpsPage>
              <Inventory />
            </OpsPage>
          }
        />
        <Route
          path="/ml-insights"
          element={
            <OpsPage>
              <MlInsights />
            </OpsPage>
          }
        />
        <Route
          path="/assistant"
          element={
            <OpsPage>
              <Assistant />
            </OpsPage>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
