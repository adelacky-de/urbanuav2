# Urban-UAV-Corridors-client

## Installation and Startup

```bash
git clone https://github.com/adelacky-de/urbanuav2.git
```

```bash
cd urbanuav2
```

```bash
npm install
```

```bash
npm run dev
```

Open the Vite output URL in your browser. **Make sure to start the backend first** (Railway Deployment: `https://brave-youthfulness-production-5dcd.up.railway.app` or locally on `:8000`). See the [urban-uav-backend](https://github.com/adelacky-de/urban-uav-backend) for the server setup.

## Backend API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API Status Message |
| `GET /health` | Health check |
| `GET /2d-corridors` | 2D corridor priority GeoJSON |
| `GET /3d-network` | 3D corridor grid GeoJSON |
| `GET /hdb-footprints` | HDB footprints GeoJSON |
