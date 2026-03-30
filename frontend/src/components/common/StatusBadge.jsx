/*
  Durum rozeti — video durumunu renk koduyla gosterir
  safe: yesil, flagged: kirmizi, processing: sari, pending: gri, failed: kirmizi
*/
export default function StatusBadge({ status, type = 'status' }) {
  const configs = {
    // video isleme durumu
    uploading: { label: 'Yükleniyor', color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'İşleniyor', color: 'bg-yellow-100 text-yellow-700' },
    ready: { label: 'Hazır', color: 'bg-green-100 text-green-700' },
    failed: { label: 'Hata', color: 'bg-red-100 text-red-700' },
    // hassasiyet durumu
    pending: { label: 'Bekliyor', color: 'bg-gray-100 text-gray-700' },
    safe: { label: 'Güvenli', color: 'bg-green-100 text-green-700' },
    flagged: { label: 'İşaretli', color: 'bg-red-100 text-red-700' }
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
