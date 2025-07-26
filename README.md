# Conquerun

Conquerun is a web-based multiplayer strategy game where players compete to conquer and control territories on a virtual map. The game features real-time updates, a leaderboard to track player rankings, and user profiles to view stats and achievements.

## Features

- **User Authentication:** Secure user registration and login system.
- **Interactive Map:** A dynamic map interface where players can view and interact with territories.
- **Territory Conquest:** Players can attack and conquer territories from other players.
- **Real-time Updates:** The game state is updated in real-time for all players.
- **Leaderboard:** A global leaderboard to rank players based on their performance.
- **User Profiles:** Players can view their own and other players' profiles, including stats and achievements.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js
- npm

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/your_username_/Conquerun.git
   ```
2. **Install NPM packages for the backend**
   ```sh
   cd backend
   npm install
   ```
3. **Install NPM packages for the frontend**
   ```sh
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```sh
   cd backend
   npm start
   ```
2. **Start the frontend development server**
   ```sh
   cd ../frontend
   npm start
   ```

## Tech Stack

- **Frontend:** React, TypeScript, Mapbox GL
- **Backend:** Node.js, Express, TypeScript, MongoDB


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
