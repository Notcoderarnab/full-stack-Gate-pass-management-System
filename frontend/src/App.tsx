import React, { Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { getCurrentUser, getDashboardPath } from './services/api';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/Dashboard_layout';

// Pages
import Home from './pages/Home';
import AdminDashboard from "./pages/Dashboards/Admin_dashboard";
import HostDashboard from "./pages/Dashboards/Host_dashboard";
import UserDashboard  from "./pages/Dashboards/User_dashboards";
import VerifyPass from "./pages/VerifyPass";

// Lazy Pages
const SignIn = React.lazy(() => import('./Auth/sign_in'));
const SignUp = React.lazy(() => import('./Auth/sign_up'));

const DashboardRedirect = () => {
  const currentUser = getCurrentUser();
  return <Navigate to={getDashboardPath(currentUser?.role)} replace />;
};

const App = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        
        {/* ─── PUBLIC ROUTES (With Header & Footer) ─── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify" element={<VerifyPass />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>

        {/* ─── DASHBOARD ROUTES (No Header or Footer) ─── */}
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/host-dashboard" element={<HostDashboard />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/visitor-dashboard" element={<UserDashboard />} />
        </Route>

      </Routes>
    </Suspense>
  );
};

export default App;
