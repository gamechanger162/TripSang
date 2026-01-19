# 💬 Direct Messaging Feature - Implementation Plan

## 📋 Overview

This document outlines the complete implementation plan for adding **one-on-one private messaging** to TripSang, alongside the existing squad chat functionality.

---

## 🎯 Feature Goals

1. **Private Conversations**: Users can send direct messages to each other
2. **Real-time Messaging**: Messages appear instantly via Socket.io
3. **Message Persistence**: All messages saved to database with full history
4. **Conversation Management**: Users can view all their conversations in one inbox
5. **Unread Indicators**: Show unread message counts
6. **User Discovery**: Easy access to message users from profiles/trip pages

---

## 🗄️ Database Schema

### 1. **Conversation Model**
```javascript
// server/models/Conversation.js
{
  participants: [
    { type: ObjectId, ref: 'User' }  // Exactly 2 users
  ],
  lastMessage: {
    text: String,
    sender: { type: ObjectId, ref: 'User' },
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number  // Map of userId -> unreadCount
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
participants (ascending, unique for pairs)
'participants.0': 1, 'participants.1': 1
```

### 2. **DirectMessage Model**
```javascript
// server/models/DirectMessage.js
{
  conversationId: { type: ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: ObjectId, ref: 'User', required: true },
  receiver: { type: ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now, index: true },
  createdAt: Date
}

// Indexes
conversationId + timestamp (for efficient history queries)
```

---

## 🔧 Backend Implementation

### **Phase 1: Database Models**

#### Step 1.1: Create Conversation Model
- File: `server/models/Conversation.js`
- Features:
  - Validate exactly 2 participants
  - Helper method: `getOtherParticipant(userId)`
  - Helper method: `markAsRead(userId)`
  - Helper method: `incrementUnread(userId)`

#### Step 1.2: Create DirectMessage Model
- File: `server/models/DirectMessage.js`
- Simple schema for message storage

#### Step 1.3: Update Model Index
- Update `server/models/index.js` to export new models

---

### **Phase 2: API Endpoints**

#### Step 2.1: Conversation Controller
File: `server/controllers/messageController.js`

##### **GET /api/messages/conversations**
- Description: Get all conversations for logged-in user
- Auth: Required
- Response:
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "...",
      "otherUser": {
        "_id": "...",
        "name": "John Doe",
        "profilePicture": "...",
        "isOnline": false
      },
      "lastMessage": {
        "text": "See you tomorrow!",
        "timestamp": "2026-01-19T10:30:00.000Z",
        "isOwnMessage": false
      },
      "unreadCount": 3,
      "updatedAt": "2026-01-19T10:30:00.000Z"
    }
  ]
}
```

##### **GET /api/messages/conversation/:userId**
- Description: Get or create conversation with specific user
- Auth: Required
- Response:
```json
{
  "success": true,
  "conversation": { /* conversation object */ },
  "messages": [ /* array of messages */ ],
  "otherUser": { /* user details */ }
}
```

##### **GET /api/messages/:conversationId/history**
- Description: Get message history for conversation
- Auth: Required
- Query Params: `page`, `limit` (pagination)
- Response:
```json
{
  "success": true,
  "messages": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalMessages": 100
  }
}
```

##### **POST /api/messages/mark-read**
- Description: Mark conversation as read
- Auth: Required
- Body: `{ conversationId }`

#### Step 2.2: Create Routes
File: `server/routes/messages.js`

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getConversations,
  getOrCreateConversation,
  getMessageHistory,
  markConversationAsRead
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations', authenticate, getConversations);
router.get('/conversation/:userId', authenticate, getOrCreateConversation);
router.get('/:conversationId/history', authenticate, getMessageHistory);
router.post('/mark-read', authenticate, markConversationAsRead);

export default router;
```

#### Step 2.3: Register Routes
Update `server/index.js`:
```javascript
import messageRoutes from './routes/messages.js';
app.use('/api/messages', messageRoutes);
```

---

### **Phase 3: Socket.io Events**

#### Step 3.1: DM Socket Handlers
Update `server/index.js` socket logic:

