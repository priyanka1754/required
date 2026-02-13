// src/features/parenting/screens/EventDetailsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Share,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  getEventById,
  Event,
  getEventComments,
  addEventComment,
  Comment as EventComment,
  toggleEventCommentLike,
  addEventReply,
} from "../api/eventApi";
import Button from "@/components/Button";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

const EventDetailsScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "comments">(
    "description",
  );
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const hostName = event?.hostName || "Host";
  const hostAvatar = (event?.host as any)?.avatar || "";

  useEffect(() => {
    const loadComments = async () => {
      if (!id) return;
      try {
        setCommentsLoading(true);
        const data = await getEventComments(String(id));
        setComments(data || []);
      } catch {
        // optional: ignore or set an error
      } finally {
        setCommentsLoading(false);
      }
    };
    loadComments();
  }, [id]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        setError(null);
        const data = await getEventById(String(id));
        setEvent(data);
      } catch (err: any) {
        console.error("Failed to fetch event", err);
        setError(err?.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="text-gray-600 mt-4">Loading event...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-red-600 mb-2">
          Failed to load event
        </Text>
        <Text className="text-gray-600 text-center mb-4">
          {error || "Event not found"}
        </Text>
        <Button title="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const startDate = new Date(event.date);

  const fullDateLabel = startDate
    ? startDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date TBD";

  const locationLabel =
    event.eventType === "Online"
      ? event.meetingLink || "Online event"
      : event.venue || event.city || "Location TBD";

  const handleShare = (eventData: any) => {
  const shareText =
`Hello 👋
I found this event: ${eventData.title}

Check it out here 👇
${window.location.href}`;

  const whatsappLink =
    `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  window.open(whatsappLink, "_blank");
};


  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    if (!user?._id) {
      Alert.alert("Login required", "Please login to comment.");
      return;
    }

    try {
      setCommentSubmitting(true);
      const created = await addEventComment(
        String(id),
        commentText.trim(),
        user._id,
        user.Name,
        user.avatar,
      );
      setComments((prev) => [...prev, created]);
      setCommentText("");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (!user?._id) {
      Alert.alert("Login required", "Please login to like comments.");
      return;
    }
    const userId = user._id as string;
    try {
      const result = await toggleEventCommentLike(
        String(id),
        commentId,
        userId,
      );
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, likes: updateLikesArray(c.likes, userId, result.liked) }
            : c,
        ),
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to toggle like");
    }
  };

  const updateLikesArray = (
    likes: string[] = [],
    userId: string,
    liked: boolean,
  ) => {
    if (liked) {
      if (likes.includes(userId)) return likes;
      return [...likes, userId];
    } else {
      return likes.filter((id) => id !== userId);
    }
  };
  const handleStartReply = (commentId: string) => {
    setReplyingToId(commentId);
    setReplyText("");
  };

  const handleSubmitReply = async () => {
    if (!replyingToId || !replyText.trim()) return;
    if (!user?._id) {
      Alert.alert("Login required", "Please login to reply.");
      return;
    }

    const userId = user._id as string;

    try {
      setReplySubmitting(true);
      const newReply = await addEventReply(
        String(id),
        replyingToId,
        replyText.trim(),
        userId,
        user.Name,
        user.avatar,
      );

      setComments((prev) =>
        prev.map((c) =>
          c._id === replyingToId
            ? { ...c, replies: [...(c.replies || []), newReply] }
            : c,
        ),
      );
      setReplyText("");
      setReplyingToId(null);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to add reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER BAR */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="pr-2">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-semibold text-gray-900"
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity onPress={() => handleShare(event)}>
            <Ionicons name="share-social-outline" size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER */}
        <View className="bg-white">
          {event.posterUrl ? (
            <Image
              source={{ uri: event.posterUrl }}
              className="w-full h-56"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-56 bg-gray-200 items-center justify-center">
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              <Text className="text-xs text-gray-500 mt-1">Event poster</Text>
            </View>
          )}
        </View>

        {/* TITLE + TAGS */}
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-2">
            {event.title}
          </Text>
          {/* Host row */}
          <View className="flex-row items-center mb-2">
            {hostAvatar ? (
              <Image
                source={{ uri: hostAvatar }}
                className="w-8 h-8 rounded-full mr-2"
              />
            ) : (
              <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2">
                <Ionicons name="person-outline" size={18} color="#6B7280" />
              </View>
            )}
            <Text className="text-xs text-gray-700">
              Hosted by <Text className="font-semibold">{hostName}</Text>
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            <View className="px-2 py-1 mr-2 mb-2 rounded-full bg-gray-900">
              <Text className="text-xs text-white">
                {event.category || "Event"}
              </Text>
            </View>
            <View className="px-2 py-1 mr-2 mb-2 rounded-full bg-gray-100">
              <Text className="text-xs text-gray-800">
                {event.eventType === "Online" ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>

        {/* INTEREST / CTA ROW (simple version) */}
        {/* <View className="bg-white px-4 py-3 mt-2 border-y border-gray-100 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="thumbs-up-outline" size={18} color="#16A34A" />
            <View className="ml-2">
              <Text className="text-sm font-semibold text-gray-900">
                Interested?
              </Text>
              <Text className="text-xs text-gray-500">
                Mark interested to stay updated about this event.
              </Text>
            </View>
          </View> */}
        {/* <TouchableOpacity className="px-3 py-1.5 rounded-full border border-rose-400">
            <Text className="text-xs font-medium text-rose-500">
              Interested
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* DETAILS LIST */}
        <View className="bg-white mt-2 px-4 py-4 space-y-3">
          {/* Date & time */}
          <View className="flex-row items-start mb-2">
            <Ionicons name="calendar-outline" size={18} color="#4B5563" />
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-900">{fullDateLabel}</Text>
              {event.time && (
                <Text className="text-xs text-gray-600 mt-0.5">
                  {event.time} onward
                  {event.duration
                    ? ` · ${event.duration} hour${event.duration > 1 ? "s" : ""}`
                    : ""}
                </Text>
              )}
            </View>
          </View>

          {/* Duration */}
          {event.duration && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={18} color="#4B5563" />
              <Text className="ml-3 text-sm text-gray-900">
                {event.duration} hour{event.duration > 1 ? "s" : ""}{" "}
              </Text>
            </View>
          )}

          {/* Language (optional static for now) */}
          {/* <View className="flex-row items-center mb-2">
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4B5563" />
            <Text className="ml-3 text-sm text-gray-900">English</Text>
          </View> */}

          {/* Category */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="pricetag-outline" size={18} color="#4B5563" />
            <Text className="ml-3 text-sm text-gray-900">{event.category}</Text>
          </View>

          {/* Location */}
          <View className="flex-row items-start mb-2">
            <Ionicons
              name={
                event.eventType === "Online"
                  ? "videocam-outline"
                  : "location-outline"
              }
              size={18}
              color="#4B5563"
            />
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-900">{locationLabel}</Text>
              {event.city && event.eventType !== "Online" && (
                <Text className="text-xs text-gray-500 mt-0.5">
                  {event.city}
                </Text>
              )}
            </View>
          </View>

          {/* Price */}
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={18} color="#4B5563" />
            <Text className="ml-3 text-sm text-gray-900">
              {event.isFree
                ? "Free entry"
                : event.price
                  ? `₹${event.price}`
                  : "Paid event"}
            </Text>
          </View>
        </View>

        {/* TABS + CONTENT */}
        <View className="bg-white mt-2 mx-3 rounded-t-xl overflow-hidden">
          {/* Tabs header */}
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 py-3 items-center border-b ${
                activeTab === "description"
                  ? "bg-orange-500 border-orange-500"
                  : "bg-orange-50 border-orange-200"
              }`}
              onPress={() => setActiveTab("description")}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "description" ? "text-white" : "text-orange-600"
                }`}
              >
                Description
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 items-center border-b ${
                activeTab === "comments"
                  ? "bg-orange-500 border-orange-500"
                  : "bg-orange-50 border-orange-200"
              }`}
              onPress={() => setActiveTab("comments")}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "comments" ? "text-white" : "text-orange-600"
                }`}
              >
                Comments
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab body */}
          {activeTab === "description" ? (
            <View className="px-4 py-4">
              <Text className="text-sm text-gray-700 leading-5">
                {event.description}
              </Text>
            </View>
          ) : (
            <View className="px-4 py-4">
              <Text className="text-sm font-semibold text-orange-700 mb-2">
                Comments &amp; Q&amp;A
              </Text>

              {/* Input row */}
              <View className="flex-row items-center mb-3">
                <View className="flex-1 mr-2 bg-orange-50 rounded-lg border border-orange-100 px-3">
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Ask a question or comment..."
                    placeholderTextColor="#F97316AA"
                    className="py-2 text-sm text-gray-800"
                  />
                </View>
                <TouchableOpacity
                  onPress={handlePostComment}
                  disabled={commentSubmitting || !commentText.trim()}
                  className={`px-4 py-2 rounded-lg ${
                    commentSubmitting || !commentText.trim()
                      ? "bg-orange-300"
                      : "bg-orange-500"
                  }`}
                >
                  <Text className="text-sm font-semibold text-white">
                    {commentSubmitting ? "Posting..." : "Post"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Comments list */}
              {commentsLoading ? (
                <Text className="text-xs text-gray-500 mt-2">
                  Loading comments...
                </Text>
              ) : comments.length === 0 ? (
                <Text className="text-xs text-gray-500 mt-2">
                  No comments yet.
                </Text>
              ) : (
                comments.map((c) => (
                  <View key={c._id} className="mb-3">
                    {/* top row: avatar + name + time */}
                    <View className="flex-row items-center">
                      {c.authorAvatar ? (
                        <Image
                          source={{ uri: c.authorAvatar }}
                          className="w-7 h-7 rounded-full mr-2"
                        />
                      ) : (
                        <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center mr-2">
                          <Ionicons
                            name="person-outline"
                            size={16}
                            color="#6B7280"
                          />
                        </View>
                      )}

                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-gray-800">
                          {c.authorName || "User"}
                        </Text>
                        {c.createdAt && (
                          <Text className="text-[10px] text-gray-500">
                            {new Date(c.createdAt).toLocaleString("en-IN", {
                              month: "numeric",
                              day: "numeric",
                              year: "2-digit",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* comment text */}
                    <Text className="mt-1 ml-9 text-sm text-gray-800">
                      {c.comment}
                    </Text>

                    {/* like / reply row */}
                    <View className="flex-row items-center ml-9 mt-1 space-x-4">
                      <TouchableOpacity
                        onPress={() => handleToggleLike(c._id)}
                        className="flex-row items-center"
                      >
                        <Ionicons
                          name={
                            c.likes?.includes(user?._id || "")
                              ? "thumbs-up"
                              : "thumbs-up-outline"
                          }
                          size={14}
                          color="#EA580C"
                        />
                        <Text className="ml-1 text-xs text-orange-600 font-medium">
                          Like{c.likes?.length ? ` (${c.likes.length})` : ""}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleStartReply(c._id)}
                        className="flex-row items-center"
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={14}
                          color="#EA580C"
                        />
                        <Text className="ml-1 text-xs text-orange-600 font-medium">
                          Reply
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* replies (nested) */}
                    {c.replies && c.replies.length > 0 && (
                      <View className="mt-2 ml-9">
                        {c.replies.map((r) => (
                          <View key={r._id} className="mb-2">
                            <View className="flex-row items-center">
                              {r.authorAvatar ? (
                                <Image
                                  source={{ uri: r.authorAvatar }}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                              ) : (
                                <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-2">
                                  <Ionicons
                                    name="person-outline"
                                    size={14}
                                    color="#6B7280"
                                  />
                                </View>
                              )}

                              <View className="flex-1">
                                <Text className="text-[11px] font-semibold text-gray-800">
                                  {r.authorName || "User"}
                                </Text>
                                {r.createdAt && (
                                  <Text className="text-[10px] text-gray-500">
                                    {new Date(r.createdAt).toLocaleString(
                                      "en-IN",
                                      {
                                        month: "numeric",
                                        day: "numeric",
                                        year: "2-digit",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </Text>
                                )}
                              </View>
                            </View>

                            <Text className="mt-0.5 ml-8 text-xs text-gray-800">
                              {r.comment}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* reply input for this comment */}
                    {replyingToId === c._id && (
                      <View className="ml-9 mt-2">
                        <View className="flex-row items-center">
                          <View className="flex-1 mr-2 bg-orange-50 rounded-lg border border-orange-100 px-3">
                            <TextInput
                              value={replyText}
                              onChangeText={setReplyText}
                              placeholder="Write a reply..."
                              placeholderTextColor="#F97316AA"
                              className="py-2 text-sm text-gray-800"
                            />
                          </View>
                          <TouchableOpacity
                            onPress={handleSubmitReply}
                            disabled={replySubmitting || !replyText.trim()}
                            className={`px-3 py-2 rounded-lg ${
                              replySubmitting || !replyText.trim()
                                ? "bg-orange-300"
                                : "bg-orange-500"
                            }`}
                          >
                            <Text className="text-xs font-semibold text-white">
                              {replySubmitting ? "Replying..." : "Reply"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default EventDetailsScreen;
