import axiosClient from '@/lib/axiosClient';
import { User } from '@/store/slices/authSlice';

export interface Reply {
  _id: string;
  userId: string;         // backend stores ObjectId
  comment: string;
  authorName?: string;
  authorAvatar?: string;
  likes: string[];        // userIds
  createdAt: string;
}

export interface Comment {
  _id: string;
  userId: string;
  comment: string;
  authorName?: string;
  authorAvatar?: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
}

export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export type EventCategory =
  | 'Workshop'
  | 'Kids Activity'
  | 'Meetup'
  | 'Webinar'
  | 'Health'
  | 'Education';
export type EventType = 'Online' | 'Offline';

export interface Event {
  id?: string;        // controller sometimes sets this
  _id: string;
eventId: string;
hostId: string;
hostName?: string;
  title: string;
  description: string;
  category: EventCategory;
  eventType: EventType;

  date: string;       // ISO string from backend
  time: string;
  duration?: number;

  posterUrl?: string;
  venue?: string;     // offline
  meetingLink?: string; // online
  city?: string;

  host: User | string; // if you populate host, it's User; otherwise host userId string

  maxAttendees?: number;
  isFree: boolean;
  price?: number;
  status: EventStatus;

  comments: Comment[];

  createdAt: string;
  updatedAt: string;
}

export type CreateEventDto = {
  title: string;
  description: string;
  category: EventCategory;
  eventType: EventType;
  date: string;
  time: string;
  duration?: number;
  posterUrl?: string;
  venue?: string;
  meetingLink?: string;
  city?: string;
  maxAttendees?: number;
  isFree?: boolean;
  price?: number;
  hostId?: string;
  hostName?: string;
};

export type UpdateEventDto = Partial<CreateEventDto>;

export const getEvents = async (): Promise<Event[]> => {
  const response = await axiosClient.get('/parenting/events');
  return response.data;
};

export const getEventById = async (id: string): Promise<Event> => {
  const response = await axiosClient.get(`/parenting/events/${id}`);
  return response.data;
};

export const createEvent = async (
  eventData: CreateEventDto
): Promise<Event> => {
  const response = await axiosClient.post('/parenting/events', eventData);
  return response.data;
};

export const updateEvent = async (
  id: string,
  eventData: UpdateEventDto
): Promise<Event> => {
  const response = await axiosClient.put(`/parenting/events/${id}`, eventData);
  return response.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await axiosClient.delete(`/parenting/events/${id}`);
};

export const getEventComments = async (eventId: string): Promise<Comment[]> => {
  const response = await axiosClient.get(`/parenting/events/${eventId}/comments`);
  return response.data; // backend returns event.comments[]
};

export const addEventComment = async (
  eventId: string,
  content: string,
  userId: string,
  authorName?: string,
  authorAvatar?: string,
): Promise<Comment> => {
  const response = await axiosClient.post(`/parenting/events/${eventId}/comment`, {
    comment: content,
    userId,
    authorName,
    authorAvatar,
  });
  return response.data;
};

export const toggleEventCommentLike = async (
  eventId: string,
  commentId: string,
  userId: string
): Promise<{ liked: boolean; likesCount: number }> => {
  const res = await axiosClient.post(
    `/parenting/events/${eventId}/comment/${commentId}/like`,
    { userId }
  );
  return res.data;
};

export const addEventReply = async (
  eventId: string,
  commentId: string,
  replyText: string,
  userId: string,
  authorName?: string,
  authorAvatar?: string
): Promise<Reply> => {
  const res = await axiosClient.post(
    `/parenting/events/${eventId}/comment/${commentId}/reply`,
    {
      reply: replyText,
      userId,
      authorName,
      authorAvatar,
    }
  );
  return res.data;
};
