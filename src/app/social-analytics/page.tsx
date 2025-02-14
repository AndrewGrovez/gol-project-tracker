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

export default async function SocialAnalyticsPage() {
  // Ensure required environment variables are set
  if (!process.env.FACEBOOK_ACCESS_TOKEN) {
    throw new Error("FACEBOOK_ACCESS_TOKEN is not set");
  }
  if (!process.env.FACEBOOK_PAGE_ID) {
    throw new Error("FACEBOOK_PAGE_ID is not set");
  }

  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const facebookPageId = process.env.FACEBOOK_PAGE_ID;

  // --- Facebook Insights Fetch ---
  const facebookMetrics =
    "page_impressions_unique,page_post_engagements,page_views_total,page_fan_adds";
  const facebookUrl = `https://graph.facebook.com/v22.0/${facebookPageId}/insights?metric=${facebookMetrics}&period=days_28&access_token=${accessToken}`;

  const fbRes = await fetch(facebookUrl);
  if (!fbRes.ok) {
    const errorData = await fbRes.json();
    throw new Error(
      `Error fetching Facebook analytics: ${errorData.error?.message || "Unknown error"}`
    );
  }
  const facebookData: FacebookInsightsResponse = await fbRes.json();

  // --- Instagram Business Discovery Fetch ---
  // Updated query to include media so we can aggregate interactions.
  const instagramDiscoveryUrl = `https://graph.facebook.com/v22.0/17841400021865622?fields=business_discovery.username(golcentres){followers_count,media{like_count,comments_count,timestamp}}&access_token=${accessToken}`;
  const instaDiscoveryRes = await fetch(instagramDiscoveryUrl);
  if (!instaDiscoveryRes.ok) {
    const errorData = await instaDiscoveryRes.json();
    throw new Error(
      `Error fetching Instagram discovery data: ${errorData.error?.message || "Unknown error"}`
    );
  }
  const instagramDiscoveryData: InstagramInsightsResponse = await instaDiscoveryRes.json();
  const discovery: InstagramBusinessDiscovery = instagramDiscoveryData.business_discovery;

  // --- Instagram Account Insights Fetch (Reach) ---
  const instagramInsightsUrl = `https://graph.facebook.com/v22.0/17841400021865622/insights?metric=reach&period=days_28&access_token=${accessToken}`;
  const instaInsightsRes = await fetch(instagramInsightsUrl);
  if (!instaInsightsRes.ok) {
    const errorData = await instaInsightsRes.json();
    throw new Error(
      `Error fetching Instagram insights: ${errorData.error?.message || "Unknown error"}`
    );
  }
  const instagramInsightsData: InstagramAccountInsightsResponse = await instaInsightsRes.json();
  const reachInsight: InstagramInsight | undefined = instagramInsightsData.data.find(
    (insight) => insight.name === "reach"
  );
  const reachValue =
    reachInsight && reachInsight.values && reachInsight.values[0]
      ? reachInsight.values[0].value
      : "N/A";

  // --- Calculate Aggregated Interactions from Media ---
  let totalInteractions = 0;
  if (discovery && discovery.media && discovery.media.data) {
    // Debug: log the media data array
    console.log("Instagram Media Data:", discovery.media.data);
    const now = new Date();
    const past28Days = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    discovery.media.data.forEach((media: InstagramMedia) => {
      // Debug: log each media's timestamp and counts
      console.log("Media Timestamp:", media.timestamp);
      console.log("Media Like Count:", media.like_count);
      console.log("Media Comments Count:", media.comments_count);
      const mediaDate = new Date(media.timestamp);
      if (mediaDate >= past28Days) {
        totalInteractions += (media.like_count || 0) + (media.comments_count || 0);
      }
    });
    // Debug: log total interactions computed
    console.log("Total Interactions Calculated:", totalInteractions);
  } else {
    console.log("No media data found in discovery");
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold mb-6">Social Analytics Dashboard</h1>
      
      {/* Facebook Insights Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Facebook Aggregated Insights (Last 28 Days)
        </h2>
        {facebookData.data && facebookData.data.length > 0 ? (
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
          <p>No Facebook insights data available.</p>
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
          <p>No Instagram data available.</p>
        )}
      </section>
    </div>
  );
}