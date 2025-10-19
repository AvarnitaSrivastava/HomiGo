# Messaging System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Messages.jsx  │  │ MessageButton│  │  Other Components  │  │
│  │   (UI Layer)   │  │  Component   │  │  (Matches, etc)    │  │
│  └────────┬───────┘  └──────┬───────┘  └─────────┬──────────┘  │
│           │                  │                     │              │
│           └──────────────────┴─────────────────────┘              │
│                              │                                    │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │              useChatStore (Zustand)                        │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  State: conversations, messages, currentConversation│  │  │
│  │  │  Actions: sendMessage, fetchConversations, etc      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └────────────────────┬──────────────────┬────────────────────┘  │
│                       │                  │                        │
│            ┌──────────▼────────┐  ┌─────▼──────────┐            │
│            │  Socket.IO Client │  │ messageService │            │
│            │   (Real-time)     │  │  (REST API)    │            │
│            └──────────┬────────┘  └─────┬──────────┘            │
│                       │                  │                        │
└───────────────────────┼──────────────────┼────────────────────────┘
                        │                  │
                        │ WebSocket        │ HTTP
                        │                  │
┌───────────────────────▼──────────────────▼────────────────────────┐
│                      SERVER (Node.js + Express)                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Socket.IO Server                          │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  Events:                                               │ │ │
│  │  │  • connection / disconnect                            │ │ │
│  │  │  • sendMessage → broadcast to receiver               │ │ │
│  │  │  • typing → notify receiver                          │ │ │
│  │  │  • markAsRead → update & notify sender              │ │ │
│  │  │  • userOnline / userOffline → broadcast to all      │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  Active Users Map: userId → socketId                        │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                         │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │                 Message Routes (/api/messages)               │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  POST   /send                                          │ │ │
│  │  │  GET    /conversation/:userId                          │ │ │
│  │  │  GET    /conversations                                 │ │ │
│  │  │  PATCH  /read/:conversationId                          │ │ │
│  │  │  GET    /unread-count                                  │ │ │
│  │  │  DELETE /:messageId                                    │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                         │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │                  Message Controller                          │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  • sendMessage()                                       │ │ │
│  │  │  • getConversation()                                   │ │ │
│  │  │  • getAllConversations()                               │ │ │
│  │  │  • markAsRead()                                        │ │ │
│  │  │  • getUnreadCount()                                    │ │ │
│  │  │  • deleteMessage()                                     │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                         │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │                    Message Model                             │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  Fields: conversationId, sender, receiver, text,      │ │ │
│  │  │          read, readAt, createdAt, updatedAt           │ │ │
│  │  │  Methods: generateConversationId()                    │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                         │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
                           │ Mongoose ODM
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                         MongoDB Database                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  messages Collection                                         │ │
│  │  {                                                           │ │
│  │    _id: ObjectId,                                            │ │
│  │    conversationId: "userId1-userId2",                        │ │
│  │    sender: ObjectId (ref: User),                             │ │
│  │    receiver: ObjectId (ref: User),                           │ │
│  │    text: String,                                             │ │
│  │    read: Boolean,                                            │ │
│  │    readAt: Date,                                             │ │
│  │    createdAt: Date,                                          │ │
│  │    updatedAt: Date                                           │ │
│  │  }                                                           │ │
│  │                                                              │ │
│  │  Indexes:                                                    │ │
│  │  • conversationId + createdAt (for efficient queries)       │ │
│  │  • sender + receiver (for conversation lookup)              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Sending a Message

```
User A (Browser)                                     User B (Browser)
     │                                                     │
     │ 1. Types message & clicks send                      │
     ├──────────────────────────────┐                      │
     │  useChatStore.sendMessage()  │                      │
     └──────────────────────────────┘                      │
     │                                                     │
     │ 2. Emit via Socket.IO                               │
     │ socket.emit('sendMessage', data)                    │
     │                                                     │
     ▼                                                     │
┌─────────────────────────────────────┐                    │
│      Socket.IO Server               │                    │
│  • Receives 'sendMessage' event     │                    │
│  • Validates sender                 │                    │
│  • Saves to MongoDB                 │                    │
│  • Gets receiver's socketId         │                    │
└─────────────────────────────────────┘                    │
     │                                                     │
     │ 3. Broadcast to receiver                            │
     │ io.to(receiverSocketId)                             │
     │   .emit('receiveMessage', message)                  │
     │                                                     ▼
     │                                          ┌────────────────────┐
     │ 4. Send confirmation                     │ Socket receives    │
     │ socket.emit('messageSent', message)      │ 'receiveMessage'   │
     │                                          └────────────────────┘
     ▼                                                     │
┌────────────────────────────┐                             │
│ Message appears in chat    │                             │
│ Shows checkmark ✓          │                             │
└────────────────────────────┘                             │
                                              ┌────────────▼───────────┐
                                              │ Message appears in chat│
                                              │ Unread badge updates   │
                                              └────────────────────────┘
```

