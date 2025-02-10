// src/app/yearbyyear/page.tsx
import { google } from "googleapis";
import React from "react";

export default async function YearByYearPage() {
  // Helper function to properly format the private key
  const getPrivateKey = () => {
    // Try base64 decoded key first
    if (process.env.GOOGLE_PRIVATE_KEY_B64) {
      return Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString();
    }
    
    // Fall back to regular private key handling
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Neither GOOGLE_PRIVATE_KEY nor GOOGLE_PRIVATE_KEY_B64 environment variable is set');
    }
    
    // If the private key is already properly formatted with actual newlines, return as is
    if (privateKey.includes('\n')) {
      return privateKey;
    }
    
    // If the private key is stored with literal \n characters, replace them
    return privateKey.replace(/\\n/g, '\n');
  };

  // Initialize Google Auth using the service account credentials
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is not set');
    }

    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      throw new Error('GOOGLE_SPREADSHEET_ID environment variable is not set');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: getPrivateKey(),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Create a client for the Sheets API
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    
    // Specify the ranges for each tab
    const ranges = [
      "Pitch Occupancy!A1:J53",
      "Activities!A1:J15",
      "Parties!A1:J15",
      "Leagues!A1:J13",
      "Activities!A1:J15",
      "Holiday SS!A1:J8",
    ];

    // Fetch data from multiple tabs using batchGet
    let sheetData: { range: string; values: (string | number)[][] }[] = [];
    
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    if (!res.data.valueRanges) {
      throw new Error('No data received from Google Sheets');
    }

    sheetData = res.data.valueRanges.map((vr) => ({
      range: vr.range || "",
      values: (vr.values || []) as (string | number)[][],
    }));

    console.log("Sheet data fetched successfully");

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
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse mb-4">
                    <thead>
                      <tr>
                        {sheet.values[0].map((header, headerIndex) => (
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
                      {sheet.values.slice(1).map((row, rowIndex) => (
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
  } catch (error) {
    console.error("Error in YearByYearPage:", error);
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Year by Year Comparison</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">
            Error loading data. Please try again later.
            {process.env.NODE_ENV === 'development' && error instanceof Error && (
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