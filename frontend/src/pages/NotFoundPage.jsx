/*
  404 sayfasi — tanimlanmamis route'lara duser
*/
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-600 mb-6">Aradığınız sayfa bulunamadı</p>
        <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
