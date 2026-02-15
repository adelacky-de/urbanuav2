# Urban-UAV-Corridors-client

## Installation and Startup

```bash
git clone https://github.com/whlan02/Urban-UAV-Corridors_client.git

```

```bash
cd Urban-UAV-Corridors-client

```

```bash
npm install
```

```bash
npm run dev
```

Open the Vite output URL in your browser. **Make sure to start the backend first** (default: `http://localhost:8000`). See the [postgisWithFastAPI](https://github.com/whlan02/postgisWithFastAPI).

## Backend API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /2d-corridors` | 2D corridor priority GeoJSON |
| `GET /3d-network` | 3D corridor grid GeoJSON |
| `GET /3dtiles/tileset.json` | 3D Tiles |
| `GET /health` | Health check |
