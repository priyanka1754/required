// src/features/parenting/screens/EventFeedScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { getEvents, Event } from "../api/eventApi";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Ionicons from "@expo/vector-icons/Ionicons";
import BackHeader from "../components/BackHeader";

type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed';

const EventFeedScreen: React.FC = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);  // ✅ Store all events
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);  // ✅ Filtered events
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus>('Upcoming');  // ✅ Filter state
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setError(null);
        const data = await getEvents();
        setAllEvents(data);
        // Apply default filter
        filterEventsByStatus(data, 'Upcoming');
      } catch (err: any) {
        console.error("Failed to fetch events:", err);
        setError(err?.message || "Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // ✅ Filter events by status
  const filterEventsByStatus = (events: Event[], status: EventStatus) => {
    const filtered = events.filter(event => event.status === status);
    setFilteredEvents(filtered);
    setSelectedStatus(status);
  };

  const handleEventPress = (eventId: string) => {
    // ✅ Use eventId instead of _id
    router.push(`/parenting/event/${eventId}` as any);
  };

  const handleCreateEvent = () => {
    router.push("/parenting/create-event" as any);
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const eventDate = new Date(item.date);
    const dayLabel = eventDate
      ? eventDate.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })
      : "";
    
    // ✅ Use hostId as string (no more host object)
    const hostName = item.hostName || "Host";
    const locationLabel =
      item.venue ||
      item.city ||
      (item.eventType === "Online" ? "Online" : "Location TBD");

    return (
      <TouchableOpacity
        onPress={() => handleEventPress(item.eventId)}  // ✅ Use eventId
        className="flex-1 px-1 mb-4"
      >
        <Card className="overflow-hidden rounded-xl bg-white">
          {/* Poster */}
          {item.posterUrl ? (
            <Image
              source={{ uri: item.posterUrl }}
              className="w-full h-40"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-40 bg-gray-200 items-center justify-center">
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
              <Text className="text-xs text-gray-500 mt-1">No poster</Text>
            </View>
          )}

          {/* Info */}
          <View className="px-3 py-2">
            {/* Date row */}
            <Text className="text-xs font-semibold text-gray-700">
              {dayLabel || "Date TBD"}
              {item.time ? ` · ${item.time}` : ""}
            </Text>

            {/* Title */}
            <Text
              className="text-sm font-semibold text-gray-900 mt-1"
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {/* Host */}
            <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
              Host: {hostName}
            </Text>

            {/* Location */}
            <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
              {locationLabel}
            </Text>

            {/* Category + type + status */}
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {item.category}
              </Text>
              <View className="flex-row gap-1">
                {/* Status badge */}
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    item.status === 'Upcoming'
                      ? 'bg-blue-50'
                      : item.status === 'Ongoing'
                      ? 'bg-green-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${
                      item.status === 'Upcoming'
                        ? 'text-blue-700'
                        : item.status === 'Ongoing'
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                {/* Event type badge */}
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    item.eventType === "Online" ? "bg-orange-50" : "bg-purple-50"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${
                      item.eventType === "Online"
                        ? "text-orange-700"
                        : "text-purple-700"
                    }`}
                  >
                    {item.eventType.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="text-gray-600 mt-4">Loading events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-red-600 mb-2">
          Failed to load events
        </Text>
        <Text className="text-gray-600 text-center mb-4">{error}</Text>
        <Button
          title="Retry"
          onPress={async () => {
            try {
              setLoading(true);
              setError(null);
              const data = await getEvents();
              setAllEvents(data);
              filterEventsByStatus(data, selectedStatus);
            } catch (err: any) {
              setError(err?.message || "Failed to fetch events");
            } finally {
              setLoading(false);
            }
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <BackHeader title="Events" />

      {/* ✅ Status Filter */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row gap-2">
          {(['Upcoming', 'Ongoing', 'Completed'] as EventStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => filterEventsByStatus(allEvents, status)}
              className={`px-4 py-2 rounded-full ${
                selectedStatus === status
                  ? 'bg-orange-500'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedStatus === status
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-xs text-gray-500 mt-2">
          {filteredEvents.length} {selectedStatus.toLowerCase()} event{filteredEvents.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Grid List */}
      <FlatList
        data={filteredEvents}  // ✅ Use filtered events
        key={"events-2-columns"}
        keyExtractor={(item) => item.eventId}  // ✅ Use eventId
        renderItem={renderEventCard}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="bg-orange-50 border border-orange-200 rounded-2xl p-6 items-center mt-8 mx-4">
            <Ionicons name="calendar-outline" size={48} color="#FB923C" />
            <Text className="text-lg font-semibold text-gray-900 mt-2">
              No {selectedStatus.toLowerCase()} events
            </Text>
            <Text className="text-sm text-gray-600 text-center mt-1">
              There are no {selectedStatus.toLowerCase()} events at the moment
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default EventFeedScreen;
