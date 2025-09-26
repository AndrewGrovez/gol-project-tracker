"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckSquare, Instagram, Loader2, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

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
  media_type?: string;
  media_url?: string;
  permalink?: string;
  scheduled_publish_time?: number;
  status?: string;
}

interface ScheduleResult {
  platform: "facebook" | "instagram";
  scheduledTime: string;
  externalId?: string;
  error?: string;
}

const DEFAULT_LEAD_MS = 60 * 60 * 1000; // 1 hour

const buildDefaultDate = () => new Date(Date.now() + DEFAULT_LEAD_MS);

const roundToNextQuarterHour = (date: Date) => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) {
    rounded.setMinutes(minutes + (15 - remainder));
  }
  rounded.setSeconds(0, 0);
  return rounded;
};

const getTimeBoundsForDate = (selected: Date | null) => {
  if (!selected) return { min: undefined, max: undefined } as const;

  const startOfDay = new Date(selected);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selected);
  endOfDay.setHours(23, 45, 0, 0);

  const now = new Date();
  const isToday =
    selected.getFullYear() === now.getFullYear() &&
    selected.getMonth() === now.getMonth() &&
    selected.getDate() === now.getDate();

  if (!isToday) {
    return { min: startOfDay, max: endOfDay } as const;
  }

  const minimumBase = new Date(selected);
  minimumBase.setHours(now.getHours(), now.getMinutes(), 0, 0);
  const minimum = roundToNextQuarterHour(minimumBase);
  if (minimum > endOfDay) {
    return { min: endOfDay, max: endOfDay } as const;
  }
  return { min: minimum, max: endOfDay } as const;
};

