# Roommate Finder System

A MERN-based web application that helps students find compatible roommates and shared accommodation.

## Features

- **Dashboard**: Centralized view of matches, listings, profile, and messages
- **Profile Management**: Complete user profile with preferences and interests
- **Matching System**: Compatibility-based roommate suggestions
- **Room Listings**: Browse and search available rooms
- **Chat System**: Secure communication between potential roommates
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Navigation bar
│   ├── Footer.jsx      # Footer component
│   ├── MatchCard.jsx   # Roommate match card
│   ├── RoomCard.jsx    # Room listing card
│   └── ChatBox.jsx     # Chat interface
├── pages/              # Main application pages
│   ├── Dashboard.jsx   # Main dashboard
│   └── Profile.jsx     # User profile page
├── services/           # API service files
│   ├── authService.js  # Authentication API calls
│   ├── userService.js  # User profile API calls
│   ├── matchService.js # Matching system API calls
│   └── roomService.js  # Room listings API calls
├── styles/             # CSS styles
│   └── global.css      # Global styles
└── App.jsx             # Main application component
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Technologies Used

- **React** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.IO** - Real-time communication
- **CSS3** - Styling (no external CSS frameworks)

## Dashboard Features

The dashboard includes four main sections:

1. **Matches**: View potential roommate matches with compatibility scores
2. **Listings**: Browse available rooms and accommodations
3. **Profile**: Quick view and edit of user profile
4. **Messages**: Chat with potential roommates

## Profile Management

The profile page allows users to:
- Update personal information
- Set living preferences
- Manage interests and lifestyle
- Upload profile pictures
- View profile statistics

## API Integration

The application is designed to work with a backend API. Service files are included for:
- User authentication
- Profile management
- Matching algorithms
- Room listings
- Messaging system

## Contributing

This project is part of a larger MERN application. The dashboard and profile components are complete and ready for integration with the backend API.

## License

This project is licensed under the MIT License.
