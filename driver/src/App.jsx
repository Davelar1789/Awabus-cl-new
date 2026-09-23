import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import { useOfflineSync } from './hooks/useOfflineSync.js';

import SignIn from './pages/auth/SignIn.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import VerifyOtp from './pages/auth/VerifyOtp.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import ResetSuccess from './pages/auth/ResetSuccess.jsx';

import Home from './pages/home/Home.jsx';
import ActiveTrip from './pages/trip/ActiveTrip.jsx';
import DelayBroadcast from './pages/trip/DelayBroadcast.jsx';
import BroadcastSent from './pages/trip/BroadcastSent.jsx';
import TripCompleted from './pages/trip/TripCompleted.jsx';

import TripHistory from './pages/history/TripHistory.jsx';
import TripHistoryDetail from './pages/history/TripHistoryDetail.jsx';
import BroadcastHistory from './pages/history/BroadcastHistory.jsx';

import Settings from './pages/settings/Settings.jsx';
import HelpSupport from './pages/settings/HelpSupport.jsx';

export default function App() {
  useOfflineSync();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const theme = JSON.parse(localStorage.getItem('awabus_driver_prefs') || '{}').theme || 'system';
      if (theme === 'system') document.documentElement.classList.toggle('dark', mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-success" element={<ResetSuccess />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/trip/active" element={<ActiveTrip />} />
          <Route path="/trip/delay-broadcast" element={<DelayBroadcast />} />
          <Route path="/trip/delay-broadcast/sent" element={<BroadcastSent />} />
          <Route path="/trip/completed" element={<TripCompleted />} />

          <Route path="/trip-history" element={<TripHistory />} />
          <Route path="/trip-history/:id" element={<TripHistoryDetail />} />
          <Route path="/broadcast-history" element={<BroadcastHistory />} />

          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<HelpSupport />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
