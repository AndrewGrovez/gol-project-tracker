// src/app/social-analytics/page.tsx
import React from "react";
import type { FacebookInsightsResponse, FacebookInsight } from "./types";

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

  // Define the metrics to fetch.
  const facebookMetrics =
    "page_impressions_unique,page_post_engagements,page_views_total,page_fan_adds";

  // Construct the URL using period=days_28 for aggregated totals over the last 28 days.
  const facebookUrl = `https://graph.facebook.com/v22.0/${facebookPageId}/insights?metric=${facebookMetrics}&period=days_28&access_token=${accessToken}`;

  // Fetch Facebook insights data
  const fbRes = await fetch(facebookUrl);
  if (!fbRes.ok) {
    const errorData = await fbRes.json();
    throw new Error(
      `Error fetching Facebook analytics: ${errorData.error?.message || "Unknown error"}`
    );
  }
  const facebookData: FacebookInsightsResponse = await fbRes.json();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">Social Analytics Dashboard</h1>
      <h2 className="text-xl font-semibold">Facebook Aggregated Insights (Last 28 Days)</h2>
      {facebookData.data && facebookData.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {facebookData.data.map((insight: FacebookInsight) => {
            // Expecting a single aggregated value in the values array
            const aggregatedValue =
              insight.values && insight.values[0] ? insight.values[0].value : "N/A";
            // Format the end time to only display the date (dd/mm/yyyy)
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
    </div>
  );
}