// src/features/parenting/hooks/usePost.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import postsApi, { Post } from "../api/postsApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePost(postId: string | null) {
  return useQuery<Post | null, Error>({
    queryKey: ["parenting", "post", postId],
    queryFn: () => postsApi.getPostById(postId!),
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useComments(postId: string | null) {
  return useQuery<any[], Error>({
    queryKey: ["parenting", "post", postId, "comments"],
    queryFn: () => postsApi.getComments(postId!),
    enabled: !!postId,
    staleTime: 60 * 1000,
  });
}

export function useLikeMutation() {
  const qc = useQueryClient();

  const fn = async ({ postId, userId }: { postId: string; userId?: string }) =>
    postsApi.toggleLike(postId, userId);

  // in useLikeMutation
  return useMutation<any, Error, { postId: string; userId?: string }>({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      // data.likes should be the updated array of userIds
      qc.setQueryData<Post | null>(["parenting", "post", vars.postId], (old) =>
        old ? { ...old, likes: data.likes } : old,
      );
      qc.setQueryData<Post[]>(["parenting", "feed"], (old) =>
        old
          ? old.map((p) =>
              p.postId === vars.postId ? { ...p, likes: data.likes } : p,
            )
          : old,
      );
    },
  });
}

export function useAddCommentMutation() {
  const qc = useQueryClient();

  type AddCommentInput = { postId: string; content: string; userId: string };

  const fn2 = async ({ postId, content, userId }: AddCommentInput) => {
    return postsApi.addComment(postId, content, userId);
  };

  return useMutation<any, Error, AddCommentInput>({
    mutationFn: fn2,
    onSuccess: (_data: any, vars: AddCommentInput) => {
      // comments for this post
      qc.invalidateQueries({
        queryKey: ["parenting", "post", vars.postId, "comments"],
      });
      // single post detail (for commentCount / comments array)
      qc.invalidateQueries({ queryKey: ["parenting", "post", vars.postId] });
      // feed list so FeedCard sees updated comments length
      qc.invalidateQueries({ queryKey: ["parenting", "feed"] });
    },
  });
}

export async function getStoredUserId(): Promise<string | null> {
  try {
    // Try common storage keys for user object
    const possibleKeys = ["user", "profile", "currentUser"];
    for (const k of possibleKeys) {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const id = parsed?.id || parsed?._id || parsed?.userId || parsed?.uid;
        if (id) return id;
      } catch (_) {
        // not JSON, skip
      }
    }

    // Fallback: try to decode JWT token stored under 'token'
    const token = await AsyncStorage.getItem("token");
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          let json = null as string | null;
          try {
            // Use browser/React Native atob if available
            const atobFn = (globalThis as any).atob || (global as any).atob;
            if (typeof atobFn === "function") {
              json = atobFn(b64);
            }
          } catch (_) {
            // atob not available
          }

          if (!json) {
            // Unable to decode token payload in this environment
            json = null;
          }

          if (json) {
            const payload = JSON.parse(json);
            return payload?.id || payload?._id || payload?.userId || null;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

export default usePost;
