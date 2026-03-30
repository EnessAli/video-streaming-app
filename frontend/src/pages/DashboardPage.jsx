/*
  Dashboard page — user's video library
  Lists videos in a grid, supports filtering and search.
  Live processing status from Socket.io is also visible here
*/
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import videoService from '../services/videoService';
import Navbar from '../components/layout/Navbar';
import VideoCard from '../components/video/VideoCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const { processingStatus } = useSocket();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [sensitivityFilter, setSensitivityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // fetch videos — re-fetch when filters change
  useEffect(() => {
    fetchVideos();
  }, [statusFilter, sensitivityFilter, sortBy, page]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await videoService.getMyVideos({
        status: statusFilter,
        sensitivity: sensitivityFilter,
        search: search || undefined,
        sortBy,
        page,
        limit: 12
      });
      setVideos(data.videos);
      setPagination(data.pagination);
    } catch (err) {
      setError('An error occurred while loading videos');
    } finally {
      setLoading(false);
    }
  };

  // trigger search — on enter or button click
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVideos();
  };

  // quick stats calculation
  const stats = {
    total: pagination?.total || 0,
    processing: videos.filter((v) => v.status === 'processing').length,
    safe: videos.filter((v) => v.sensitivityStatus === 'safe').length,
    flagged: videos.filter((v) => v.sensitivityStatus === 'flagged').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* title and upload button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Welcome, {user?.username}
            </p>
          </div>
          {(user?.role === 'editor' || user?.role === 'admin') && (
            <Link
              to="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              + Upload New Video
            </Link>
          )}
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Videos</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
            <p className="text-sm text-gray-500">Processing</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold text-green-600">{stats.safe}</p>
            <p className="text-sm text-gray-500">Safe</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
            <p className="text-sm text-gray-500">Flagged</p>
          </div>
        </div>

        {/* filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                Search
              </button>
            </form>

            {/* status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="failed">Error</option>
            </select>

            {/* sensitivity filter */}
            <select
              value={sensitivityFilter}
              onChange={(e) => { setSensitivityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Sensitivity</option>
              <option value="safe">Safe</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
            </select>

            {/* sorting */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title (A-Z)</option>
              <option value="size">Size (Largest-Smallest)</option>
            </select>
          </div>
        </div>

        {/* video list */}
        {loading ? (
          <LoadingSpinner text="Loading videos..." />
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📭</p>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
            <p className="text-gray-500 mb-4">Get started by uploading your first video</p>
            {(user?.role === 'editor' || user?.role === 'admin') && (
              <Link
                to="/upload"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
              >
                Upload Video
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  processingInfo={processingStatus[video._id]}
                />
              ))}
            </div>

            {/* pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
