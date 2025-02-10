// src/app/yearbyyear/page.tsx
import { google } from "googleapis";
import React from "react";

export default async function YearByYearPage() {
  // Initialize Google Auth using your service account credentials from environment variables.
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Replace escaped newlines with actual newline characters
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const range = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A1:E20"; // Adjust as needed

  let sheetData: (string | number)[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    sheetData = res.data.values || [];
  } catch (error) {
    console.error("Error fetching sheet data:", error);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Year by Year Comparison</h1>
      {sheetData.length > 0 ? (
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {sheetData[0].map((header, index) => (
                <th
                  key={index}
                  className="border p-2 text-left bg-gray-200 text-sm font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.slice(1).map((row, rowIndex) => (
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
        <p className="text-gray-600">No data available.</p>
      )}
    </div>
  );
}