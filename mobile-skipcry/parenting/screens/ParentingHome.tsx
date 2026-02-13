import { useFeed } from '@/src/features/parenting/hooks/useFeed';
import FeedCard from '../components/FeedCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { 
  ActivityIndicator, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHADOWS } from '@/lib/design';

export default function ParentingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data: posts, isLoading, error } = useFeed();
  
  // Responsive
  const isWeb = width >= 768;

  const handleHomePress = () => {
    router.replace("/(tabs)");
  };

  if (isLoading) {
    return (
      <View 
        className="flex-1 bg-gray-50 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="text-gray-600 mt-4">Loading feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View 
        className="flex-1 bg-gray-50 items-center justify-center px-6"
        style={{ paddingTop: insets.top }}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-900 font-semibold text-lg mt-4">
          Error loading feed
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          {error.message || 'Please try again later'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: isWeb ? 40 : 100,
        }}
      >
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Parenting</Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Tips, stories & resources for parents
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleHomePress}
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
            activeOpacity={0.7}
            style={SHADOWS.sm}
          >
            <Ionicons name="home-outline" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Feed List */}
        <View className="px-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <FeedCard key={post._id || post.postId} post={post} />
            ))
          ) : (
            <View 
              className="bg-white rounded-2xl p-6 items-center"
              style={SHADOWS.sm}
            >
              <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="people-outline" size={32} color="#A855F7" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">No posts yet</Text>
              <Text className="text-sm text-gray-500 text-center mt-2">
                Check back soon for community posts
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

