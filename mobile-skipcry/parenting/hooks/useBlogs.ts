// src/features/parenting/hooks/useBlogs.ts
// React Query hooks for blogs

import { useQuery } from "@tanstack/react-query";
import blogsApi, { Blog } from "../api/blogsApi";

/**
 * Fetch all blogs
 */
export function useBlogs() {
  return useQuery<Blog[], Error>({
    queryKey: ["blogs"],
    queryFn: blogsApi.getBlogs,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single blog by ID
 */
export function useBlog(blogId: string | null) {
  return useQuery<Blog, Error>({
    queryKey: ["blog", blogId],
    queryFn: () => blogsApi.getBlogById(blogId!),
    enabled: !!blogId,
  });
}
