// src/app/income/IncomeDataViewer.tsx
"use client";

import React, { useState } from "react";

type IncomeDataViewerProps = {
  initialTab: string;
  tabNames: string[];
  initialData: (string | number)[][];
};

export default function IncomeDataViewer({
  initialTab,
  tabNames,
  initialData,
}: IncomeDataViewerProps) {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [tableData, setTableData] = useState<(string | number)[][]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle drop-down changes
  async function handleTabChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newTab = e.target.value;
    setSelectedTab(newTab);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/income?tab=${encodeURIComponent(newTab)}`);
      if (!res.ok) {
        throw new Error(`Error fetching data for ${newTab}`);
      }
      const json = await res.json();
      setTableData(json.values);
    } catch (err: unknown) {
      console.error("Error fetching data", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="tabSelect" className="mr-2 font-semibold">
          Select Week:
        </label>
        <select
          id="tabSelect"
          value={selectedTab}
          onChange={handleTabChange}
          className="border p-2 rounded"
        >
          {tabNames.map((tab) => (
            <option key={tab} value={tab}>
              {tab}
            </option>
          ))}
        </select>
      </div>
      {loading && <p className="text-gray-600">Loading data…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <>
          {tableData && tableData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    {tableData[0].map((header, idx) => (
                      <th
                        key={idx}
                        className="border p-2 bg-gray-200 text-left text-sm font-semibold whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(1).map((row, rowIndex) => (
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
            <p className="text-gray-600">No data available for {selectedTab}.</p>
          )}
        </>
      )}
    </div>
  );
}