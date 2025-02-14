import React from "react";
import { google } from "googleapis";
import ChurnRateDataViewer from "./ChurnRateDataViewer";

// Define a constant for the cell range for all day tabs
const DATA_RANGE = "A1:D25";

export default async function ChurnPage() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not set");
  }
  if (!process.env.GOOGLE_PRIVATE_KEY_B64) {
    throw new Error("GOOGLE_PRIVATE_KEY_B64 is not set");
  }
  if (!process.env.CHURN_SPREADSHEET_ID) {
    throw new Error("CHURN_SPREADSHEET_ID is not set");
  }

  const privateKey = Buffer.from(
    process.env.GOOGLE_PRIVATE_KEY_B64,
    "base64"
  ).toString();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.CHURN_SPREADSHEET_ID;

  // Fetch spreadsheet metadata to get all tab names
  const metaRes = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const sheetsProperties = metaRes.data.sheets || [];
  const tabNames = sheetsProperties
    .map((sheet) => sheet.properties?.title)
    .filter(Boolean) as string[];

  if (tabNames.length === 0) {
    throw new Error("No tabs found in the churn spreadsheet");
  }

  // Use the first tab as the default and apply the constant range
  const defaultTab = tabNames[0];
  const defaultRange = `${defaultTab}!${DATA_RANGE}`;
  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: defaultRange,
  });
  const defaultData = dataRes.data.values || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Churn Rate Data</h1>
      <ChurnRateDataViewer
        initialTab={defaultTab}
        tabNames={tabNames}
        initialData={defaultData}
      />
    </div>
  );
}