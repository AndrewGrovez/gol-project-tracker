// src/app/sheet1/page.tsx
import { google } from "googleapis";
import React from "react";

export default async function Sheet1Page() {
  try {
    // Validate required environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not set");
    }
    if (!process.env.GOOGLE_PRIVATE_KEY_B64) {
      throw new Error("GOOGLE_PRIVATE_KEY_B64 is not set");
    }

    // Hard-code the new spreadsheet ID
    const spreadsheetId = "1GBVKEx3gdm63XCs5N0uYkf99gLfZzlDcvMLJDRws0dE";

    // Decode the base64 private key
    const privateKey = Buffer.from(
      process.env.GOOGLE_PRIVATE_KEY_B64,
      "base64"
    ).toString();

    // Initialise Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Create a client for the Sheets API
    const sheets = google.sheets({ version: "v4", auth });

    // Define the range for Sheet1 (fetches all data in the tab)
    const range = "Sheet1";

    // Add some debug logging
    console.log("Attempting to fetch sheet data...");

    // Fetch data for Sheet1 using the 'get' method
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    console.log("Sheet data fetched successfully");

    // Process the sheet data
    const sheetData = {
      range: res.data.range || "",
      values: (res.data.values || []) as (string | number)[][],
    };

    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Churn Rates</h1>
        {sheetData.values && sheetData.values.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse mb-4">
              <thead>
                <tr>
                  {sheetData.values[0].map((header, headerIndex) => (
                    <th
                      key={headerIndex}
                      className="border p-2 text-left bg-gray-200 text-sm font-semibold whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData.values.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className="even:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border p-2 text-sm whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No data available in Sheet1.</p>
        )}
      </div>
    );
  } catch (error) {
    // Enhanced error logging
    console.error("Error in Sheet1Page:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sheet1 Data</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">
            Error loading data. Please try again later.
            {process.env.NODE_ENV === "development" &&
              error instanceof Error && (
                <span className="block mt-2 text-sm">
                  Error details: {error.message}
                </span>
              )}
          </p>
        </div>
      </div>
    );
  }
}