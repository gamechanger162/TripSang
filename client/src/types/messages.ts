export interface Conversation {
    _id: string;
    otherUser: {
        _id: string;
        name: string;
        profilePicture?: string;
        isOnline?: boolean;
    };
    lastMessage: {
        text: string;
        timestamp: string;
        isOwnMessage: boolean;
    } | null;
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
    type?: 'text' | 'image';
    imageUrl?: string;
}

export interface SendMessageData {
    conversationId: string;
    receiverId: string;
    message: string;
    type?: 'text' | 'image';
    imageUrl?: string;
}

export interface DMNotification {
    conversationId: string;
    senderName: string;
    senderId: string;
    preview: string;
    timestamp: string;
}