##### **Event: `join_dm_conversation`**
```javascript
socket.on('join_dm_conversation', async ({ conversationId }) => {
  // Verify user is participant
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation.participants.includes(socket.user._id)) {
    return socket.emit('error', { message: 'Unauthorized' });
  }
  
  socket.join(conversationId);
  console.log(`${socket.user.name} joined DM conversation: ${conversationId}`);
});
```

##### **Event: `send_dm`**
```javascript
socket.on('send_dm', async (data) => {
  const { conversationId, receiverId, message } = data;
  
  // Validate conversation
  const conversation = await Conversation.findById(conversationId);
  
  // Save message to database
  const savedMessage = await DirectMessage.create({
    conversationId,
    sender: socket.user._id,
    receiver: receiverId,
    message,
    timestamp: new Date()
  });
  
  // Update conversation lastMessage
  conversation.lastMessage = {
    text: message,
    sender: socket.user._id,
    timestamp: new Date()
  };
  
  // Increment unread count for receiver
  conversation.incrementUnread(receiverId);
  await conversation.save();
  
  // Broadcast to conversation room
  io.to(conversationId).emit('receive_dm', {
    ...savedMessage.toObject(),
    senderName: socket.user.name
  });
  
  // Notify receiver if online but not in conversation room
  io.to(`user_${receiverId}`).emit('new_dm_notification', {
    conversationId,
    senderName: socket.user.name,
    preview: message.substring(0, 50)
  });
});
```

##### **Event: `leave_dm_conversation`**
```javascript
socket.on('leave_dm_conversation', ({ conversationId }) => {
  socket.leave(conversationId);
});
```

##### **Event: `typing_dm`** (Optional - for "User is typing..." indicator)
```javascript
socket.on('typing_dm', ({ conversationId, isTyping }) => {
  socket.to(conversationId).emit('user_typing_dm', {
    userId: socket.user._id,
    userName: socket.user.name,
    isTyping
  });
});
```

#### Step 3.2: User-Specific Rooms
On connection, join user-specific room for notifications:
```javascript
io.on('connection', (socket) => {
  socket.join(`user_${socket.user._id}`);
  // ... existing logic
});
```

---

## 🎨 Frontend Implementation

### **Phase 4: API Client & Types**

#### Step 4.1: TypeScript Types
File: `client/src/types/messages.ts`

```typescript
export interface Conversation {
  _id: string;
  otherUser: {
    _id: string;
    name: string;
    profilePicture?: string;
    isOnline: boolean;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isOwnMessage: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface DirectMessage {
  _id: string;
  conversationId: string;
  sender: string;
  senderName: string;
  receiver: string;
  message: string;
  read: boolean;
  timestamp: string;
}
```

#### Step 4.2: API Client
File: `client/src/lib/api.ts` (extend existing)

