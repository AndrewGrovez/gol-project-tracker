"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacebookScheduledPost {
  id: string;
  message?: string;
  scheduled_publish_time?: number;
  created_time: string;
  status?: string;
}

interface InstagramScheduledPost {
  id: string;
  caption?: string;
  timestamp?: string;
  scheduled_publish_time?: number;
  status?: string;
}

interface ScheduleResult {
  scheduledTime: string;
  externalId?: string;
  error?: string;
}

interface PlatformResults {
  facebook?: ScheduleResult[];
  instagram?: ScheduleResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FB_MIN_LEAD_MS = 10 * 60 * 1000;
const IG_MIN_LEAD_MS = 20 * 60 * 1000;
const DEFAULT_LEAD_MS = 60 * 60 * 1000; // 1 hour

const buildDefaultDate = () => new Date(Date.now() + DEFAULT_LEAD_MS);

const roundToNextQuarterHour = (date: Date) => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) rounded.setMinutes(minutes + (15 - remainder));
  rounded.setSeconds(0, 0);
  return rounded;
};

const getTimeBoundsForDate = (selected: Date | null, minLeadMs: number) => {
  if (!selected) return { min: undefined, max: undefined } as const;

  const endOfDay = new Date(selected);
  endOfDay.setHours(23, 45, 0, 0);

  const startOfDay = new Date(selected);
  startOfDay.setHours(0, 0, 0, 0);

  const now = new Date();
  const isToday =
    selected.getFullYear() === now.getFullYear() &&
    selected.getMonth() === now.getMonth() &&
    selected.getDate() === now.getDate();

  if (!isToday) return { min: startOfDay, max: endOfDay } as const;

  const minimumBase = new Date(now.getTime() + minLeadMs);
  const minimum = roundToNextQuarterHour(minimumBase);
  if (minimum > endOfDay) return { min: endOfDay, max: endOfDay } as const;
  return { min: minimum, max: endOfDay } as const;
};

// ─── Component ────────────────────────────────────────────────────────────────

type Platform = "facebook" | "instagram";
type Tab = "facebook" | "instagram";