### 2. Reading Messages

```
User B                                                    User A
     │                                                     │
     │ 1. Opens conversation                               │
     │                                                     │
     ▼                                                     │
┌────────────────────────────┐                             │
│ fetchConversation()        │                             │
│ • GET /api/messages/       │                             │
│   conversation/:userId     │                             │
└────────────────────────────┘                             │
     │                                                     │
     │ 2. Auto mark as read                                │
     │ socket.emit('markAsRead')                           │
     │                                                     │
     ▼                                                     │
┌─────────────────────────────────────┐                    │
│      Socket.IO Server               │                    │
│  • Updates read status in MongoDB   │                    │
│  • Gets sender's socketId           │                    │
└─────────────────────────────────────┘                    │
     │                                                     │
     │ 3. Notify sender                                    │
     │ io.to(senderSocketId)                               │
     │   .emit('messagesRead', {conversationId})           │
     │                                                     ▼
     │                                          ┌────────────────────┐
     │                                          │ Checkmark updates  │
     │                                          │ ✓ → ✓✓             │
     │                                          └────────────────────┘
     ▼
┌────────────────────────────┐
│ Unread badge disappears    │
└────────────────────────────┘
```

### 3. Typing Indicator

```
User A                                                    User B
     │                                                      │
     │ 1. Starts typing                                    │
     │                                                      │
     ▼                                                      │
┌────────────────────────────┐                             │
│ onChange handler           │                             │
│ • Sets timeout (1s)        │                             │
│ • Emits typing indicator   │                             │
│ socket.emit('typing', {    │                             │
│   receiverId,              │                             │
│   isTyping: true           │                             │
│ })                         │                             │
└────────────────────────────┘                             │
     │                                                      │
     ▼                                                      │
┌─────────────────────────────────────┐                    │
│      Socket.IO Server               │                    │
│  • Gets receiver's socketId         │                    │
│  • Forwards typing event            │                    │
└─────────────────────────────────────┘                    │
     │                                                      │
     │ io.to(receiverSocketId)                             │
     │   .emit('userTyping', {userId, isTyping})           │
     │                                                      ▼
     │                                          ┌────────────────────┐
     │                                          │ Status shows       │
     │                                          │ "Typing..."        │
     │                                          └────────────────────┘
     │ 2. Stops typing (timeout)               │
     │                                                      │
     ▼                                                      │
┌────────────────────────────┐                             │
│ Timeout expires            │                             │
│ socket.emit('typing', {    │                             │
│   receiverId,              │                             │
│   isTyping: false          │                             │
│ })                         │                             │
└────────────────────────────┘                             │
     │                                                      │
     │                                                      ▼
     │                                          ┌────────────────────┐
     │                                          │ Status shows       │
     │                                          │ "Online"           │
     │                                          └────────────────────┘
```

### 4. Online/Offline Status

