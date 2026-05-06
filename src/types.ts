export type UserRole = 'user' | 'admin' | 'moderator';
export type PremiumTier = 'free' | 'gold' | 'platinum' | 'vip';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  whatsappNumber?: string;
  premiumTier: PremiumTier;
  premiumUntil?: any;
  location: string;
  bio: string;
  photos: string[];
  interests: string[];
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: any;
  updatedAt: any;
  preferences?: {
    ageMin: number;
    ageMax: number;
    genderPreference: 'male' | 'female' | 'any';
    distance: number;
  };
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  status: 'pending' | 'resolved';
  timestamp: any;
}

export interface Match {
  id: string;
  users: string[];
  timestamp: any;
  lastMessage?: string;
  lastMessageAt?: any;
  lastMessageSenderId?: string;
  unreadCount?: { [userId: string]: number };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  status: 'sent' | 'delivered' | 'read';
  reactions?: { [emoji: string]: string[] }; // emoji -> list of userIds
  timestamp: any;
}
