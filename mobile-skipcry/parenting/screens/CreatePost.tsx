import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axiosClient from "@/lib/axiosClient";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

// Conditionally import ImagePicker to avoid crash when native module not available
let ImagePicker: any = null;
try {
  ImagePicker = require("expo-image-picker");
} catch (e) {
  console.warn("expo-image-picker not available");
}

const CATEGORIES = [
  "General Thoughts",
  "Parenting Tips",
  "Child Development",
  "Health & Wellness",
  "Education",
  "Entertainment",
  "Ask for Advice",
  "Success Stories",
];

export default function CreatePost() {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const isPostValid = () => {
    return postContent.trim().length > 0 && selectedCategory.trim().length > 0;
  };

  const pickImage = async () => {
    if (!ImagePicker) {
      Alert.alert(
        "Not available",
        "Image picker is not available on this device",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("photo");
    }
  };

  const pickVideo = async () => {
    if (!ImagePicker) {
      Alert.alert(
        "Not available",
        "Video picker is not available on this device",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("video");
    }
  };

  const removeMedia = () => {
    setMediaUri(null);
    setMediaType(null);
  };
  // if(user?.CustomerId==null){
  //   console.log("no user found")
  // }else{
  //   console.log("hello iam the customer logged in",user.CustomerId)
  //   console.log(user._id)
  //   console.log(user.Name)
  //   console.log(user.Mobile)
  // }
  const handleSubmit = async () => {
    if (!isPostValid()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!user?.CustomerId) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    setIsSubmitting(true);
    try {
      let mediaUrl = "";
      let mediaTypeForPost = "";

      // If media selected, upload to AWS first
      if (mediaUri && mediaType) {
        const mime = mediaType === "photo" ? "image/jpeg" : "video/mp4";
        const presigned = await axiosClient.get(
          "/parenting/posts/presigned-url",
          {
            params: { type: "posts", fileType: mime },
          },
        );
        const { uploadUrl, publicUrl } = presigned.data;

        // Upload to S3
        const response = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": mime },
          body: await fetch(mediaUri).then((r) => r.blob()),
        });

        if (!response.ok) throw new Error("Failed to upload media");

        mediaUrl = publicUrl;
        mediaTypeForPost = mediaType;
      }

      // Determine post type based on media
      const postType = mediaType
        ? mediaType === "photo"
          ? "image"
          : "video"
        : "text";

      // Create post
      await axiosClient.post("/parenting/posts", {
        authorId: user._id,
        customerId: user.CustomerId,
        content: postContent,
        category: selectedCategory,
        mediaUrl,
        mediaType: mediaTypeForPost,
      });
      queryClient.invalidateQueries({ queryKey: ["parenting", "feed"] });
      Alert.alert("Success", "Post created successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-4 py-6 bg-white border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                Create Post
              </Text>
              <Text className="text-base text-gray-600 mt-1">
                Share your thoughts with the community
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View className="px-4 py-6">
          {/* Post Content Textarea */}
          <View className="mb-4">
            <TextInput
              value={postContent}
              onChangeText={setPostContent}
              placeholder="What's on your mind?"
              multiline
              numberOfLines={6}
              placeholderTextColor="#9CA3AF"
              className="w-full p-4 border border-gray-300 rounded-lg text-gray-900 bg-white"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Media Preview */}
          {mediaUri && mediaType && (
            <View className="mb-4 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <View className="flex-row items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                <Text className="text-sm font-medium text-gray-700">
                  {mediaType === "photo" ? "Image Preview" : "Video Preview"}
                </Text>
                <TouchableOpacity onPress={removeMedia}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
              {mediaType === "photo" && (
                <Image
                  source={{ uri: mediaUri }}
                  className="w-full h-64"
                  resizeMode="cover"
                />
              )}
              {mediaType === "video" && (
                <View className="w-full h-64 bg-black items-center justify-center">
                  <Ionicons name="play" size={48} color="white" />
                </View>
              )}
            </View>
          )}

          {/* Media Buttons */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Add to your post
            </Text>
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 flex-row items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white"
              >
                <Ionicons name="image" size={18} color="#16A34A" />
                <Text className="ml-2 text-sm text-gray-700 font-medium">
                  Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickVideo}
                className="flex-1 flex-row items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white"
              >
                <Ionicons name="videocam" size={18} color="#2563EB" />
                <Text className="ml-2 text-sm text-gray-700 font-medium">
                  Video
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* <View className="mb-2">
            <Text className="text-xs text-gray-600">
              {user?.CustomerId ? `CustomerId: ${user.CustomerId}` : 'No user logged in'}
            </Text>
          </View> */}

          {/* Category Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Category <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white flex-row items-center justify-between"
            >
              <Text
                className={selectedCategory ? "text-gray-900" : "text-gray-400"}
              >
                {selectedCategory || "Select a category"}
              </Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>

            {/* Category Dropdown */}
            {showCategoryPicker && (
              <View className="mt-2 border border-gray-300 rounded-lg bg-white overflow-hidden">
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryPicker(false);
                    }}
                    className="p-3 border-b border-gray-100"
                  >
                    <Text
                      className={
                        selectedCategory === category
                          ? "text-blue-600 font-medium"
                          : "text-gray-900"
                      }
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Helper Text */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <Text className="text-sm text-blue-800">
              Share your thoughts, experiences, or ask questions to connect with
              other parents in our community.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed Footer */}
      <View className="absolute bottom-0 left-0 right-0 flex-row bg-white border-t border-gray-200 px-4 py-4 space-x-3">
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isSubmitting}
          className="flex-1 py-3 border border-gray-300 rounded-lg items-center justify-center"
        >
          <Text className="text-gray-700 font-medium">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isPostValid() || isSubmitting}
          className={`flex-1 py-3 rounded-lg items-center justify-center flex-row ${
            isPostValid() && !isSubmitting ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          {isSubmitting && (
            <ActivityIndicator
              size="small"
              color="white"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className={`font-medium ${isSubmitting || !isPostValid() ? "text-gray-500" : "text-white"}`}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