```typescript
export const messageAPI = {
  getConversations: async () => {
    const response = await fetch(`${API_URL}/api/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },
  
  getOrCreateConversation: async (userId: string) => {
    const response = await fetch(`${API_URL}/api/messages/conversation/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },
  
  getMessageHistory: async (conversationId: string, page = 1) => {
    const response = await fetch(
      `${API_URL}/api/messages/${conversationId}/history?page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.json();
  },
  
  markAsRead: async (conversationId: string) => {
    const response = await fetch(`${API_URL}/api/messages/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ conversationId })
    });
    return response.json();
  }
};
```

---

### **Phase 5: Socket Hook**

#### Step 5.1: DM Socket Hook
File: `client/src/hooks/useDMSocket.ts`

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useDMSocket = (conversationId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  
  useEffect(() => {
    const token = localStorage.getItem('token'); // Or from session
    const socketInstance = io(SOCKET_URL, {
      auth: { token }
    });
    
    setSocket(socketInstance);
    
    if (conversationId) {
      socketInstance.emit('join_dm_conversation', { conversationId });
    }
    
    socketInstance.on('receive_dm', (message: DirectMessage) => {
      setMessages(prev => [...prev, message]);
    });
    
    return () => {
      if (conversationId) {
        socketInstance.emit('leave_dm_conversation', { conversationId });
      }
      socketInstance.disconnect();
    };
  }, [conversationId]);
  
  const sendMessage = (receiverId: string, message: string) => {
    if (socket && conversationId) {
      socket.emit('send_dm', { conversationId, receiverId, message });
    }
  };
  
  return { socket, messages, setMessages, sendMessage };
};
```

---

### **Phase 6: UI Components**

#### Step 6.1: Inbox Page
File: `client/src/app/messages/page.tsx`

**Features:**
- List all conversations
- Search/filter conversations
- Click to open conversation
- Show unread count badges
- Real-time updates

**Layout:**
```
┌─────────────────────────────────────┐
│  Messages                    [+]    │
├─────────────────────────────────────┤
│  🔍 Search conversations...         │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 👤 John Doe            [3]  │   │
│  │ See you tomorrow!           │   │
│  │ 2 hours ago                 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Jane Smith               │   │
│  │ Thanks for the info!        │   │
│  │ Yesterday                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Step 6.2: Direct Message Chat Page
File: `client/src/app/messages/[userId]/page.tsx`

**Features:**
- Real-time chat interface
- Message history (infinite scroll/pagination)
- Typing indicators
- Online/offline status
- Send text messages

**Layout:**
```
┌─────────────────────────────────────┐
│  ← John Doe                  🟢     │
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────┐                │
│  │ Hey, when are  │ You   10:30 AM │
│  │ we leaving?    │                │
│  └────────────────┘                │
│                                     │
│                ┌──────────────────┐ │
│   10:35 AM John│ Tomorrow at 8 AM │ │
│                └──────────────────┘ │
│                                     │
│  [John is typing...]                │
├─────────────────────────────────────┤
│  Type a message...            [Send]│
└─────────────────────────────────────┘
```

#### Step 6.3: Components to Build

##### **ConversationList Component**
File: `client/src/components/messages/ConversationList.tsx`
- Displays list of conversations
- Shows preview, unread count, timestamp
- Click handler to navigate to conversation

##### **DirectMessageBox Component**
File: `client/src/components/messages/DirectMessageBox.tsx`
- Similar to `ChatRoom` but for 1-on-1
- Message input, send button
- Message list with sender/receiver distinction
- Auto-scroll to bottom

##### **MessageBubble Component**
File: `client/src/components/messages/MessageBubble.tsx`
- Displays single message
- Different styling for sent vs received
- Timestamp, read status

#### Step 6.4: Navigation Updates

##### Update Navbar
File: `client/src/components/Navbar.tsx`
- Add "Messages" link
- Add unread message count badge (live via socket)

##### Add "Send Message" Button
Update user profile components:
- Trip creator profile
- Squad member list
- User profile page

Add button:
```tsx
<button onClick={() => router.push(`/messages/${userId}`)}>
  Send Message
</button>
```

---

### **Phase 7: Real-time Notifications**

#### Step 7.1: Global Socket Context
File: `client/src/contexts/SocketContext.tsx`

```typescript
export const SocketProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  useEffect(() => {
    const socketInstance = io(SOCKET_URL, { auth: { token } });
    
    socketInstance.on('new_dm_notification', (data) => {
      setUnreadCount(prev => prev + 1);
      toast.info(`New message from ${data.senderName}`);
    });
    
    setSocket(socketInstance);
    
    return () => socketInstance.disconnect();
  }, []);
  
  return (
    <SocketContext.Provider value={{ socket, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
```

#### Step 7.2: Use in Layout
Wrap app in `SocketProvider` in `client/src/app/layout.tsx`

---

## 📝 Step-by-Step Implementation Order

### **Week 1: Backend Foundation**
1. ✅ Create `Conversation` model
2. ✅ Create `DirectMessage` model
3. ✅ Update model exports
4. ✅ Create message controller with all endpoints
5. ✅ Create message routes
6. ✅ Register routes in `index.js`
7. ✅ Test API endpoints with Postman

### **Week 2: Socket.io Integration**
8. ✅ Implement `join_dm_conversation` event
9. ✅ Implement `send_dm` event with persistence
10. ✅ Implement `leave_dm_conversation` event
11. ✅ Implement typing indicators (optional)
12. ✅ Add user-specific rooms for notifications
13. ✅ Test socket events with Socket.io client

### **Week 3: Frontend Core**
14. ✅ Create TypeScript types
15. ✅ Extend API client with message methods
16. ✅ Create `useDMSocket` hook
17. ✅ Build `ConversationList` component
18. ✅ Build `DirectMessageBox` component
19. ✅ Build `MessageBubble` component

### **Week 4: Pages & Integration**
20. ✅ Create `/messages` inbox page
21. ✅ Create `/messages/[userId]` chat page
22. ✅ Add "Messages" to navbar
23. ✅ Add unread count badge to navbar
24. ✅ Add "Send Message" buttons to profiles
25. ✅ Implement socket context for global notifications

### **Week 5: Polish & Testing**
26. ✅ Add loading states and error handling
27. ✅ Implement pagination for message history
28. ✅ Add online/offline status indicators
29. ✅ Test across all user scenarios
30. ✅ Deploy to production

---

## ✅ Testing Checklist

### Backend
- [ ] Can create conversation between two users
- [ ] Cannot create duplicate conversations
- [ ] Messages save correctly to database
- [ ] Unread counts update properly
- [ ] API returns correct data format
- [ ] Socket events emit to correct rooms
- [ ] Authentication works on all endpoints

### Frontend
- [ ] Inbox loads all conversations
- [ ] Can start new conversation
- [ ] Messages send and receive in real-time
- [ ] Unread counts display correctly
- [ ] Message history loads with pagination
- [ ] Typing indicators work (if implemented)
- [ ] Notifications appear for new messages
- [ ] UI responsive on mobile

### Integration
- [ ] Squad chat and DMs work independently
- [ ] No conflicts between socket events
- [ ] Performance acceptable with multiple conversations
- [ ] Works across different browsers
- [ ] Session persistence after refresh

---

## 🚀 Future Enhancements (Post-MVP)

1. **Rich Media**
   - Image/file uploads in DMs
   - Voice messages
   - Link previews

2. **Advanced Features**
   - Message reactions (emoji)
   - Reply/quote messages
   - Message editing/deletion
   - Search within conversations

3. **Notifications**
   - Email notifications for missed messages
   - Push notifications (PWA)
   - Desktop notifications

4. **Privacy**
   - Block users
   - Report inappropriate messages
   - Message encryption (end-to-end)

5. **Group DMs**
   - Create group chats (3+ users) separate from trip squads
   - Group chat management

6. **Integrations**
   - Share trip details directly in DMs
   - Quick-join trip invites via DM

---

## 📦 Dependencies to Add

### Backend
```json
{
  "// Already have": "socket.io, mongoose, jsonwebtoken"
}
```
No new dependencies needed!

### Frontend
```json
{
  "// Already have": "socket.io-client, react, next.js"
}
```
No new dependencies needed!

---

## 🔒 Security Considerations

1. **Authorization**
   - Verify user is participant before allowing access to conversation
   - Validate socket connections with JWT
   - Rate limiting on message sending (prevent spam)

2. **Input Validation**
   - Sanitize message content (prevent XSS)
   - Limit message length (2000 chars)
   - Validate conversation participants

3. **Privacy**
   - Users can only see their own conversations
   - No message access without authentication
   - Consider adding message retention policy

---

## 📊 Performance Optimizations

1. **Database**
   - Index on `conversationId` + `timestamp` for fast history queries
   - Index on `participants` for conversation lookups
   - Pagination for message history

2. **Socket.io**
   - Use rooms efficiently to reduce broadcast overhead
   - Disconnect inactive sockets
   - Implement reconnection logic

3. **Frontend**
   - Virtualized scrolling for long message lists
   - Lazy load message history
   - Debounce typing indicators
   - Cache conversation list

---

## 📈 Success Metrics

Track these metrics post-launch:
- Number of active conversations
- Messages sent per day
- Average response time
- User engagement (% of users using DMs)
- Unread message conversion rate

---

## 🎉 Summary

This implementation plan provides a complete roadmap for adding robust, real-time direct messaging to TripSang. The feature integrates seamlessly with the existing squad chat while providing users with private communication channels for trip planning and coordination.

**Estimated Timeline:** 4-5 weeks (with one developer)
**Complexity:** Medium-High
**Impact:** High (Major feature addition)

Ready to proceed when you are! 🚀
