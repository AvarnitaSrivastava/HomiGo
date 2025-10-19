# HomiGo - Student Roommate Matching Platform

A full-stack web application that helps students find compatible roommates and hostel accommodations.

## 🚀 Features

- **User Authentication** - Secure JWT-based login/registration for students and hostel owners
- **Smart Matching System** - AI-powered compatibility scoring based on preferences, lifestyle, and budget
- **Connection Requests** - Send, accept, or reject roommate connection requests
- **Real-time Messaging** - Socket.IO powered instant messaging between connected users
- **Hostel Listings** - Browse and manage hostel/accommodation listings
- **User Profiles** - Detailed profiles with preferences, interests, and lifestyle information
- **Responsive Design** - Mobile-friendly interface

## 📁 Project Structure

```
Delete_HomiGo/
├── backEnd/              # Express.js Backend API
│   ├── models/          # MongoDB models
│   ├── controller/      # Request handlers
│   ├── routes/          # API routes
│   ├── middlewares/     # Authentication & validation
│   ├── config/          # Database & Socket.IO config
│   └── utils/           # Helper functions
├── frontend/            # React Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API & state management
│   │   └── styles/     # CSS files
│   └── public/         # Static assets
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time messaging
- **JWT** - Authentication
- **Cloudinary** - Image uploads

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Zustand** - State management (chat)
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backEnd
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

4. Start backend server:
```bash
npm start
```

Backend runs on: `http://localhost:5001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend runs on: `http://localhost:3000`

## 🔑 Environment Variables

### Backend (.env)
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/homigo
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📖 API Documentation

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile

### Connections
- `POST /api/connections/send` - Send connection request
- `POST /api/connections/accept/:id` - Accept request
- `POST /api/connections/reject/:id` - Reject request
- `GET /api/connections/pending` - Get pending requests
- `GET /api/connections/sent` - Get sent requests
- `GET /api/connections` - Get all connections

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:userId` - Get specific conversation
- `POST /api/messages/send` - Send message (via Socket.IO)

### Listings
- `GET /api/listing` - Get all listings
- `POST /api/listing` - Create listing (owner only)
- `PUT /api/listing/:id` - Update listing
- `DELETE /api/listing/:id` - Delete listing

## 🎯 Key Features Explained

### Matching Algorithm
The system calculates compatibility scores based on:
- Budget preferences (40% weight)
- Location preferences (30% weight)
- Lifestyle habits (20% weight)
- Shared interests (10% weight)

### Connection System
1. User browses matches sorted by compatibility
2. User sends connection request (with optional message)
3. Recipient sees request in "Pending Requests" section
4. On acceptance, both users become "connected"
5. Connected users can message each other
6. All connected users appear in the messaging sidebar

### Real-time Messaging
- Socket.IO establishes persistent connection
- Typing indicators show when other user is typing
- Online status shows who's currently active
- Unread message counts update in real-time

## 🚦 Running the Application

1. **Start MongoDB** (if using local)
```bash
mongod
```

2. **Start Backend** (Terminal 1)
```bash
cd backEnd
npm start
```

3. **Start Frontend** (Terminal 2)
```bash
cd frontend
npm start
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## 👥 User Roles

### Student
- Create profile with preferences
- Browse compatible roommates
- Send/receive connection requests
- Message connected users
- View hostel listings

### Owner
- Create hostel listings
- Manage listing details
- View booking requests
- Update availability

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists with correct values
- Check port 5001 is not in use

### Frontend won't connect to backend
- Verify backend is running on port 5001
- Check API URLs in `frontend/src/services/api.js`
- Check CORS settings in `backEnd/app.js`

### Messages not working
- Ensure Socket.IO server is running
- Check browser console for connection errors
- Verify JWT token is present in localStorage

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Utkarsh Raj

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Made with ❤️ for students finding their perfect roommate
