"use client";

/*
 * TanStack Query hooks over the typed client. Components use these hooks and
 * never call fetch or `api` directly.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { AnswerInput, CompletedAttempt } from "./types";

export const queryKeys = {
  days: ["days"] as const,
  day: (day: number) => ["day", day] as const,
  progress: ["progress"] as const,
  vocabulary: ["vocabulary"] as const,
  dailyReview: ["review", "daily"] as const,
  mixedReview: ["review", "mixed"] as const,
  runResult: (day: number) => ["run-result", day] as const,
};

export function useDays() {
  return useQuery({ queryKey: queryKeys.days, queryFn: api.listDays });
}

export function useDay(day: number) {
  return useQuery({ queryKey: queryKeys.day(day), queryFn: () => api.getDay(day) });
}

export function useProgress() {
  return useQuery({ queryKey: queryKeys.progress, queryFn: api.progress });
}

export function useVocabulary() {
  return useQuery({ queryKey: queryKeys.vocabulary, queryFn: api.vocabulary });
}

export function useReview(mode: "daily" | "mixed") {
  return useQuery({
    queryKey: mode === "daily" ? queryKeys.dailyReview : queryKeys.mixedReview,
    queryFn: mode === "daily" ? api.dailyReview : api.mixedReview,
    gcTime: 0,
  });
}

export function useStartAttempt(day: number) {
  return useMutation({ mutationFn: () => api.startAttempt(day) });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: ({ attemptId, input }: { attemptId: string; input: AnswerInput }) => api.submitAnswer(attemptId, input),
  });
}

export function useCompleteAttempt(day: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => api.completeAttempt(attemptId),
    onSuccess: async (result: CompletedAttempt) => {
      queryClient.setQueryData(queryKeys.runResult(day), result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.days }),
        queryClient.invalidateQueries({ queryKey: queryKeys.day(day) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progress }),
      ]);
    },
  });
}

export function useSubmitReviewAnswer() {
  return useMutation({ mutationFn: (input: AnswerInput) => api.submitReviewAnswer(input) });
}

export function useRatePronunciation() {
  return useMutation({
    mutationFn: (input: Parameters<typeof api.ratePronunciation>[0]) => api.ratePronunciation(input),
  });
}
