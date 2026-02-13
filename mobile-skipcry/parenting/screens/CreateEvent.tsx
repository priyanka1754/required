// src/features/parenting/screens/CreateEventScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
// NOTE: expo-image-picker requires native build. Disabled for now.
// TODO: Re-enable when building native apps
import Button from '@/components/Button';
import axiosClient from '@/lib/axiosClient';
import { createEvent, CreateEventDto, EventCategory, EventType } from '../api/eventApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const categories: EventCategory[] = [
  'Workshop',
  'Kids Activity',
  'Meetup',
  'Webinar',
  'Health',
  'Education',
];

const eventTypes: EventType[] = ['Online', 'Offline'];

const CreateEventScreen: React.FC = () => {
  const router = useRouter();
const user = useSelector((state: RootState) => state.auth.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Workshop');
  const [eventType, setEventType] = useState<EventType>('Online');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [posterLocalUri, setPosterLocalUri] = useState<string | null>(null);
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterUrl, setPosterUrl] = useState(''); // final S3 URL

  const pickPoster = async () => {
    // Image picker requires native build - disabled for now
    Alert.alert(
      'Not Available',
      'Image picking is currently disabled. This feature requires a native app build.',
      [{ text: 'OK' }]
    );
  };

  const removePoster = () => {
    setPosterLocalUri(null);
    setPosterUrl('');
  };

  const uploadPosterIfNeeded = async (): Promise<string | null> => {
    if (!posterLocalUri) return posterUrl || null;

    try {
      setPosterUploading(true);
      const mime = 'image/jpeg'; // or detect from file if needed

      // 1) Get presigned URL for events poster
      const presigned = await axiosClient.get('/parenting/events/presigned-url', {
        params: { type: 'eventPoster', fileType: mime },
      });
      const { uploadUrl, publicUrl } = presigned.data;

      // 2) Upload file to S3
      const fileResp = await fetch(posterLocalUri);
      const blob = await fileResp.blob();

      const uploadResp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mime },
        body: blob,
      });

      if (!uploadResp.ok) {
        throw new Error('Failed to upload event poster');
      }

      setPosterUrl(publicUrl);
      return publicUrl;
    } catch (e: any) {
      Alert.alert('Upload error', e?.message || 'Failed to upload poster image');
      return null;
    } finally {
      setPosterUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?._id) {
  Alert.alert('Error', 'User not logged in');
  return;
}
    if (!title.trim() || !description.trim() || !date || !time) {
      Alert.alert('Missing fields', 'Please fill title, description, date and time.');
      return;
    }

    if (!isFree && (!price || Number(price) <= 0)) {
      Alert.alert('Invalid price', 'Please enter a valid ticket price for paid events.');
      return;
    }

    const finalPosterUrl = await uploadPosterIfNeeded();
    if (posterLocalUri && !finalPosterUrl) {
      // user selected an image but upload failed
      return;
    }

    const payload: CreateEventDto = {
      title: title.trim(),
      description: description.trim(),
      category,
      eventType,
      date,
      time,
      duration: duration ? Number(duration) : undefined,
      city: city.trim() || undefined,
      venue: eventType === 'Offline' ? venue.trim() || undefined : undefined,
      meetingLink: eventType === 'Online' ? meetingLink.trim() || undefined : undefined,
      posterUrl: finalPosterUrl || undefined,
      maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      isFree,
      ...(isFree ? {} : { price: Number(price) }),
      hostId: user._id,
    };

    try {
      setSubmitting(true);
      const created = await createEvent(payload);
      router.replace(`/parenting/event/${created._id}` as any);
    } catch (err: any) {
      console.error('Failed to create event', err);
      Alert.alert('Error', err?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Create Event
        </Text>

        {/* Title */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
            className="bg-white rounded-lg px-3 py-2 border border-gray-200"
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the event"
            className="bg-white rounded-lg px-3 py-2 border border-gray-200"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <Text
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-3 py-1 mr-2 rounded-full text-sm ${
                  category === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {cat}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Event Type */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Event type
          </Text>
          <View className="flex-row">
            {eventTypes.map((type) => (
              <Text
                key={type}
                onPress={() => setEventType(type)}
                className={`px-3 py-1 mr-2 rounded-full text-sm ${
                  eventType === type
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {type}
              </Text>
            ))}
          </View>
        </View>

        {/* Venue / Meeting Link */}
        {eventType === 'Offline' ? (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Venue
            </Text>
            <TextInput
              value={venue}
              onChangeText={setVenue}
              placeholder="Community center, park, etc."
              className="bg-white rounded-lg px-3 py-2 border border-gray-200"
            />
          </View>
        ) : (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Meeting link
            </Text>
            <TextInput
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder="Zoom / Google Meet link"
              className="bg-white rounded-lg px-3 py-2 border border-gray-200"
            />
          </View>
        )}

        {/* Date & Time */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="2025-02-10"
            className="bg-white rounded-lg px-3 py-2 border border-gray-200"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Time (HH:mm)
          </Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="14:30"
            className="bg-white rounded-lg px-3 py-2 border border-gray-200"
          />
        </View>

        {/* Duration */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Duration (hours)
          </Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="2"
            keyboardType="numeric"
            className="bg-white rounded-lg px-3 py-2 border border-gray-200"
          />
        </View>

        {/* City */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            City
          </Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Hyderabad"
            className="bg-white rounded-lg px-3 py-2 border border-gray-200"
          />
        </View>

        {/* Poster Upload */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Event poster
          </Text>
          {posterLocalUri ? (
            <View className="mb-2">
              <Image
                source={{ uri: posterLocalUri }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
              <View className="flex-row mt-2 space-x-3">
                <TouchableOpacity
                  onPress={pickPoster}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300"
                  disabled={posterUploading}
                >
                  <Text className="text-sm text-gray-700">
                    {posterUploading ? 'Uploading...' : 'Change image'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={removePoster}
                  className="px-3 py-2 rounded-lg bg-red-50 border border-red-200"
                  disabled={posterUploading}
                >
                  <Text className="text-sm text-red-600">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickPoster}
              className="px-4 py-3 rounded-lg bg-white border border-dashed border-gray-300 items-center justify-center"
              disabled={posterUploading}
            >
              {posterUploading ? (
                <ActivityIndicator size="small" color="#4B5563" />
              ) : (
                <Text className="text-sm text-gray-600">
                  Tap to upload event poster
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Free / Paid */}
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-gray-700">
              Free event
            </Text>
            <Text className="text-xs text-gray-500">
              Turn off to set a ticket price
            </Text>
          </View>
          <Switch value={isFree} onValueChange={setIsFree} />
        </View>

        {!isFree && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Ticket price
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="250"
              keyboardType="numeric"
              className="bg-white rounded-lg px-3 py-2 border border-gray-200"
            />
          </View>
        )}

        {/* Max attendees */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Max attendees (optional)
          </Text>
          <TextInput
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            placeholder="e.g. 20"
            keyboardType="numeric"
            className="bg-white rounded-lg px-3 py-2 border border-gray-200"
          />
        </View>
      </ScrollView>
      

      {/* Action Buttons - Fixed Footer */}
      <View className="absolute bottom-0 left-0 right-0 flex-row bg-white border-t border-gray-200 px-4 py-4 space-x-3">
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={submitting || posterUploading}
          className="flex-1 py-3 border border-gray-300 rounded-lg items-center justify-center"
        >
          <Text className="text-gray-700 font-medium">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || posterUploading}
          className={`flex-1 py-3 rounded-lg items-center justify-center flex-row ${
            !submitting && !posterUploading ? 'bg-orange-500' : 'bg-gray-300'
          }`}
        >
          {(submitting || posterUploading) && (
            <ActivityIndicator
              size="small"
              color="white"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className={`font-medium ${
              submitting || posterUploading ? 'text-gray-500' : 'text-white'
            }`}
          >
            {submitting || posterUploading ? 'Creating...' : 'Create event'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreateEventScreen;
