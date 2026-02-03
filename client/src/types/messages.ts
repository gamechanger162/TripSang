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
    replyTo?: {
        _id?: string;
        senderName: string; // Used for "Replying to X"
        message: string;
        type?: 'text' | 'image';
        imageUrl?: string;
    } | null;
}

export interface SendMessageData {
    conversationId: string;
    receiverId: string;
    message: string;
    type?: 'text' | 'image';
    imageUrl?: string;
    replyTo?: string; // ID of message replying to
}

export interface DMNotification {
    conversationId: string;
    senderName: string;
    senderId: string;
    preview: string;
    timestamp: string;
}
