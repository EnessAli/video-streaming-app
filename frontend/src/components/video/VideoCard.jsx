/*
  Video card — displayed in a grid on the dashboard
  Includes title, status badges, file size and date info.
  Navigates to video detail page on click
*/
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function VideoCard({ video, processingInfo }) {
  // show file size in MB
  const fileSize = video.fileSize
    ? `${(video.fileSize / 1024 / 1024).toFixed(1)} MB`
    : '';

  // format date
  const uploadDate = new Date(video.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // if video is still processing and socket sends progress, show it
  const currentStatus = processingInfo?.status || video.status;
  const currentSensitivity = processingInfo?.sensitivityStatus || video.sensitivityStatus;
  const progress = processingInfo?.progress || video.processingProgress;

  return (
    <Link
      to={`/video/${video._id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* video preview area — placeholder instead of real thumbnail */}
      <div className="bg-gray-800 h-40 flex items-center justify-center relative">
        <span className="text-4xl">🎬</span>

        {/* show progress bar during processing */}
        {currentStatus === 'processing' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                <div
                  className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-white">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* card content section */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-2">{video.title}</h3>

        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={currentStatus} type="status" />
          {currentSensitivity !== 'pending' && (
            <StatusBadge status={currentSensitivity} type="sensitivity" />
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>{fileSize}</span>
          <span>{uploadDate}</span>
        </div>

        {video.category && video.category !== 'General' && (
          <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {video.category}
          </span>
        )}
      </div>
    </Link>
  );
}
