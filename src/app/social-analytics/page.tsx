// src/app/social-analytics/page.tsx
import React from "react";
import type {
  FacebookInsightsResponse,
  FacebookInsight,
  InstagramInsightsResponse,
  InstagramBusinessDiscovery,
  InstagramMedia,
  InstagramAccountInsightsResponse,
  InstagramInsight,
} from "./types";

export const dynamic = "force-dynamic";

export default async function SocialAnalyticsPage() {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN ?? "";
  const facebookPageId = process.env.FACEBOOK_PAGE_ID ?? "";
  const missingEnv = [
    !accessToken ? "FACEBOOK_ACCESS_TOKEN" : null,
    !facebookPageId ? "FACEBOOK_PAGE_ID" : null,
  ].filter(Boolean) as string[];

  const errors: { facebook?: string; instagram?: string; instagramReach?: string } = {};
  let facebookData: FacebookInsightsResponse | null = null;
  let discovery: InstagramBusinessDiscovery | null = null;
  let reachValue: number | "N/A" = "N/A";
  let totalInteractions = 0;

  if (missingEnv.length === 0) {
    // --- Facebook Insights Fetch (per-metric, so one invalid metric doesn't kill the whole page) ---
    try {
      const facebookMetricList = [
        "page_impressions_unique",
        "page_post_engagements",
        "page_views_total",
        "page_fan_adds",
      ];

      const insights: FacebookInsight[] = [];
      for (const metric of facebookMetricList) {
        const facebookUrl = `https://graph.facebook.com/v22.0/${facebookPageId}/insights?metric=${metric}&period=days_28&access_token=${accessToken}`;
        const response = await fetch(facebookUrl, { cache: "no-store" });
        if (!response.ok) {
          const errorData = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          errors.facebook =
            errorData?.error?.message || errors.facebook || "Facebook insights unavailable.";
          continue;
        }

        const metricResponse = (await response.json()) as FacebookInsightsResponse;
        if (metricResponse.data?.length) {
          insights.push(...metricResponse.data);
        }
      }

      if (insights.length > 0) {
        facebookData = { data: insights };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.facebook = `Facebook insights unavailable: ${message}`;
    }

    // --- Instagram Business Discovery Fetch ---
    try {
      const instagramDiscoveryUrl = `https://graph.facebook.com/v22.0/17841400021865622?fields=business_discovery.username(golcentres){followers_count,media{like_count,comments_count,timestamp}}&access_token=${accessToken}`;
      const instaDiscoveryRes = await fetch(instagramDiscoveryUrl, { cache: "no-store" });
      if (!instaDiscoveryRes.ok) {
        const errorData = (await instaDiscoveryRes.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        errors.instagram =
          errorData?.error?.message || "Instagram discovery data unavailable.";
      } else {
        const instagramDiscoveryData = (await instaDiscoveryRes.json()) as InstagramInsightsResponse;
        discovery = instagramDiscoveryData.business_discovery ?? null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.instagram = `Instagram discovery data unavailable: ${message}`;
    }

    // --- Instagram Account Insights Fetch (Reach) ---
    try {
      const instagramInsightsUrl = `https://graph.facebook.com/v22.0/17841400021865622/insights?metric=reach&period=days_28&access_token=${accessToken}`;
      const instaInsightsRes = await fetch(instagramInsightsUrl, { cache: "no-store" });
      if (!instaInsightsRes.ok) {
        const errorData = (await instaInsightsRes.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        errors.instagramReach =
          errorData?.error?.message || "Instagram reach unavailable.";
      } else {
        const instagramInsightsData = (await instaInsightsRes.json()) as InstagramAccountInsightsResponse;
        const reachInsight: InstagramInsight | undefined = instagramInsightsData.data.find(
          (insight) => insight.name === "reach"
        );
        reachValue =
          reachInsight && reachInsight.values && reachInsight.values[0]
            ? reachInsight.values[0].value
            : "N/A";
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.instagramReach = `Instagram reach unavailable: ${message}`;
    }

    // --- Calculate Aggregated Interactions from Media ---
    if (discovery?.media?.data?.length) {
      const now = new Date();
      const past28Days = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      discovery.media.data.forEach((media: InstagramMedia) => {
        const mediaDate = new Date(media.timestamp);
        if (mediaDate >= past28Days) {
          totalInteractions += (media.like_count || 0) + (media.comments_count || 0);
        }
      });
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold mb-6">Social Analytics Dashboard</h1>

      {missingEnv.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          Missing required env vars: <span className="font-semibold">{missingEnv.join(", ")}</span>
        </div>
      )}
      
      {/* Facebook Insights Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Facebook Aggregated Insights (Last 28 Days)
        </h2>
        {facebookData?.data && facebookData.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {facebookData.data.map((insight: FacebookInsight) => {
              const aggregatedValue =
                insight.values && insight.values[0]
                  ? insight.values[0].value
                  : "N/A";
              const aggregatedEndDate =
                insight.values && insight.values[0]
                  ? new Date(insight.values[0].end_time).toLocaleDateString("en-GB")
                  : "N/A";
              return (
                <div key={insight.name} className="border p-4 rounded-lg shadow">
                  <h3 className="text-2xl font-semibold">{insight.title}</h3>
                  <p className="text-gray-600 mb-2">{insight.description}</p>
                  <div className="text-lg">
                    <p>
                      <span className="font-semibold">Total:</span> {aggregatedValue}
                    </p>
                    <p>
                      <span className="font-semibold">As of:</span> {aggregatedEndDate}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>{errors.facebook || "No Facebook insights data available."}</p>
        )}
      </section>

      {/* Instagram Insights Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Instagram Business Insights</h2>
        {discovery ? (
          <div className="border p-4 rounded-lg shadow space-y-4">
            <div>
              <h3 className="text-2xl font-semibold">{discovery.username}</h3>
              <p>
                <span className="font-semibold">Followers:</span>{" "}
                {discovery.followers_count || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Reach (Last 28 Days):</span>{" "}
                {reachValue}
              </p>
              <p>
                <span className="font-semibold">
                  Total Interactions (Likes + Comments in Last 28 Days):
                </span>{" "}
                {totalInteractions}
              </p>
            </div>
          </div>
        ) : (
          <p>{errors.instagram || "No Instagram data available."}</p>
        )}
        {errors.instagramReach && (
          <p className="text-sm text-slate-600 mt-2">Reach unavailable: {errors.instagramReach}</p>
        )}
      </section>
    </div>
  );
}