export default function SocialScheduler() {
  // Form state
  const [message, setMessage] = useState("");
  const [scheduledTimes, setScheduledTimes] = useState<Array<Date | null>>([buildDefaultDate()]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(["facebook", "instagram"]));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "partial"; lines: string[] } | null>(null);

  // Scheduled posts state
  const [activeTab, setActiveTab] = useState<Tab>("facebook");
  const [facebookPosts, setFacebookPosts] = useState<FacebookScheduledPost[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<InstagramScheduledPost[]>([]);
  const [isFetchingFb, setIsFetchingFb] = useState(false);
  const [isFetchingIg, setIsFetchingIg] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [igError, setIgError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMessage("");
    setImageFile(null);
    setScheduledTimes([buildDefaultDate()]);
    setFeedback(null);
  }, []);

  const minLeadMs = platforms.has("instagram") ? IG_MIN_LEAD_MS : FB_MIN_LEAD_MS;

  const validTimes = useMemo(
    () =>
      scheduledTimes.filter(
        (v): v is Date => v instanceof Date && !isNaN(v.getTime())
      ),
    [scheduledTimes]
  );

  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  // ─── Fetch scheduled posts ──────────────────────────────────────────────────

  const fetchFacebookPosts = useCallback(async () => {
    setIsFetchingFb(true);
    setFbError(null);
    try {
      const res = await fetch("/api/facebook/scheduled-posts", { method: "GET", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setFbError(data?.error || "Unable to load Facebook scheduled posts.");
      } else {
        setFacebookPosts(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (err) {
      setFbError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsFetchingFb(false);
    }
  }, []);

  const fetchInstagramPosts = useCallback(async () => {
    setIsFetchingIg(true);
    setIgError(null);
    try {
      const res = await fetch("/api/instagram/scheduled-posts", { method: "GET", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setIgError(data?.error || "Unable to load Instagram scheduled posts.");
      } else {
        setInstagramPosts(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (err) {
      setIgError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsFetchingIg(false);
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchFacebookPosts();
    fetchInstagramPosts();
  }, [fetchFacebookPosts, fetchInstagramPosts]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Schedule handlers ───────────────────────────────────────────────────────

  const handleScheduleChange = (index: number, date: Date | null) => {
    setScheduledTimes((current) => {
      const copy = [...current];
      copy[index] = date;
      return copy;
    });
  };

  const handleAddSchedule = () =>
    setScheduledTimes((current) => [...current, buildDefaultDate()]);

  const handleRemoveSchedule = (index: number) =>
    setScheduledTimes((current) => {
      if (current.length === 1) return current;
      return current.filter((_, i) => i !== index);
    });

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!message.trim()) {
      setFeedback({ type: "error", lines: ["Please enter a message."] });
      return;
    }
    if (validTimes.length === 0) {
      setFeedback({ type: "error", lines: ["Please select at least one future date and time."] });
      return;
    }
    if (platforms.has("instagram") && !imageFile) {
      setFeedback({ type: "error", lines: ["Instagram requires an image. Please attach one or deselect Instagram."] });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("message", message.trim());
      formData.append("scheduledTimes", JSON.stringify(validTimes.map((d) => d.toISOString())));
      formData.append("platforms", JSON.stringify(Array.from(platforms)));
      if (imageFile) formData.append("image", imageFile);

      const response = await fetch("/api/social/schedule", { method: "POST", body: formData });
      const payload = await response.json() as { success?: boolean; error?: string; results?: PlatformResults };

      if (!response.ok && !payload?.results) {
        setFeedback({ type: "error", lines: [payload?.error || "Unable to schedule posts."] });
        return;
      }

      const lines: string[] = [];
      let anyError = false;
      let anySuccess = false;

      const platformResults = payload.results ?? {};

      for (const [platform, results] of Object.entries(platformResults) as [Platform, ScheduleResult[]][]) {
        const label = platform === "facebook" ? "Facebook" : "Instagram";
        for (const result of results) {
          const time = new Date(result.scheduledTime).toLocaleString();
          if (result.error) {
            lines.push(`${label} ${time} — ${result.error}`);
            anyError = true;
          } else {
            lines.push(`${label} ${time} — scheduled`);
            anySuccess = true;
          }
        }
      }

      const type = anyError && anySuccess ? "partial" : anyError ? "error" : "success";
      setFeedback({ type, lines });

      if (anySuccess) {
        resetForm();
        fetchAll();
      }
    } catch (err) {
      setFeedback({ type: "error", lines: [err instanceof Error ? err.message : "Unable to schedule posts."] });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isFetching = activeTab === "facebook" ? isFetchingFb : isFetchingIg;
  const tabError = activeTab === "facebook" ? fbError : igError;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Social Scheduler</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Schedule posts to your Facebook Page and Instagram Business account from one place.
        </p>
      </div>

      {/* Form card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Post details</h2>
              <p className="text-sm text-slate-600">
                Write your post, pick your platforms, and choose when it should go live.
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="message">
                Post message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share updates, promotions, or announcements..."
                rows={5}
              />
            </div>

            {/* Platform toggles */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Platforms</span>
              <div className="flex flex-wrap gap-4">
                {(["facebook", "instagram"] as Platform[]).map((platform) => {
                  const checked = platforms.has(platform);
                  const label = platform === "facebook" ? "Facebook" : "Instagram";
                  return (
                    <label
                      key={platform}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                        checked
                          ? "border-slate-700 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => togglePlatform(platform)}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              {platforms.has("instagram") && (
                <p className="text-xs text-amber-600">
                  Instagram requires an image and schedules at least 20 minutes ahead.
                </p>
              )}
            </div>

            {/* Scheduled times */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Schedule date &amp; time</label>
              <div className="space-y-4">
                {scheduledTimes.map((date, index) => {
                  const bounds = getTimeBoundsForDate(date, minLeadMs);
                  return (
                    <div
                      key={`schedule-${index}`}
                      className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center"
                    >
                      <DatePicker
                        selected={date}
                        onChange={(value) => handleScheduleChange(index, value)}
                        showTimeSelect
                        timeIntervals={15}
                        minDate={new Date()}
                        minTime={bounds.min}
                        maxTime={bounds.max}
                        dateFormat="dd MMM yyyy h:mm aa"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                          "self-start text-red-600 hover:text-red-700",
                          scheduledTimes.length === 1 && "pointer-events-none opacity-50"
                        )}
                        onClick={() => handleRemoveSchedule(index)}
                        disabled={scheduledTimes.length === 1}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button type="button" variant="outline" onClick={handleAddSchedule} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add another time
              </Button>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="image">
                {platforms.has("instagram") ? "Image (required for Instagram)" : "Optional image"}
              </label>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
                {imageFile ? (
                  <span className="text-sm text-slate-600">{imageFile.name}</span>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Upload className="h-4 w-4" /> JPG, PNG, or GIF supported
                  </span>
                )}
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={cn(
                  "rounded-md border px-4 py-3 text-sm",
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : feedback.type === "partial"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-red-200 bg-red-50 text-red-700"
                )}
              >
                {feedback.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Scheduling..." : "Schedule posts"}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm} disabled={isSubmitting}>
                Clear form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Scheduled posts */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Scheduled posts</h2>
              <p className="text-sm text-slate-600">
                Pulled directly from each platform. Refresh after scheduling to see updates.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={fetchAll}
              disabled={isFetchingFb || isFetchingIg}
              className="flex items-center gap-2"
            >
              {isFetchingFb || isFetchingIg ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 border-b border-slate-200">
            {(["facebook", "instagram"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "border-b-2 border-slate-900 text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab === "facebook" ? "Facebook" : "Instagram"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tabError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {tabError}
            </div>
          )}

          {!tabError && isFetching && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading scheduled posts...
            </div>
          )}

          {!isFetching && !tabError && activeTab === "facebook" && facebookPosts.length === 0 && (
            <p className="text-sm text-slate-600">No Facebook scheduled posts found.</p>
          )}

          {!isFetching && !tabError && activeTab === "instagram" && instagramPosts.length === 0 && (
            <p className="text-sm text-slate-600">No Instagram scheduled posts found.</p>
          )}

          {!isFetching && !tabError && activeTab === "facebook" && facebookPosts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Scheduled for</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {facebookPosts.map((post) => {
                    const scheduledDate = post.scheduled_publish_time
                      ? new Date(post.scheduled_publish_time * 1000)
                      : null;
                    const createdDate = post.created_time ? new Date(post.created_time) : null;
                    return (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <td className="max-w-[280px] px-4 py-3 align-top">
                          <p className="whitespace-pre-wrap text-slate-800">{post.message?.trim() || "—"}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {scheduledDate ? format(scheduledDate, "dd MMM yyyy HH:mm") : "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {createdDate ? format(createdDate, "dd MMM yyyy HH:mm") : "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {post.status ? post.status.replace(/_/g, " ") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isFetching && !tabError && activeTab === "instagram" && instagramPosts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Caption</th>
                    <th className="px-4 py-3">Scheduled for</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {instagramPosts.map((post) => {
                    const scheduledDate = post.scheduled_publish_time
                      ? new Date(post.scheduled_publish_time * 1000)
                      : null;
                    return (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <td className="max-w-[280px] px-4 py-3 align-top">
                          <p className="whitespace-pre-wrap text-slate-800">{post.caption?.trim() || "—"}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {scheduledDate ? format(scheduledDate, "dd MMM yyyy HH:mm") : "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {post.status ? post.status.replace(/_/g, " ") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
