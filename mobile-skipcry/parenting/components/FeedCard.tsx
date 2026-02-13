import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Share, Alert,Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Post } from '../api/postsApi';
import postsApi from '../api/postsApi';
import { getRelativeTime } from '@/utils/utils';
import { API_BASE_URL } from '@/utils/config';
import { RootState } from '@/store';
import { useLikeMutation } from '../hooks/usePosts';

interface FeedCardProps {
  post: Post;
}

export default function FeedCard({ post }: FeedCardProps) {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
// const likeMutation = useLikeMutation();
// const userId = currentUser?._id || null;
// const isLiked = !!(userId && post.likes?.includes(userId));
const likeCountFromServer = post.likes?.length || 0;
const [optimisticLikeCount, setOptimisticLikeCount] = React.useState<number | null>(null);
const effectiveLikeCount = optimisticLikeCount ?? likeCountFromServer;
const userId = currentUser?._id || null;
const likeMutation = useLikeMutation();

const isLiked = !!(userId && post.likes?.includes(userId));
const likeCount = post.likes?.length || 0;

const handleLike = () => {
  if (!post.postId || !userId || likeMutation.isPending) return;

  likeMutation.mutate(
    { postId: post.postId, userId },
    {
      onError: () => {
        Alert.alert('Error', 'Failed to update like. Please try again.');
      },
    }
  );
};

// const handleLike = () => {
//   if (!post.postId || !userId || likeMutation.isPending) return;

//   const currentlyLiked = post.likes?.includes(userId) || false;
//   const serverCount = post.likes?.length || 0;

//   // optimistic: flip liked and adjust count, but only in local count
//   const nextCount = currentlyLiked ? serverCount - 1 : serverCount + 1;
//   setOptimisticLikeCount(nextCount);

//   likeMutation.mutate(
//     { postId: post.postId, userId },
//     {
//       onError: () => {
//         // on error, drop optimistic override → fall back to server value
//         setOptimisticLikeCount(null);
//         Alert.alert('Error', 'Failed to update like. Please try again.');
//       },
//       onSuccess: () => {
//         // server refetch will update post.likes; remove override after that if you want
//         setOptimisticLikeCount(null);
//       },
//     }
//   );
// };



  const openPost = () => {
    if (post.postId) {
      router.push(`/parenting/post/${post.postId}` as any);
    }
  };

  const handleComment = () => {
    if (post.postId) {
      // later you can pass scrollToComments param here if needed
      router.push(`/parenting/post/${post.postId}` as any);
    }
  };

  const handleShare = async (post: any) => {
    try {
      const textToShare = `Check out this post on SkipCry!\n\n"${(post.content || "").slice(0, 100)}..."\n\nRead more: ${window.location.href}/post/${post.postId}`;
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

  const getAvatarInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const authorName =
    typeof post.authorId === 'object' && post.authorId?.Name
      ? post.authorId.Name
      : 'Anonymous';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={openPost}
      className="bg-white rounded-2xl mb-4 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 pb-2">
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
            <Text className="text-gray-600 font-semibold text-sm">
              {getAvatarInitials(authorName)}
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
                {post.createdAt ? getRelativeTime(post.createdAt) : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content – only 3 lines, tap handled by parent TouchableOpacity */}
      <View className="px-4 pb-2">
        <Text
          className="text-gray-900 text-base leading-6"
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {post.content}
        </Text>
      </View>

      {/* Media */}
      {post.mediaUrl && (
        <Image
          source={{
            uri: post.mediaUrl.startsWith('/')
              ? `${API_BASE_URL}${post.mediaUrl}`
              : post.mediaUrl,
          }}
          className="w-full h-64"
          resizeMode="cover"
        />
      )}

      {/* Footer Actions */}
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
    {likeCount}
  </Text>
</TouchableOpacity>


        <TouchableOpacity
          onPress={handleComment}
          className="flex-row items-center px-3 py-2 rounded-full"
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text className="ml-2 text-sm text-gray-500">
            {post.comments?.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleShare(post)}
          className="flex-row items-center px-3 py-2 rounded-full"
        >
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
