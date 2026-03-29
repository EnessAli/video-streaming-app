# Video Streaming Platform

Video yükleme, hassasiyet analizi ve streaming işlemlerini gerçekleştiren full-stack web uygulaması.

## Teknolojiler

### Backend
- **Node.js** + **Express.js** - REST API
- **MongoDB** + **Mongoose** - Veritabanı
- **Socket.io** - Gerçek zamanlı bildirimler
- **JWT** - Kimlik doğrulama (access + refresh token)
- **Multer** - Dosya yükleme
- **bcryptjs** - Şifre hashleme

### Frontend
- **React 18** + **Vite** - UI framework
- **Tailwind CSS** - Stil
- **React Router v6** - Yönlendirme
- **Axios** - HTTP istekleri
- **Socket.io Client** - Gerçek zamanlı bağlantı
- **Context API** - State yönetimi

## Özellikler

- Kullanıcı kayıt/giriş sistemi (JWT ile)
- Rol tabanlı erişim kontrolü (viewer, editor, admin)
- Video yükleme (drag & drop, 100MB limit)
- Simüle edilmiş hassasiyet analizi (Socket.io ile gerçek zamanlı ilerleme)
- HTTP Range Request ile video streaming
- Video kütüphanesi (arama, filtreleme, sayfalama)
- Admin paneli (kullanıcı yönetimi, video yönetimi)
- Responsive tasarım

## Kurulum

### Gereksinimler
- Node.js v18+
- MongoDB (yerel veya Atlas)

### Backend

```bash
cd backend
cp .env.example .env
# .env dosyasını düzenleyin (MongoDB URI, JWT secret vb.)
npm install
npm run dev
```

Backend varsayılan olarak `http://localhost:5000` adresinde çalışır.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend varsayılan olarak `http://localhost:5173` adresinde çalışır.

### Ortam Değişkenleri

#### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/video-streaming
JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=104857600
NODE_ENV=development
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kayıt |
| POST | `/api/auth/login` | Giriş |
| POST | `/api/auth/refresh` | Token yenileme |
| POST | `/api/auth/logout` | Çıkış |
| GET | `/api/auth/me` | Mevcut kullanıcı |

### Videos
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/videos/upload` | Video yükle (editor/admin) |
| GET | `/api/videos` | Kullanıcının videoları |
| GET | `/api/videos/all` | Tüm videolar (admin) |
| GET | `/api/videos/:id` | Video detay |
| PUT | `/api/videos/:id` | Video güncelle |
| DELETE | `/api/videos/:id` | Video sil |
| GET | `/api/videos/stream/:id` | Video stream |

### Users (Admin)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/users` | Tüm kullanıcılar |
| GET | `/api/users/:id` | Kullanıcı detay |
| PUT | `/api/users/:id/role` | Rol güncelle |
| DELETE | `/api/users/:id` | Kullanıcı sil |

## Proje Yapısı

```
├── backend/
│   ├── src/
│   │   ├── config/         # Veritabanı, multer, env ayarları
│   │   ├── controllers/    # İstek işleyicileri
│   │   ├── middleware/      # Auth, rol kontrolü, hata yakalama
│   │   ├── models/          # Mongoose modelleri
│   │   ├── routes/          # API rotaları
│   │   ├── services/        # İş mantığı (token, video işleme)
│   │   ├── socket/          # Socket.io yapılandırması
│   │   ├── utils/           # Yardımcı fonksiyonlar
│   │   └── server.js        # Ana giriş noktası
│   └── uploads/videos/      # Yüklenen videolar
├── frontend/
│   ├── src/
│   │   ├── components/      # UI bileşenleri
│   │   ├── context/         # Auth ve Socket context
│   │   ├── hooks/           # Custom hooklar
│   │   ├── pages/           # Sayfa bileşenleri
│   │   ├── services/        # API servisleri
│   │   ├── App.jsx          # Ana uygulama + routing
│   │   └── main.jsx         # Entry point
│   └── public/
└── README.md
```

## Deployment

### Frontend - Vercel
1. Vercel'e GitHub repo bağlayın
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output: `dist`
5. Ortam değişkenlerini ekleyin

### Backend - Render
1. Render'da yeni Web Service oluşturun
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Ortam değişkenlerini ekleyin

### Veritabanı - MongoDB Atlas
1. Atlas'ta ücretsiz M0 cluster oluşturun
2. Connection string'i backend `.env`'ye ekleyin

## Lisans

MIT
