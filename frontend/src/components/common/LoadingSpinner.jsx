/*
  Loading spinner — shown while data is being fetched
*/
export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`}></div>
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );
}
