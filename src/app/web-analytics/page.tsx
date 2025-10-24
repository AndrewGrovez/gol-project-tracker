// src/app/web-analytics/page.tsx
import React from "react";
import { BetaAnalyticsDataClient, protos } from "@google-analytics/data";

export const dynamic = "force-dynamic";

export default async function WebAnalyticsPage() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not set");
  }
  if (!process.env.GOOGLE_PRIVATE_KEY_B64) {
    throw new Error("GOOGLE_PRIVATE_KEY_B64 is not set");
  }
  if (!process.env.GA4_PROPERTY_ID) {
    throw new Error("GA4_PROPERTY_ID is not set");
  }

  const privateKey = Buffer.from(
    process.env.GOOGLE_PRIVATE_KEY_B64,
    "base64"
  ).toString();

  const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
  });

  async function runReport(
    request: object
  ): Promise<protos.google.analytics.data.v1beta.IRunReportResponse | null> {
    try {
      const [response] = await analyticsDataClient.runReport(request);
      return response;
    } catch (e) {
      console.error("Analytics Reporting API Error:", e);
      return { rows: [] } as protos.google.analytics.data.v1beta.IRunReportResponse;
    }
  }

  const property = `properties/${process.env.GA4_PROPERTY_ID}`;
  const dateRanges = [{ startDate: "30daysAgo", endDate: "today" }];

  // --- Top Pages by Page Views ---
  const topPagesResponse = await runReport({
    property,
    dateRanges,
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });
  const topPages: { pagePath: string; screenPageViews: string }[] = [];
  if (topPagesResponse?.rows) {
    topPages.push(
      ...topPagesResponse.rows.map(
        (row: protos.google.analytics.data.v1beta.IRow) => ({
          pagePath: row.dimensionValues?.[0].value || "N/A",
          screenPageViews: row.metricValues?.[0].value || "N/A",
        })
      )
    );
  }

  // --- Demographics ---
  const cityDemographicsResponse = await runReport({
    property,
    dateRanges,
    dimensions: [{ name: "city" }],
    metrics: [{ name: "activeUsers" }],
    limit: 10,
  });
  const cityDemographics: { city: string; activeUsers: string }[] = [];
  if (cityDemographicsResponse?.rows) {
    cityDemographics.push(
      ...cityDemographicsResponse.rows.map(
        (row: protos.google.analytics.data.v1beta.IRow) => ({
          city: row.dimensionValues?.[0].value || "N/A",
          activeUsers: row.metricValues?.[0].value || "N/A",
        })
      )
    );
  }

  const ageDemographicsResponse = await runReport({
    property,
    dateRanges,
    dimensions: [{ name: "userAgeBracket" }],
    metrics: [{ name: "activeUsers" }],
  });
  const ageDemographics: { ageBracket: string; activeUsers: string }[] = [];
  if (ageDemographicsResponse?.rows) {
    ageDemographics.push(
      ...ageDemographicsResponse.rows.map(
        (row: protos.google.analytics.data.v1beta.IRow) => ({
          ageBracket: row.dimensionValues?.[0].value || "N/A",
          activeUsers: row.metricValues?.[0].value || "N/A",
        })
      )
    );
  }

  // --- Technology ---
  const platformActiveUsersResponse = await runReport({
    property,
    dateRanges,
    dimensions: [{ name: "platform" }],
    metrics: [{ name: "activeUsers" }],
  });
  const platformActiveUsers: { platform: string; activeUsers: string }[] = [];
  if (platformActiveUsersResponse?.rows) {
    platformActiveUsers.push(
      ...platformActiveUsersResponse.rows.map(
        (row: protos.google.analytics.data.v1beta.IRow) => ({
          platform: row.dimensionValues?.[0].value || "N/A",
          activeUsers: row.metricValues?.[0].value || "N/A",
        })
      )
    );
  }

  const deviceCategoryActiveUsersResponse = await runReport({
    property,
    dateRanges,
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "activeUsers" }],
  });
  const deviceCategoryActiveUsers: { deviceCategory: string; activeUsers: string }[] = [];
  if (deviceCategoryActiveUsersResponse?.rows) {
    deviceCategoryActiveUsers.push(
      ...deviceCategoryActiveUsersResponse.rows.map(
        (row: protos.google.analytics.data.v1beta.IRow) => ({
          deviceCategory: row.dimensionValues?.[0].value || "N/A",
          activeUsers: row.metricValues?.[0].value || "N/A",
        })
      )
    );
  }

  const browserActiveUsersResponse = await runReport({
    property,
    dateRanges,
    dimensions: [{ name: "browser" }],
    metrics: [{ name: "activeUsers" }],
    limit: 5,
  });
  const browserActiveUsers: { browser: string; activeUsers: string }[] = [];
  if (browserActiveUsersResponse?.rows) {
    browserActiveUsers.push(
      ...browserActiveUsersResponse.rows.map(
        (row: protos.google.analytics.data.v1beta.IRow) => ({
          browser: row.dimensionValues?.[0].value || "N/A",
          activeUsers: row.metricValues?.[0].value || "N/A",
        })
      )
    );
  }

  const operatingSystemActiveUsersResponse = await runReport({
    property,
    dateRanges,
    dimensions: [{ name: "operatingSystem" }],
    metrics: [{ name: "activeUsers" }],
    limit: 5,
  });
  const operatingSystemActiveUsers: { operatingSystem: string; activeUsers: string }[] = [];
  if (operatingSystemActiveUsersResponse?.rows) {
    operatingSystemActiveUsers.push(
      ...operatingSystemActiveUsersResponse.rows.map(
        (row: protos.google.analytics.data.v1beta.IRow) => ({
          operatingSystem: row.dimensionValues?.[0].value || "N/A",
          activeUsers: row.metricValues?.[0].value || "N/A",
        })
      )
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-[#1c3145]">
        Web Analytics Dashboard – Last 30 Days
      </h1>

      {/* Top Pages Section */}
      <section className="mb-6 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2 text-[#1c3145]">Top Pages</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1 text-left">Page Path</th>
              <th className="border p-1 text-left">Page Views</th>
            </tr>
          </thead>
          <tbody>
            {topPages.map((page, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="border p-1">{page.pagePath}</td>
                <td className="border p-1">{page.screenPageViews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Demographics Section */}
      <section className="mb-6 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2 text-[#1c3145]">Demographics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <strong>By City (Top 10):</strong>
            <ul className="list-disc pl-4">
              {cityDemographics.map((demo, index) => (
                <li key={index}>
                  {demo.city}: {demo.activeUsers}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>By Age Bracket:</strong>
            <ul className="list-disc pl-4">
              {ageDemographics.map((demo, index) => (
                <li key={index}>
                  {demo.ageBracket}: {demo.activeUsers}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="mb-6 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2 text-[#1c3145]">Technology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div>
            <strong>By Platform:</strong>
            <ul className="list-disc pl-4">
              {platformActiveUsers.map((item, index) => (
                <li key={index}>
                  {item.platform}: {item.activeUsers}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>By Device Category:</strong>
            <ul className="list-disc pl-4">
              {deviceCategoryActiveUsers.map((item, index) => (
                <li key={index}>
                  {item.deviceCategory}: {item.activeUsers}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>By Browser (Top 5):</strong>
            <ul className="list-disc pl-4">
              {browserActiveUsers.map((item, index) => (
                <li key={index}>
                  {item.browser}: {item.activeUsers}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>By Operating System (Top 5):</strong>
            <ul className="list-disc pl-4">
              {operatingSystemActiveUsers.map((item, index) => (
                <li key={index}>
                  {item.operatingSystem}: {item.activeUsers}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
