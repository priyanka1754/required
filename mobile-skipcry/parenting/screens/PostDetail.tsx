import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  Linking,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePost, useComments, useAddCommentMutation ,useLikeMutation} from "../hooks/usePosts";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { API_BASE_URL } from "@/utils/config";
import { getRelativeTime } from "@/utils/utils";
import { Post } from "../api/postsApi";
import postsApi from "../api/postsApi";
import BackHeader from "../components/BackHeader";


interface PostDetailProps {
  post: Post;
  postId: string;
}

export default function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter();
  const { data: post, isLoading, error } = usePost(postId || null);
  const { data: comments } = useComments(postId || null);
  const addComment = useAddCommentMutation();
  const [commentText, setCommentText] = useState("");
  const currentUser = useSelector((s: RootState) => s.auth.user);
  // const likeMutation = useLikeMutation();

//   const userId = currentUser?._id || null;
// const isLiked = !!(userId && post?.likes?.includes(userId));
const likeCountFromServer = post?.likes?.length || 0;
const [optimisticLikeCount, setOptimisticLikeCount] = React.useState<number | null>(null);
const effectiveLikeCount = optimisticLikeCount ?? likeCountFromServer;
const userId = currentUser?._id || null;
const likeMutation = useLikeMutation();

const isLiked = !!(userId && post?.likes?.includes(userId));
const likeCount = post?.likes?.length || 0;

const handleLike = () => {
  if (!post?.postId || !userId || likeMutation.isPending) return;

  likeMutation.mutate(
    { postId: post.postId, userId },
    {
      onError: () => {
        Alert.alert("Error", "Failed to update like. Please try again.");
      },
    }
  );
};

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!currentUser?._id) {
      Alert.alert("Error", "Please log in to comment.");
      return;
    }

    try {
      await addComment.mutateAsync({
        postId: postId!,
        content: commentText.trim(),
        userId: currentUser._id, // no ? here, guaranteed string
      });
      setCommentText("");
    } catch (e) {
      Alert.alert("Error", "Failed to add comment. Please try again.");
    }
  };

  const sharePost = async (post: any) => {
    try {
      const textToShare = `Check out this post on SkipCry!\n\n"${(post.content || "").slice(0, 100)}..."\n\nRead more: ${window.location.href}`;
      const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;

      const canOpen = await Linking.canOpenURL(whatsappLink);
      if (canOpen) {
        await Linking.openURL(whatsappLink);
        return;
      }

      await Share.share({ message: textToShare });
    } catch (e) {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="text-gray-600 mt-4">Loading post...</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-900 font-semibold text-lg mt-4">
          Error loading post
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          {error?.message || "Please try again later"}
        </Text>
      </View>
    );
  }

  const authorName =
    (post as any)?.authorId?.name ||
    (post as any)?.authorId?.Name ||
    "Anonymous";

  const authorInitials = (authorName || "A")
    .split(" ")
    .map((n: any) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="flex-1 bg-gradient-to-br from-pink-50 to-purple-50">
      <BackHeader title="Post" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 py-4">
          {/* Single card container */}
          <View
            className="bg-white rounded-2xl p-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {/* 1) Author + time + category (top) */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Text className="text-gray-600 font-semibold text-sm">
                    {authorInitials}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">
                    {authorName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    {post.category && (
                      <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                        <Text className="text-blue-700 text-xs font-medium">
                          {post.category}
                        </Text>
                      </View>
                    )}
                    <Text className="text-gray-500 text-xs">
                      {post.createdAt ? getRelativeTime(post.createdAt) : ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 2) Media (image) directly under header */}
            {post.mediaUrl && (
              <Image
                source={{
                  uri: post.mediaUrl.startsWith("/")
                    ? `${API_BASE_URL}${post.mediaUrl}`
                    : post.mediaUrl,
                }}
                className="w-full h-64 rounded-2xl mt-4"
                resizeMode="cover"
              />
            )}

            {/* 3) Full content below image */}
            {post.content && (
              <Text className="text-gray-900 text-base leading-6 mt-4">
                {post.content}
              </Text>
            )}

            {/* 4) Footer actions (unchanged) */}
            <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-100">
              <TouchableOpacity
                onPress={handleLike}
                className="flex-row items-center px-3 py-2 rounded-full"
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={20}
                  color={isLiked ? "#EF4444" : "#6B7280"}
                />
                <Text
  className={`ml-2 text-sm ${
    isLiked ? "text-red-500" : "text-gray-500"
  }`}
>
  {effectiveLikeCount}
</Text>

              </TouchableOpacity>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => {
                    // later: scroll to comments
                  }}
                  className="flex-row items-center px-3 py-2 rounded-full"
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color="#6B7280"
                  />
                  <Text className="ml-2 text-sm text-gray-500">
                    {comments?.length || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => sharePost(post)}
                  className="ml-4 flex-row items-center px-3 py-2 rounded-full"
                >
                  <Ionicons name="share-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Comments Section (same as before) */}
          <View
            className="mt-4 bg-white rounded-2xl p-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Comments ({comments?.length || 0})
            </Text>

            {currentUser ? (
              <View className="flex-row items-start mb-4">
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Text className="text-gray-600 font-semibold">
                    {(currentUser?.Name || (currentUser as any)?.name || "U")
                      .split(" ")
                      .map((n: any) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </View>
                <View className="flex-1">
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Write your comment here..."
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
                    style={{ minHeight: 60 }}
                  />
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-xs text-gray-500">
                      {commentText.length}/500 characters
                    </Text>
                    <TouchableOpacity
                      onPress={handleAddComment}
                      className="bg-indigo-600 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-white font-medium">Comment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <Text className="text-yellow-900">
                  Please log in to post comments and like posts.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/login" as any)}
                  className="mt-3 bg-gray-300 px-3 py-2 rounded-lg items-center"
                >
                  <Text className="text-gray-800">Log In</Text>
                </TouchableOpacity>
              </View>
            )}

            {comments && comments.length > 0 ? (
              comments.map((c: any) => (
                <View key={c._id || c.id} className="flex-row items-start mb-4">
                  <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                    <Text className="text-gray-600">
                      {(c.authorName || "U")
                        .split(" ")
                        .map((n: any) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </Text>
                  </View>
                  <View className="flex-1 bg-gray-50 rounded-lg p-3">
                    <Text className="text-sm font-semibold text-gray-800">
  {c.authorName || "User"}
</Text>
<Text className="text-sm text-gray-700 mt-1">
  {c.comment}
</Text>
<Text className="text-xs text-gray-400 mt-2">
  {c.createdAt ? getRelativeTime(c.createdAt) : ""}
</Text>

                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={36}
                  color="#9CA3AF"
                />
                <Text className="text-gray-500 mt-4">No comments yet</Text>
                <Text className="text-gray-400">
                  Be the first to share your thoughts!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
