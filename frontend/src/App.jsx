/* App.jsx - Main application component, routing configuration */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import VideoPage from './pages/VideoPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-6">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes — requires login */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/upload" element={
                  <ProtectedRoute roles={['editor', 'admin']}>
                    <UploadPage />
                  </ProtectedRoute>
                } />
                <Route path="/video/:id" element={
                  <ProtectedRoute>
                    <VideoPage />
                  </ProtectedRoute>
                } />

                {/* Admin only */}
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
