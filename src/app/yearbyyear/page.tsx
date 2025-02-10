// src/app/yearbyyear/page.tsx
import { google } from "googleapis";
import React from "react";

export default async function YearByYearPage() {
  // Initialize Google Auth using the service account credentials from environment variables.
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Replace escaped newline characters (\n) with actual newlines.
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  // Create a client for the Sheets API.
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  
  // Specify the ranges for each tab.
  const ranges = [
    "Pitch Occupancy!A1:J53",
    "Activities!A1:J15",
    "Parties!A1:J15",
    "Leagues!A1:J13",
    "Activities!A1:J15",
    "Holiday SS!A1:J8",
  ];

  // Fetch data from multiple tabs using batchGet.
  let sheetData: { range: string; values: (string | number)[][] }[] = [];
  try {
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });
    sheetData = (res.data.valueRanges || []).map((vr) => ({
      range: vr.range || "",
      values: (vr.values || []) as (string | number)[][],
    }));
    console.log("Sheet data fetched:", sheetData);
  } catch (error) {
    console.error("Error fetching sheet data:", error);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Year by Year Comparison</h1>
      {sheetData.length > 0 ? (
        sheetData.map((sheet, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {sheet.range.split("!")[0]}
            </h2>
            {sheet.values && sheet.values.length > 0 ? (
              <table className="min-w-full border-collapse mb-4">
                <thead>
                  <tr>
                    {sheet.values[0].map((header, headerIndex) => (
                      <th
                        key={headerIndex}
                        className="border p-2 text-left bg-gray-200 text-sm font-semibold"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.values.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className="even:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border p-2 text-sm">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600">
                No data available in {sheet.range.split("!")[0]}.
              </p>
            )}
            <hr className="border-gray-300" />
          </div>
        ))
      ) : (
        <p className="text-gray-600">No data available.</p>
      )}
    </div>
  );
}