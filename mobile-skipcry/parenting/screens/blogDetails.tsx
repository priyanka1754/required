import React, { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Share, Linking } from "react-native";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import BackHeader from "../components/BackHeader";
import { RootState } from "@/store";
import axiosClient from "@/lib/axiosClient";
import { type Blog } from "@/src/features/parenting/api/blogsApi";

interface Comment {
  _id?: string;
  content: string;
  authorName: string;
  customerId: string;
  createdAt?: string;
}

export default function BlogDetailScreen() {
  const router = useRouter();
  const { blogId } = useLocalSearchParams<{ blogId: string }>();

  const { width } = useWindowDimensions();

  const currentUser = useSelector((s: RootState) => s.auth.user);
  const customerId = currentUser?.CustomerId || currentUser?._id || "";
  const customerName = currentUser?.Name || "User";
  const queryClient = useQueryClient();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [otherBlogs, setOtherBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const normalizeHtml = (html?: string): string => {
    if (!html) return "";

    return (
      html
        // remove empty paragraphs like <p></p> or <p>   </p>
        .replace(/<p>\s*<\/p>/gi, "")
        // turn paragraphs into simple divs (less default spacing)
        .replace(/<p>/gi, "<div>")
        .replace(/<\/p>/gi, "</div>")
        // nbsp → normal space
        .replace(/&nbsp;/gi, " ")
        // remove gaps between tags
        .replace(/>\s+</g, "><")
        // collapse any remaining whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  const CLOUDFRONT_BASE = "https://d27yy38qedtu85.cloudfront.net/blogs";

  const fetchBlog = useCallback(async () => {
    if (!blogId) return;
    try {
      setIsLoading(true);
      setError(null);

      // backend returns { blog, otherBlogs }
      const res = await axiosClient.get<{ blog: Blog; otherBlogs: Blog[] }>(
        `/blogs/${blogId}`,
      );

      const main = res.data.blog;
      const mappedMain: Blog = {
        ...main,
        imageUrl: `${CLOUDFRONT_BASE}/${main.blogId}/1.jpg`,
      };
      setBlog(mappedMain);

      const mappedOthers = (res.data.otherBlogs || []).map((b) => ({
        ...b,
        imageUrl: `${CLOUDFRONT_BASE}/${b.blogId}/1.jpg`,
      }));
      setOtherBlogs(mappedOthers);

      // like status only if logged in
      if (customerId) {
        const likeStatusRes = await axiosClient.get<{
          hasLiked: boolean;
          likes: number;
        }>(`/blogs/${blogId}/like-status/${customerId}`);
        setHasLiked(likeStatusRes.data.hasLiked);
        setBlog((prev) =>
          prev ? { ...prev, likes: likeStatusRes.data.likes } : prev,
        );
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load blog");
    } finally {
      setIsLoading(false);
    }
  }, [blogId, customerId]);

  const fetchComments = useCallback(async () => {
    if (!blogId) return;
    try {
      setCommentsLoading(true);
      const res = await axiosClient.get<{ comments: Comment[] }>(
        `/blogs/${blogId}/comments`,
      );
      setComments(res.data.comments || []);
    } catch {
      // ignore for now
    } finally {
      setCommentsLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [fetchBlog, fetchComments]);
  const stripHtml = (html?: string): string => {
    if (!html) return "";
    // remove tags
    const text = html.replace(/<[^>]+>/g, " ");
    // collapse whitespace & &nbsp;
    return text
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const shareBlog = async () => {
    try {
      if (!blog) return;

      const textToShare =
        `Check out this blog on SkipCry!\n\n` +
        `"${stripHtml(blog.description || (blog as any).intro || "").slice(0, 150)}..."\n\n` +
        `Read more:${window.location.href}`;

      const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        textToShare,
      )}`;

      const canOpen = await Linking.canOpenURL(whatsappLink);
      if (canOpen) {
        await Linking.openURL(whatsappLink);
        return;
      }

      await Share.share({ message: textToShare });
    } catch (e) {
      // optional: show toast
    }
  };

  const handleToggleLike = async () => {
    if (!blogId || !customerId || isLiking || !blog) return;
    try {
      setIsLiking(true);
      const res = await axiosClient.post<{
        likes: number;
        liked: boolean;
      }>(`/blogs/${blogId}/like`, { customerId });

      setHasLiked(res.data.liked);
      setBlog((prev) => (prev ? { ...prev, likes: res.data.likes } : prev));

      // 🔁 update blogs list cache so list screen shows new likes immediately
      queryClient.setQueryData<Blog[]>(["blogs"], (old) =>
        old
          ? old.map((b) =>
              b.blogId === blog.blogId ? { ...b, likes: res.data.likes } : b,
            )
          : old,
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !blogId || !customerId) return;
    try {
      setCommentSubmitting(true);
      const res = await axiosClient.post<{ comment: Comment }>(
        `/blogs/${blogId}/comment`,
        {
          content: trimmed,
          authorName: customerName,
          customerId,
        },
      );
      setNewComment("");
      setComments((prev) => [res.data.comment, ...prev]);
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="text-gray-600 mt-3">Loading article...</Text>
      </View>
    );
  }

  if (error || !blog) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <BackHeader title="Blog" />
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color="#EF4444"
          style={{ marginTop: 16 }}
        />
        <Text className="text-lg font-semibold text-gray-900 mt-4">
          Failed to load blog
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          {error || "Please try again later."}
        </Text>
      </View>
    );
  }
  const createdAt = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const introHtml = normalizeHtml((blog as any).intro || blog?.description);
  const contentHtml = normalizeHtml(blog?.content);

  const isLoggedIn = !!customerId;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
      <BackHeader title="Blog" />
        
      {/* Container (similar to .container mx-auto p-4 mt-20) */}
        <View className="px-4 mt-4">
          {/* BLOG HEADER SECTION */}
          <View className="mb-6">
            {/* Title */}
            <Text className="text-2xl font-bold mt-2 text-gray-900">
              {blog.title}
            </Text>

            {/* Author + date + share */}
            <View className="mt-2 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-xs text-gray-600">
                    By{" "}
                    <Text className="font-semibold text-black-700">
                      {blog.authorName || (blog as any).author || "Unknown"}
                    </Text>{" "}
                    <Text className="text-gray-400">|</Text>{" "}
                    {createdAt ? (
                      <Text className="text-gray-500">{`  |  ${createdAt}`}</Text>
                    ) : null}
                  </Text>
                </View>

                {/* Share button */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={shareBlog}
                  className="flex-row items-center bg-orange-400 px-3 py-2 rounded-full border border-amber-800"
                  style={{ backgroundColor: "#f59758" }}
                >
                  <View className="w-5 h-5 bg-white rounded-sm items-center justify-center mr-2">
                    <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                  </View>
                  <Text className="text-xs font-semibold text-white">
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Image */}
            {blog.imageUrl ? (
              <View className="items-center my-4">
                <Image
                  source={{ uri: blog.imageUrl }}
                  className="w-full rounded-xl border border-gray-200"
                  style={{ height: 260 }}
                  resizeMode="cover"
                />
              </View>
            ) : null}
          </View>

          {/* MAIN BLOG CONTENT SECTION */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            {/* Intro (blue box) */}
            {introHtml ? (
              <View className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-5">
                <RenderHTML
                  contentWidth={width - 32}
                  source={{ html: introHtml }}
                  baseStyle={{ fontSize: 16, color: "#1e3a8a", lineHeight: 22 }}
                />
              </View>
            ) : null}

            {/* Main content */}
            {contentHtml ? (
              <RenderHTML
                contentWidth={width - 32}
                source={{ html: contentHtml }}
                baseStyle={{ fontSize: 16, color: "#1f2937", lineHeight: 22 }}
              />
            ) : null}

            {/* Like button at end of blog content */}
            <View className="border-t border-gray-200 pt-4 mt-6">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={handleToggleLike}
                  disabled={!isLoggedIn || isLiking}
                  activeOpacity={0.8}
                  className="flex-row items-center"
                >
                  <Ionicons
                    name={hasLiked ? "heart" : "heart-outline"}
                    size={22}
                    color={hasLiked ? "#EF4444" : "#9CA3AF"}
                  />
                  <Text className="ml-2 text-sm text-gray-700">
                    {blog.likes || 0} likes
                  </Text>
                </TouchableOpacity>

                {!isLoggedIn && (
                  <Text className="ml-3 text-xs text-gray-500">
                    Login to like this blog
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* COMMENTS SECTION */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <View className="flex-row items-center mb-4">
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#2563EB"
              />
              <Text className="ml-2 text-xl font-bold text-gray-800">
                Comments
              </Text>
            </View>

            {/* Add comment card */}
            <View className="bg-white p-4 rounded-lg mb-5 shadow-sm border border-gray-200">
              <Text className="text-base font-semibold mb-3 text-gray-700">
                Add a Comment
              </Text>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write your comment here..."
                multiline
                editable={isLoggedIn}
                style={{ textAlignVertical: "top" }}
                className="w-full min-h-[90px] p-3 border border-gray-300 rounded-lg text-sm text-gray-800"
              />
              <View className="flex-row justify-end mt-3">
                <TouchableOpacity
                  onPress={handleAddComment}
                  disabled={
                    !isLoggedIn || !newComment.trim() || commentSubmitting
                  }
                  activeOpacity={0.9}
                  className={`px-5 py-2 rounded-lg shadow ${
                    isLoggedIn && newComment.trim()
                      ? "bg-orange-600"
                      : "bg-gray-400"
                  }`}
                >
                  <Text className="text-white text-sm font-semibold">
                    {isLoggedIn ? "Post Comment" : "Log In to Comment"}
                  </Text>
                </TouchableOpacity>
              </View>
              {!isLoggedIn && (
                <View className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                  <Text className="text-xs text-yellow-800 font-semibold">
                    Please log in to post comments.
                  </Text>
                </View>
              )}
            </View>

            {/* Comments list */}
            {commentsLoading ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : comments.length === 0 ? (
              <View className="items-center py-6">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={40}
                  color="#D1D5DB"
                />
                <Text className="mt-3 text-sm text-gray-500">
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            ) : (
              <View>
                {comments.map((c) => (
                  <View
                    key={c._id || c.createdAt}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-3"
                  >
                    <View className="flex-row items-center mb-2">
                      <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                        <Text className="text-gray-600 font-semibold">
                          {c.authorName?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                      <Text className="font-semibold text-gray-800 mr-1">
                        {c.authorName}
                      </Text>
                      <Text className="text-gray-500 text-xs">•</Text>
                      {c.createdAt && (
                        <Text className="text-gray-500 text-xs ml-1">
                          {new Date(c.createdAt).toLocaleString()}
                        </Text>
                      )}
                    </View>
                    <Text className="text-gray-700 text-sm ml-10">
                      {c.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* OTHER BLOGS / MORE READING */}

          {otherBlogs.length > 0 && (
            <View className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
              <Text className="text-xl font-semibold mb-3 text-blue-800">
                More reading...
              </Text>

              {otherBlogs.map((item) => {
                const introText = stripHtml(
                  item.description || (item as any).intro,
                );

                return (
                  <TouchableOpacity
                    key={item._id || item.blogId}
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push(`/parenting/blog/${item.blogId}` as any)
                    }
                    className="mb-3"
                  >
                    <View className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
                      <Text
                        className="text-sm font-bold text-gray-900 mb-1"
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      {introText ? (
                        <Text
                          className="text-xs text-gray-600"
                          numberOfLines={3}
                        >
                          {introText}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
