/*
  Video playback page
  HTML5 video player with streaming, video details and management buttons.
  Includes a modal form for editing video information
*/
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import videoService from '../services/videoService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function VideoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { processingStatus } = useSocket();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', tags: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const data = await videoService.getVideo(id);
      setVideo(data.video);
      setEditForm({
        title: data.video.title,
        description: data.video.description || '',
        category: data.video.category || 'General',
        tags: data.video.tags?.join(', ') || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  // update video
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const data = await videoService.updateVideo(id, editForm);
      setVideo(data.video);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  // delete video
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    setDeleting(true);
    try {
      await videoService.deleteVideo(id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
      setDeleting(false);
    }
  };

  // streaming URL
  const streamUrl = videoService.getStreamUrl(id);

  // file size
  const fileSize = video?.fileSize
    ? `${(video.fileSize / 1024 / 1024).toFixed(1)} MB`
    : '';

  // live status from socket
  const liveStatus = processingStatus[id];
  const currentStatus = liveStatus?.status || video?.status;

  if (loading) {
    return (
      <div>
        <LoadingSpinner text="Loading video..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* back button */}
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Go to Dashboard
        </button>

        {/* video player */}
        <div className="bg-black rounded-lg overflow-hidden mb-6">
          {currentStatus === 'ready' ? (
            <video
              controls
              className="w-full max-h-[500px]"
              src={streamUrl}
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          ) : currentStatus === 'processing' ? (
            <div className="flex flex-col items-center justify-center h-64 text-white">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
              <p>Video is being processed...</p>
              {liveStatus && (
                <div className="w-64 mt-3">
                  <p className="text-sm text-gray-400 mb-1">{liveStatus.step}</p>
                  <div className="bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${liveStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Video is not ready</p>
            </div>
          )}
        </div>

        {/* video info and actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {editing ? (
            /* edit form */
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Technology">Technology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="tag1, tag2"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Save
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* normal view */
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900 mb-2">{video.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge status={video.status} type="status" />
                    <StatusBadge status={video.sensitivityStatus} type="sensitivity" />
                    {video.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{video.category}</span>
                    )}
                  </div>
                  {video.description && (
                    <p className="text-gray-600 text-sm mb-3">{video.description}</p>
                  )}
                </div>

                {/* action buttons — owner or admin only */}
                {(user?.role === 'admin' || user?._id === video.uploader?._id || user?._id === video.uploader) && (
                  <div className="flex gap-2">
                    {user?.role !== 'viewer' && (
                      <button
                        onClick={() => setEditing(true)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>

              {/* meta info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">File Size</p>
                  <p className="text-sm font-medium text-gray-900">{fileSize}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Upload Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(video.createdAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Views</p>
                  <p className="text-sm font-medium text-gray-900">{video.views}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">File Type</p>
                  <p className="text-sm font-medium text-gray-900">{video.mimeType}</p>
                </div>
              </div>

              {/* tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {video.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
