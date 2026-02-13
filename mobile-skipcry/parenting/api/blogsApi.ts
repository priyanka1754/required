// src/features/parenting/api/blogsApi.ts
// Blog API matching client's blog.service.ts

import axiosClient from "@/lib/axiosClient";

const CLOUDFRONT_BASE = "https://d27yy38qedtu85.cloudfront.net/blogs";

export interface Blog {
  _id: string;
  blogId: string;
  title: string;
  description?: string;
  content?: string;
  customerId?: string;
  authorName?: string;
  createdAt?: string;
  likes?: number;
  imageUrl?: string;
}

/**
 * Fetch all blogs
 * Matches client BlogService.getBlogs()
 */
export async function getBlogs(): Promise<Blog[]> {
  const response = await axiosClient.get<Blog[]>("/blogs");
  return response.data.map((blog) => ({
    ...blog,
    imageUrl: `${CLOUDFRONT_BASE}/${blog.blogId}/1.jpg`,
  }));
}

/**
 * Fetch single blog by ID
 * Matches client BlogService.getBlogById()
 */
export async function getBlogById(blogId: string): Promise<Blog> {
  const response = await axiosClient.get<{ blog: Blog }>(`/blogs/${blogId}`);
  return {
    ...response.data.blog,
    imageUrl: `${CLOUDFRONT_BASE}/${response.data.blog.blogId}/1.jpg`,
  };
}

export default {
  getBlogs,
  getBlogById,
};
