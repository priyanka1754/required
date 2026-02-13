// app/(tabs)/parenting.tsx
import { useBlogs } from '@/src/features/parenting/hooks/useBlogs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackHeader from '../components/BackHeader';

const stripHtml = (html?: string): string => {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ');
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function BlogsScreen() {
  const router = useRouter();
  const { data: blogs, isLoading, error } = useBlogs();

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="text-gray-600 mt-4">Loading blogs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-900 font-semibold text-lg mt-4">
          Error loading blogs
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          {error.message || 'Please try again later'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <BackHeader title="Blogs" />

        {/* Blog List */}
        <View className="px-4 mt-4">
          {blogs && blogs.length > 0 ? (
            blogs.map((blog) => {
              const introPreview = stripHtml(
                (blog as any).intro || blog.description || blog.content || ''
              );

              return (
                <TouchableOpacity
                  key={blog._id || blog.blogId}
                  onPress={() =>
                    router.push(`/parenting/blog/${blog.blogId}` as any)
                  }
                  className="bg-white rounded-2xl mb-4 overflow-hidden"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  activeOpacity={0.8}
                >
                  {/* Blog Image */}
                  {blog.imageUrl && (
                    <Image
                      source={{ uri: blog.imageUrl }}
                      className="w-full h-52"
                      resizeMode="cover"
                    />
                  )}

                  {/* Blog Content */}
                  <View className="p-4">
                    <Text
                      className="text-base font-bold text-gray-900 mb-2"
                      numberOfLines={2}
                    >
                      {blog.title}
                    </Text>

                    {introPreview ? (
                      <Text
                        className="text-sm text-gray-600 mb-3"
                        numberOfLines={3}
                      >
                        {introPreview}
                      </Text>
                    ) : null}

                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="text-xs text-gray-500">
                        By {blog.authorName || 'SkipCry Team'}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="heart-outline"
                          size={16}
                          color="#9CA3AF"
                        />
                        <Text className="text-xs text-gray-500 ml-1">
                          {blog.likes || 0} likes
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="bg-purple-50 border border-purple-200 rounded-2xl p-6 items-center">
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#A855F7"
              />
              <Text className="text-lg font-semibold text-purple-900 mt-4">
                No blogs yet
              </Text>
              <Text className="text-sm text-purple-700 text-center mt-2">
                Check back soon for parenting tips and stories
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
