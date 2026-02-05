
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Rooms from '@/pages/Rooms';
import Bookings from '@/pages/Bookings';
import Gallery from '@/pages/Gallery';
import Dining from '@/pages/Dining';
import Reviews from '@/pages/Reviews';
import About from '@/pages/About';
import Users from '@/pages/Users';
import Chat from '@/pages/Chat';
import { Layout } from '@/components/layout/Layout';

// Placeholder Pages for now
// const Dashboard = () => <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>;
// const Rooms = () => <h1 className="text-3xl font-bold mb-4">Rooms Management</h1>;
// const Bookings = () => <h1 className="text-3xl font-bold mb-4">Bookings Management</h1>;
// const Bookings = () => <h1 className="text-3xl font-bold mb-4">Bookings Management</h1>;

const ADMIN_UID = "b8xaYwJXY9UuNuj6O9bEFfKdIdx2";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // We need to wait for loading to finish
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Strict Admin Check
  if (user.uid !== ADMIN_UID) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-6">You do not have permission to view this page.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          Go Back to Login
        </button>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/dining" element={<ProtectedRoute><Dining /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
