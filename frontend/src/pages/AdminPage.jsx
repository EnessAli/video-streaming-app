/*
  Admin panel — accessible only to users with admin role
  Two tabs: user management and all videos list.
  Role change, user deletion and video deletion operations here
*/
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import adminService from '../services/adminService';
import videoService from '../services/videoService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // user states
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // video states
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videoPagination, setVideoPagination] = useState(null);
  const [videoPage, setVideoPage] = useState(1);

  const [message, setMessage] = useState({ text: '', type: '' });

  // fetch users
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
      showMessage('Failed to load users', 'error');
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
      showMessage('Failed to load videos', 'error');
    } finally {
      setVideosLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // change role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      showMessage('Role updated');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  // delete user
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}? All their videos will also be deleted.`)) return;

    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showMessage('User deleted');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  // delete video
  const handleDeleteVideo = async (videoId, title) => {
    if (!window.confirm(`Are you sure you want to delete the video "${title}"?`)) return;

    try {
      await videoService.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      showMessage('Video deleted');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to delete video', 'error');
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

        {/* notification message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* tab switches */}
        <div className="flex gap-1 mb-6 bg-gray-200 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'videos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Videos
          </button>
        </div>

        {/* user table */}
        {activeTab === 'users' && (
          usersLoading ? (
            <LoadingSpinner text="Loading users..." />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Videos</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Registered</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                          {new Date(u.createdAt).toLocaleDateString('en-US')}
                        </td>
                        <td className="px-4 py-3">
                          {u._id !== user?._id && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.username)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Delete
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

        {/* video table */}
        {activeTab === 'videos' && (
          videosLoading ? (
            <LoadingSpinner text="Loading videos..." />
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Uploader</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sensitivity</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {videos.map((v) => (
                        <tr key={v._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                            {v.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {v.uploader?.username || 'Unknown'}
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
                            {new Date(v.createdAt).toLocaleDateString('en-US')}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteVideo(v._id, v.title)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* video pagination */}
              {videoPagination && videoPagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setVideoPage((p) => Math.max(1, p - 1))}
                    disabled={videoPage === 1}
                    className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {videoPage} / {videoPagination.pages}
                  </span>
                  <button
                    onClick={() => setVideoPage((p) => Math.min(videoPagination.pages, p + 1))}
                    disabled={videoPage === videoPagination.pages}
                    className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
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
