/*
  ProtectedRoute — oturum ve rol kontrolu
  Giris yapmamis kullanicilari login'e yonlendirir,
  yetersiz role sahip kullanicilara uyari gosterir
*/
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();

  // henuz kontrol ediliyorsa bekleme ekrani goster
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // giris yapilmamissa login'e yonlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // rol kontrolu — belirli bir rol gerekiyorsa
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erişim Engellendi</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <p className="text-sm text-gray-500 mt-1">Gerekli rol: {roles.join(', ')}</p>
        </div>
      </div>
    );
  }

  return children;
}
