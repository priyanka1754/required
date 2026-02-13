// src/features/parenting/api/postsApi.ts
import axiosClient from '@/lib/axiosClient';
import {User} from '@/store/slices/authSlice';
export interface Post {
  _id?: string;
  postId?: string;
  authorId?: User;
  content?: string;
  category?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt?: string;
  likes?: Array<string>;
  comments?: Array<any>;
}

export async function getPosts(page = 1, limit = 10): Promise<Post[]> {
  const response = await axiosClient.get<{ posts: Post[] }>(`/parenting/posts`, {
    params: { page, limit },
  });
  return response.data.posts || [];
}

export async function getPostById(postId: string): Promise<Post | null> {
  const response = await axiosClient.get<{ post: Post }>(`/parenting/posts/${postId}`);
  return response.data.post || null;
}

export async function getComments(postId: string): Promise<any[]> {
  const response = await axiosClient.get<{ comments: any[] }>(`/parenting/posts/${postId}/comments`);
  return response.data.comments || [];
}

export async function addComment(
  postId: string,
  content: string,
  userId: string
): Promise<any> {
  const response = await axiosClient.post(
    `/parenting/posts/${postId}/comment`,
    { content, userId }
  );
  return response.data;
}


export async function toggleLike(postId: string, userId?: string): Promise<any> {
  // Mobile app authenticates via token; backend middleware uses req.user from token.
  // Send empty body and let server use the authenticated user.
  const response = await axiosClient.post(`/parenting/posts/${postId}/like`, {postId, userId});
  return response.data;
}

export default {
  getPosts,
  getPostById,
  getComments,
  addComment,
  toggleLike,
};
