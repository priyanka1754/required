// src/features/parenting/hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event, getEvents, getEventById, createEvent, updateEvent, deleteEvent, CreateEventDto, UpdateEventDto } from '../api/eventApi';

export function useEvents() {
  return useQuery<Event[], Error>({
    queryKey: ['parenting', 'events'],
    queryFn: () => getEvents(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEvent(eventId: string | null) {
  return useQuery<Event | null, Error>({
    queryKey: ['parenting', 'event', eventId],
    queryFn: () => getEventById(eventId!),
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEventMutation() {
  const qc = useQueryClient();

  return useMutation<Event, Error, CreateEventDto>({
    mutationFn: (data) => createEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parenting', 'events'] });
    },
  });
}

export function useUpdateEventMutation() {
  const qc = useQueryClient();

  return useMutation<Event, Error, { id: string; data: UpdateEventDto }>({
    mutationFn: ({ id, data }) => updateEvent(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['parenting', 'events'] });
      qc.invalidateQueries({ queryKey: ['parenting', 'event', vars.id] });
    },
  });
}

export function useDeleteEventMutation() {
  const qc = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteEvent(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['parenting', 'events'] });
      qc.invalidateQueries({ queryKey: ['parenting', 'event', vars.id] });
    },
  });
}

export default useEvents;
