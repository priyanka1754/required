// src/features/parenting/hooks/useFeed.ts
import { useQuery } from '@tanstack/react-query';
import postsApi, { Post } from '../api/postsApi';

// example: src/features/parenting/hooks/useFeed.ts
export function useFeed() {
  return useQuery<Post[], Error>({
    queryKey: ['parenting', 'feed'],
    queryFn: () => postsApi.getPosts(1, 10),
    staleTime: 60 * 1000,
  });
}

export default useFeed;
