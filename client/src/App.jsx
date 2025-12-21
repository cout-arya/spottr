import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home'; // To be implemented
import ProfileSetup from './pages/ProfileSetup'; // To be implemented
import Chat from './pages/Chat'; // To be implemented
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes Wrapper */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matches" element={<Chat />} />
          <Route path="/messages" element={<Chat />} />
          <Route path="/chat/:matchId" element={<Chat />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