```
User Connects                                All Other Connected Users
     │                                                      │
     │ 1. Socket connects with JWT                         │
     │                                                      │
     ▼                                                      │
┌─────────────────────────────────────┐                    │
│      Socket.IO Server               │                    │
│  • Validates JWT                    │                    │
│  • Adds to activeUsers Map          │                    │
│  • userId → socketId                │                    │
└─────────────────────────────────────┘                    │
     │                                                      │
     │ 2. Broadcast online status                          │
     │ io.emit('userOnline', userId)                       │
     │                                                      ▼
     │                                          ┌────────────────────┐
     │                                          │ Green indicator    │
     │                                          │ appears for user   │
     │                                          └────────────────────┘
     │ 3. Send active users list               │
     │ socket.emit('activeUsers', [...])       │
     │                                                      │
     ▼                                                      │
┌────────────────────────────┐                             │
│ Receives list of online    │                             │
│ users, updates UI          │                             │
└────────────────────────────┘                             │
                                                            │
User Disconnects                                           │
     │                                                      │
     ▼                                                      │
┌─────────────────────────────────────┐                    │
│      Socket.IO Server               │                    │
│  • Removes from activeUsers Map     │                    │
└─────────────────────────────────────┘                    │
     │                                                      │
     │ io.emit('userOffline', userId)                      │
     │                                                      ▼
     │                                          ┌────────────────────┐
     │                                          │ Green indicator    │
     │                                          │ disappears         │
     │                                          └────────────────────┘
```

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Components                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  Dashboard   │      │   Matches    │      │   Profile    │ │
│  │              │      │              │      │              │ │
│  │ [Message     │      │ [Message     │      │ [Message     │ │
│  │  Button]     │      │  Button]     │      │  Button]     │ │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘ │
│         │                     │                     │          │
│         └─────────────────────┼─────────────────────┘          │
│                               │                                 │
│                    On Click: Navigate to                        │
│                               │                                 │
│                               ▼                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Messages Page                             │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Contacts List    │  │  Chat Window             │   │   │
│  │  │                  │  │  ┌────────────────────┐  │   │   │
│  │  │ • Search         │  │  │ Chat Header        │  │   │   │
│  │  │ • Conversations  │  │  │ • User info        │  │   │   │
│  │  │ • Unread badges  │  │  │ • Online status    │  │   │   │
│  │  │ • Last message   │  │  └────────────────────┘  │   │   │
│  │  │                  │  │  ┌────────────────────┐  │   │   │
│  │  │                  │  │  │ Messages Container │  │   │   │
│  │  │                  │  │  │ • Sent messages    │  │   │   │
│  │  │                  │  │  │ • Received msgs    │  │   │   │
│  │  │                  │  │  │ • Timestamps       │  │   │   │
│  │  │                  │  │  │ • Read receipts    │  │   │   │
│  │  │                  │  │  └────────────────────┘  │   │   │
│  │  │                  │  │  ┌────────────────────┐  │   │   │
│  │  │                  │  │  │ Message Input      │  │   │   │
│  │  │                  │  │  │ • Text field       │  │   │   │
│  │  │                  │  │  │ • Send button      │  │   │   │
│  │  │                  │  │  └────────────────────┘  │   │   │
│  │  └──────────────────┘  └──────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────┘   │
│                               │                                 │
│                    Uses useChatStore                            │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              Socket.IO                 REST API
              WebSocket                   HTTP
```

## Security Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Measures                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Authentication                                               │
│     • JWT tokens for REST API (Authorization header)            │
│     • JWT tokens for Socket.IO (auth.token)                     │
│     • Token validation on every request                         │
│                                                                  │
│  2. Authorization                                                │
│     • Users can only access their own conversations             │
│     • Users can only delete their own messages                  │
│     • Sender/receiver validation on all operations              │
│                                                                  │
│  3. CORS Protection                                              │
│     • Whitelist of allowed origins                              │
│     • Credentials allowed only for trusted origins              │
│     • Socket.IO CORS configuration                              │
│                                                                  │
│  4. Input Validation                                             │
│     • Required field validation                                 │
│     • User existence checks                                     │
│     • Message text sanitization                                 │
│                                                                  │
│  5. Rate Limiting (Future Enhancement)                           │
│     • Limit messages per minute per user                        │
│     • Prevent spam and abuse                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

```
Frontend:
├── React 18.2.0
├── Zustand (State Management)
├── Socket.IO Client 4.6.0
├── Axios (HTTP Client)
└── React Router DOM 6.8.0

Backend:
├── Node.js
├── Express.js 4.21.2
├── Socket.IO (Server)
├── MongoDB + Mongoose 7.5.3
├── JWT (jsonwebtoken 9.0.2)
└── bcryptjs 2.4.3

Infrastructure:
├── MongoDB (Database)
├── WebSocket (Real-time communication)
└── HTTP/HTTPS (REST API)
```

## File Structure

```
backEnd/
├── models/
│   └── message.model.js          # Message schema
├── controller/
│   └── message.controller.js     # Message business logic
├── routes/
│   └── messages.js                # Message API routes
├── config/
│   └── socket.js                  # Socket.IO configuration
├── bin/
│   └── www                        # Server initialization
└── app.js                         # Express app setup

frontend/
├── src/
│   ├── services/
│   │   ├── useChatStore.js       # Zustand store + Socket.IO
│   │   └── messageService.js     # API service
│   ├── components/
│   │   └── MessageButton.jsx     # Reusable message button
│   └── pages/
│       ├── Messages.jsx           # Messages page
│       └── Messages.css           # Styling
```

This architecture provides a scalable, real-time messaging system with proper separation of concerns and security measures.
