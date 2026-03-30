/*
  Video yukleme sayfasi
  Drag & drop veya dosya secici ile video yukleme.
  Yukleme ilerlemesi (axios) ve isleme ilerlemesi (Socket.io) gosterilir.
  Maksimum 100MB, sadece video dosyalari kabul edilir
*/
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import videoService from '../services/videoService';
import Navbar from '../components/layout/Navbar';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Genel');
  const [tags, setTags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { processingStatus } = useSocket();

  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES = ['video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime', 'video/webm', 'video/x-matroska'];

  // dosya secildiginde veya birakildiginda kontrol et
  const handleFileSelect = (selectedFile) => {
    setError('');

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Desteklenmeyen dosya tipi. MP4, AVI, MOV, MKV veya WebM yükleyebilirsiniz.');
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError(`Dosya boyutu çok büyük. Maksimum ${MAX_SIZE / 1024 / 1024}MB yüklenebilir.`);
      return;
    }

    setFile(selectedFile);
    // dosya adindan baslik onerisi
    if (!title) {
      const name = selectedFile.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Lütfen bir video dosyası seçin');
      return;
    }
    if (!title.trim()) {
      setError('Video başlığı zorunludur');
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('tags', tags);

    try {
      const data = await videoService.upload(formData, (percent) => {
        setUploadProgress(percent);
      });

      setUploadedVideoId(data.video._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Yükleme sırasında bir hata oluştu');
      setUploading(false);
    }
  };

  // upload + isleme tamamlandiysa
  const processingInfo = uploadedVideoId ? processingStatus[uploadedVideoId] : null;
  const isProcessing = processingInfo?.status === 'processing';
  const isReady = processingInfo?.status === 'ready';
  const isFailed = processingInfo?.status === 'failed';

  // dosya boyutunu okunabilir formata cevir
  const formatSize = (bytes) => {
    if (!bytes) return '';
    const mb = (bytes / 1024 / 1024).toFixed(1);
    return `${mb} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Video Yükle</h1>

        {/* yukleme ve isleme tamamlandiysa sonuc goster */}
        {isReady && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-1">
              ✓ Video başarıyla işlendi!
            </h3>
            <p className="text-sm text-green-700 mb-3">
              Hassasiyet durumu:{' '}
              <span className={`font-medium ${processingInfo.sensitivityStatus === 'safe' ? 'text-green-700' : 'text-red-700'}`}>
                {processingInfo.sensitivityStatus === 'safe' ? '✓ Güvenli' : '⚠ İşaretli'}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/video/${uploadedVideoId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Videoyu İzle
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setTitle('');
                  setDescription('');
                  setUploadProgress(0);
                  setUploadedVideoId(null);
                  setUploading(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
              >
                Yeni Video Yükle
              </button>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800">✕ İşleme sırasında hata oluştu</h3>
            <button
              onClick={() => {
                setUploadedVideoId(null);
                setUploading(false);
                setUploadProgress(0);
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* yukleme formu — sadece yukleme baslamadiysa goster */}
        {!uploadedVideoId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* drag & drop alani */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${file ? 'bg-green-50 border-green-300' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
              />
              {file ? (
                <div>
                  <p className="text-green-700 font-medium">📁 {file.name}</p>
                  <p className="text-sm text-green-600 mt-1">{formatSize(file.size)}</p>
                  <p className="text-xs text-gray-500 mt-2">Değiştirmek için tıklayın</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl mb-3">📤</p>
                  <p className="text-gray-700 font-medium">Video dosyasını sürükleyip bırakın</p>
                  <p className="text-sm text-gray-500 mt-1">veya tıklayarak seçin</p>
                  <p className="text-xs text-gray-400 mt-3">
                    MP4, AVI, MOV, MKV, WebM • Maksimum 100MB
                  </p>
                </div>
              )}
            </div>

            {/* baslik */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Video başlığını girin"
              />
            </div>

            {/* aciklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Video hakkında kısa açıklama"
              />
            </div>

            {/* kategori ve etiketler */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Genel">Genel</option>
                  <option value="Eğitim">Eğitim</option>
                  <option value="Eğlence">Eğlence</option>
                  <option value="Müzik">Müzik</option>
                  <option value="Spor">Spor</option>
                  <option value="Teknoloji">Teknoloji</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="etiket1, etiket2, etiket3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </button>
          </form>
        )}

        {/* ilerleme cubugu — yukleme veya isleme sirasinda */}
        {uploading && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-medium text-gray-900 mb-4">
              {uploadedVideoId ? 'İşleme Durumu' : 'Yükleme Durumu'}
            </h3>

            {/* upload progress */}
            {!uploadedVideoId && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Sunucuya yükleniyor...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* processing progress — socket.io'dan gelen veri */}
            {processingInfo && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{processingInfo.step || 'İşleniyor...'}</span>
                  <span>{processingInfo.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${processingInfo.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
