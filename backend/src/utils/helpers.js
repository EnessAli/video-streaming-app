/*
  Yardimci fonksiyonlar
  Dosya boyutunu okunabilir formata cevirme vb. kucuk isler
*/

// byte degerini okunabilir string'e cevir (2.4 MB, 150 KB gibi)
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// saniye degerini dakika:saniye formatina cevir
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = { formatFileSize, formatDuration };
