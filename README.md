# Conquerun

Conquerun is a location-based territory claiming game built with React, TypeScript, Node.js, Express, and MongoDB. Players move in the real world to claim virtual territories, compete on leaderboards, and unlock achievements.

## Features
- Real-time geolocation tracking
- Territory claiming and visualization
- User authentication (JWT-based)
- Leaderboards and achievements
- Responsive UI for mobile and desktop
- RESTful backend API (Express + MongoDB)

## Project Structure
```
Conquerun/
├── backend/        # Express + MongoDB backend
│   ├── src/
│   ├── package.json
│   └── ...
├── frontend/        # React + TypeScript frontend
│   ├── src/
│   ├── package.json
│   └── ...
├── README.md
└── ...
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm
- MongoDB (local or Atlas)

### Backend Setup
```sh
cd backend
cp .env.example .env  # Add your MONGO_URI and JWT_SECRET
npm install
npm run dev
```

### Frontend Setup
```sh
cd project
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to play!

## API Overview
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Get current user profile (JWT required)
- `GET /api/territories` — List all territories
- `POST /api/territories` — Claim a territory (JWT required)
- `GET /api/leaderboard` — Get leaderboard

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
