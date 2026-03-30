/*
  Status badge — shows video status with color coding
  safe: green, flagged: red, processing: yellow, pending: gray, failed: red
*/
export default function StatusBadge({ status, type = 'status' }) {
  const configs = {
    // video processing status
    uploading: { label: 'Uploading', color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700' },
    ready: { label: 'Ready', color: 'bg-green-100 text-green-700' },
    failed: { label: 'Error', color: 'bg-red-100 text-red-700' },
    // sensitivity status
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
    safe: { label: 'Safe', color: 'bg-green-100 text-green-700' },
    flagged: { label: 'Flagged', color: 'bg-red-100 text-red-700' }
  };

  const config = configs[status] || { label: status, color: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {type === 'sensitivity' && status === 'safe' && '✓ '}
      {type === 'sensitivity' && status === 'flagged' && '⚠ '}
      {config.label}
    </span>
  );
}
