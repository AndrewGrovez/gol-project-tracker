// src/app/yearbyyear/page.tsx

// src/app/yearbyyear/page.tsx
import { google } from "googleapis";
import React from "react";

// Because pages in the app directory are server components by default,
// we can use async/await directly here.
export default async function YearByYearPage() {
  // Initialise Google Auth with your service account credentials.
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Replace escaped newline characters with actual newlines
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  // Create a client for the Sheets API.
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const range = "Sheet1!A1:E20"; // Adjust the sheet name/range as needed

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