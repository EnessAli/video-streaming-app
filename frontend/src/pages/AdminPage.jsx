/*
  Admin paneli — sadece admin rolundeki kullanicilara acik
  Iki sekme: kullanici yonetimi ve tum videolarin listesi.
  Rol degistirme, kullanici silme ve video silme islemleri burada
*/
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import adminService from '../services/adminService';
import videoService from '../services/videoService';
import Navbar from '../components/layout/Navbar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // kullanici state'leri
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // video state'leri
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videoPagination, setVideoPagination] = useState(null);
  const [videoPage, setVideoPage] = useState(1);

  const [message, setMessage] = useState({ text: '', type: '' });

  // kullanicilari cek
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'videos') fetchVideos();
  }, [activeTab, videoPage]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data.users);
    } catch (err) {
      showMessage('Kullanıcılar yüklenemedi', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      setVideosLoading(true);
      const data = await videoService.getAllVideos({ page: videoPage, limit: 20 });
      setVideos(data.videos);
      setVideoPagination(data.pagination);
    } catch (err) {
      showMessage('Videolar yüklenemedi', 'error');
    } finally {
      setVideosLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // rol degistir
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      showMessage('Rol güncellendi');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Rol güncellenemedi', 'error');
    }
  };

  // kullanici sil
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`${username} kullanıcısını silmek istediğinize emin misiniz? Tüm videoları da silinecek.`)) return;

    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showMessage('Kullanıcı silindi');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Kullanıcı silinemedi', 'error');
    }
  };

  // video sil
  const handleDeleteVideo = async (videoId, title) => {
    if (!window.confirm(`"${title}" videosunu silmek istediğinize emin misiniz?`)) return;

    try {
      await videoService.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      showMessage('Video silindi');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Video silinemedi', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

        {/* bildirim mesaji */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* sekme gecisleri */}
        <div className="flex gap-1 mb-6 bg-gray-200 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kullanıcılar
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'videos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tüm Videolar
          </button>
        </div>

        {/* kullanici tablosu */}
        {activeTab === 'users' && (
          usersLoading ? (
            <LoadingSpinner text="Kullanıcılar yükleniyor..." />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Video</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kayıt</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            disabled={u._id === user?._id}
                            className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.videoCount || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3">
                          {u._id !== user?._id && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.username)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Sil
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* video tablosu */}
        {activeTab === 'videos' && (
          videosLoading ? (
            <LoadingSpinner text="Videolar yükleniyor..." />
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Başlık</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Yükleyen</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hassasiyet</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Boyut</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {videos.map((v) => (
                        <tr key={v._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                            {v.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {v.uploader?.username || 'Bilinmiyor'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={v.status} type="status" />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={v.sensitivityStatus} type="sensitivity" />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {(v.fileSize / 1024 / 1024).toFixed(1)} MB
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(v.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteVideo(v._id, v.title)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* video sayfalama */}
              {videoPagination && videoPagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setVideoPage((p) => Math.max(1, p - 1))}
                    disabled={videoPage === 1}
                    className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Önceki
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Sayfa {videoPage} / {videoPagination.pages}
                  </span>
                  <button
                    onClick={() => setVideoPage((p) => Math.min(videoPagination.pages, p + 1))}
                    disabled={videoPage === videoPagination.pages}
                    className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