export default function FacebookScheduler() {
  const [message, setMessage] = useState("");
  const [scheduledTimes, setScheduledTimes] = useState<Array<Date | null>>([
    buildDefaultDate(),
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [platforms, setPlatforms] = useState({ facebook: true, instagram: false });

  const [facebookPosts, setFacebookPosts] = useState<FacebookScheduledPost[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<InstagramScheduledPost[]>([]);
  const [isFetchingFacebook, setIsFetchingFacebook] = useState(false);
  const [isFetchingInstagram, setIsFetchingInstagram] = useState(false);
  const [facebookError, setFacebookError] = useState<string | null>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMessage("");
    setImageFile(null);
    setScheduledTimes([buildDefaultDate()]);
  }, []);

  const validTimes = useMemo(
    () => scheduledTimes.filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime())),
    [scheduledTimes]
  );

  const fetchScheduledPosts = useCallback(async () => {
    setIsFetchingFacebook(true);
    setIsFetchingInstagram(true);
    setFacebookError(null);
    setInstagramError(null);
    try {
      const [facebookResponse, instagramResponse] = await Promise.all([
        fetch("/api/facebook/scheduled-posts", { method: "GET", cache: "no-store" }),
        fetch("/api/instagram/scheduled-posts", { method: "GET", cache: "no-store" }),
      ]);

      const facebookData = await facebookResponse.json();
      const instagramData = await instagramResponse.json();

      if (!facebookResponse.ok) {
        setFacebookError(facebookData?.error || "Unable to load Facebook scheduled posts.");
      } else {
        setFacebookPosts(Array.isArray(facebookData?.data) ? facebookData.data : []);
      }

      if (!instagramResponse.ok) {
        setInstagramError(instagramData?.error || "Unable to load Instagram scheduled posts.");
      } else {
        setInstagramPosts(Array.isArray(instagramData?.data) ? instagramData.data : []);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setFacebookError(message);
      setInstagramError(message);
    } finally {
      setIsFetchingFacebook(false);
      setIsFetchingInstagram(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledPosts();
  }, [fetchScheduledPosts]);

  const handleScheduleChange = (index: number, date: Date | null) => {
    setScheduledTimes((current) => {
      const copy = [...current];
      copy[index] = date;
      return copy;
    });
  };

  const handleAddSchedule = () => {
    setScheduledTimes((current) => [...current, buildDefaultDate()]);
  };

  const handleRemoveSchedule = (index: number) => {
    setScheduledTimes((current) => {
      if (current.length === 1) return current;
      return current.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const selectedPlatforms = Object.entries(platforms)
      .filter(([, enabled]) => enabled)
      .map(([platform]) => platform);

    if (selectedPlatforms.length === 0) {
      setFeedback({ type: "error", message: "Select at least one platform to schedule." });
      return;
    }

    if (!message.trim()) {
      setFeedback({ type: "error", message: "Please enter a message for the post." });
      return;
    }

    if (validTimes.length === 0) {
      setFeedback({ type: "error", message: "Please select at least one future date and time." });
      return;
    }

    if (platforms.instagram && !imageFile) {
      setFeedback({ type: "error", message: "Instagram scheduling requires an image upload." });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("message", message.trim());
      formData.append(
        "scheduledTimes",
        JSON.stringify(validTimes.map((date) => date.toISOString()))
      );
      if (imageFile) {
        formData.append("image", imageFile);
      }
      formData.append("platforms", JSON.stringify(selectedPlatforms));

      const response = await fetch("/api/facebook/schedule", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        const errors: string[] = Array.isArray(payload?.results)
          ? (payload.results as ScheduleResult[])
              .filter((result) => result.error)
              .map((result) =>
                `${result.platform.toUpperCase()} · ${new Date(result.scheduledTime).toLocaleString()} — ${result.error}`
              )
          : [];
        const errorMessage = errors.length > 0
          ? `Some schedules failed:\n${errors.join("\n")}`
          : payload?.error || "Unable to schedule posts.";
        setFeedback({ type: "error", message: errorMessage });
        return;
      }

      const successful = Array.isArray(payload?.results)
        ? (payload.results as ScheduleResult[]).filter((result) => !result.error)
        : [];

      const successSummary = successful.reduce<Record<string, number>>((accumulator, result) => {
        accumulator[result.platform] = (accumulator[result.platform] || 0) + 1;
        return accumulator;
      }, {});

      const successMessage = Object.entries(successSummary)
        .map(([platform, count]) => `${platform.toUpperCase()}: ${count}`)
        .join(" · ");

      setFeedback({
        type: "success",
        message: successSummary && Object.keys(successSummary).length > 0
          ? `Scheduled successfully — ${successMessage}`
          : "Request completed.",
      });
      resetForm();
      fetchScheduledPosts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to schedule posts.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 p-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Facebook Scheduler</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Create scheduled posts for your Facebook Page. Provide the post text, optionally add an image,
          and pick every date/time you want the content to go live.
        </p>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select platforms</h2>
              <p className="text-sm text-slate-600">Choose where your scheduled post should be published.</p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={platforms.facebook}
                    onChange={(event) =>
                      setPlatforms((current) => ({ ...current, facebook: event.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-4 w-4" /> Facebook Page
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={platforms.instagram}
                    onChange={(event) =>
                      setPlatforms((current) => ({ ...current, instagram: event.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="flex items-center gap-1">
                    <Instagram className="h-4 w-4" /> Instagram Business Account
                  </span>
                  <span className="text-xs font-normal text-slate-500">
                    Requires an image upload
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="message">
                Post message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share updates, promotions, or announcements..."
                rows={5}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Schedule date & time
              </label>
              <div className="space-y-4">
                {scheduledTimes.map((date, index) => {
                  const bounds = getTimeBoundsForDate(date);

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
                      className={cn("self-start text-red-600 hover:text-red-700", scheduledTimes.length === 1 && "pointer-events-none opacity-50")}
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="image">
                Optional image
              </label>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImageFile(file);
                  }}
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

            {feedback && (
              <div
                className={cn(
                  "rounded-md border px-4 py-3 text-sm",
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                )}
              >
                {feedback.message.split("\n").map((line, index) => (
                  <p key={`feedback-${index}`}>{line}</p>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Scheduling..." : "Schedule posts"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Clear form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Scheduled posts</h2>
              <p className="text-sm text-slate-600">
                Latest 50 scheduled posts pulled directly from Facebook and Instagram. Refresh after scheduling to
                view updates.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={fetchScheduledPosts}
              disabled={isFetchingFacebook || isFetchingInstagram}
              className="flex items-center gap-2"
            >
              {isFetchingFacebook || isFetchingInstagram ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-900">Facebook Page</h3>
              {facebookError ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {facebookError}
                </div>
              ) : null}

              {!facebookError && isFetchingFacebook ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading Facebook scheduled posts...
                </div>
              ) : null}

              {!isFetchingFacebook && !facebookError && facebookPosts.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No Facebook scheduled posts found.</p>
              ) : null}

              {!isFetchingFacebook && !facebookError && facebookPosts.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
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
                          <p className="whitespace-pre-wrap text-slate-800">
                            {post.message?.trim() || "—"}
                          </p>
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
              ) : null}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-900">Instagram Business</h3>
              {instagramError ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {instagramError}
                </div>
              ) : null}

              {!instagramError && isFetchingInstagram ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading Instagram scheduled posts...
                </div>
              ) : null}

              {!isFetchingInstagram && !instagramError && instagramPosts.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No Instagram scheduled posts found.</p>
              ) : null}

              {!isFetchingInstagram && !instagramError && instagramPosts.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Caption</th>
                        <th className="px-4 py-3">Scheduled for</th>
                        <th className="px-4 py-3">Media</th>
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
                              <p className="whitespace-pre-wrap text-slate-800">
                                {post.caption?.trim() || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top text-slate-700">
                              {scheduledDate ? format(scheduledDate, "dd MMM yyyy HH:mm") : "—"}
                            </td>
                            <td className="px-4 py-3 align-top text-slate-700">
                              {post.media_url ? (
                                <a
                                  href={post.media_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-700 underline"
                                >
                                  View
                                </a>
                              ) : post.permalink ? (
                                <a
                                  href={post.permalink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-700 underline"
                                >
                                  Permalink
                                </a>
                              ) : (
                                "—"
                              )}
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
              ) : null}
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
