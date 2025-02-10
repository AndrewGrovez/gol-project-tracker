// src/app/api/income/route.ts

import { google } from "googleapis";
import { NextResponse } from "next/server";

// Define the constant range to use for all tabs
const DATA_RANGE = "A4:J64";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab");
  if (!tab) {
    return NextResponse.json(
      { error: "Missing 'tab' query parameter" },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    return NextResponse.json(
      { error: "GOOGLE_SERVICE_ACCOUNT_EMAIL is not set" },
      { status: 500 }
    );
  }
  if (!process.env.GOOGLE_PRIVATE_KEY_B64) {
    return NextResponse.json(
      { error: "GOOGLE_PRIVATE_KEY_B64 is not set" },
      { status: 500 }
    );
  }
  if (!process.env.INCOME_SPREADSHEET_ID) {
    return NextResponse.json(
      { error: "INCOME_SPREADSHEET_ID is not set" },
      { status: 500 }
    );
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
  const spreadsheetId = process.env.INCOME_SPREADSHEET_ID;

  try {
    // Use the constant DATA_RANGE for all tabs
    const range = `${tab}!${DATA_RANGE}`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    if (!res.data.values) {
      return NextResponse.json(
        { error: `No data found for tab ${tab}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ range, values: res.data.values });
  } catch (error) {
    console.error("Error fetching data for tab", tab, error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}