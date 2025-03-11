'use client';

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// Define interfaces for our data
interface AgeData {
  name: string;
  value: number;
}

interface PostcodeData {
  name: string;
  value: number;
}

interface MissingDataField {
  field: string;
  missing: number;
  percentage: number;
}

interface Recommendation {
  title: string;
  description: string;
}

// Type-safe payload object with no 'any' types
interface PayloadObject {
  name?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

// Properly defined Tooltip interfaces
interface TooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
  fill?: string;
  dataKey?: string;
  payload?: PayloadObject;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || entry.fill }}>
            {entry.name}: {entry.value}{entry.name.includes('Percentage') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BlockBookersDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<string>('overview');

  // Age distribution data
  const ageData: AgeData[] = [
    { name: '18-24', value: 3 },
    { name: '25-34', value: 20 },
    { name: '35-44', value: 43 },
    { name: '45-54', value: 10 },
    { name: '55+', value: 11 },
  ];

  // Postcode area distribution data
  const postcodeData: PostcodeData[] = [
    { name: 'CF5', value: 16 },
    { name: 'CF14', value: 10 },
    { name: 'CF64', value: 10 },
    { name: 'CF11', value: 7 },
    { name: 'CF3', value: 4 },
    { name: 'CF10', value: 4 },
    { name: 'CF23', value: 3 },
    { name: 'Other', value: 19 },
  ];

  // Data completeness information
  const missingDataFields: MissingDataField[] = [
    { field: 'County', missing: 95, percentage: 96 },
    { field: 'Address Line 2', missing: 46, percentage: 46 },
    { field: 'Postcode', missing: 26, percentage: 26 },
    { field: 'Address Line 1', missing: 25, percentage: 25 },
    { field: 'DOB', missing: 12, percentage: 12 },
    { field: 'Gender', missing: 4, percentage: 4 },
  ];

  // Recommendations
  const recommendations: Recommendation[] = [
    {
      title: 'Core Customer Focus',
      description: 'Our primary demographic is males aged 35-44. Consider creating special offerings, leagues, or tournaments specifically for this age group.'
    },
    {
      title: 'Local Marketing',
      description: 'The CF5 area is our strongest catchment area. Consider targeted leaflet drops or local advertising in this area to further strengthen our presence.'
    },
    {
      title: 'Data Collection',
      description: 'Improve data collection, particularly for address fields and county information, to enable better geographical analysis in the future.'
    },
    {
      title: 'Customer Retention',
      description: 'Develop loyalty programs for those traveling from further distances (CF64, NP, SA areas) to reward their commitment.'
    },
    {
      title: 'Youth Engagement',
      description: 'With only 3 bookers under 25, there may be an opportunity to attract younger players through university or college partnerships.'
    },
    {
      title: 'Special Initiatives',
      description: 'Create special events, tournaments, or networking opportunities to enhance the community feel and increase retention rates.'
    },
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Block Bookers Analysis</h1>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              className={`px-4 py-2 rounded ${viewType === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewType === 'demographics' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('demographics')}
            >
              Demographics
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewType === 'geography' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('geography')}
            >
              Geography
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewType === 'data-quality' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('data-quality')}
            >
              Data Quality
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewType === 'recommendations' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('recommendations')}
            >
              Recommendations
            </button>
          </div>
        </div>

        {viewType === 'overview' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <p className="text-gray-700 mb-4">
                Analysis of 99 block bookers at our centre. 
                This dashboard provides insights into demographics and geographical distribution of our customer base.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Bookers</p>
                  <p className="text-3xl font-bold text-blue-600">99</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Average Age</p>
                  <p className="text-3xl font-bold text-green-600">41</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Postcode Areas</p>
                  <p className="text-3xl font-bold text-purple-600">23</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Customer Profile</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>All bookers are male (100%)</li>
                    <li>Core demographic is ages 35-44 (49% of known ages)</li>
                    <li>Only 3 bookers under age 25</li>
                    <li>Average age is 41 years</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Geographic Reach</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>CF5 area (closest to Lawrenny Avenue) has the highest concentration</li>
                    <li>73 unique postcodes across 23 different postcode areas</li>
                    <li>Strong representation from Penarth (CF64) and North Cardiff (CF14)</li>
                    <li>Some customers from as Swansea</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Age Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#8884d8" name="Number of Bookers">
                        {ageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  The largest age group is 35-44, making up 49% of bookers with known ages.
                  12 bookers (12%) have no recorded date of birth.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Postcode Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={postcodeData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {postcodeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  The CF5 area has the highest concentration of bookers.
                  26 bookers (26%) have no recorded postcode.
                </p>
              </div>
            </div>
          </div>
        )}

        {viewType === 'demographics' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Demographic Analysis</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Age Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Number of Bookers" fill="#8884d8">
                      {ageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Key Age Insights</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Average age across all bookers: 41 years</li>
                    <li>Most common age group: 35-44 years (43 bookers)</li>
                    <li>Only 3 bookers under the age of 25</li>
                    <li>11 bookers aged 55 and above</li>
                    <li>12 bookers (12%) have missing age data</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Age-Related Recommendations</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Create targeted offerings for the 35-44 age group</li>
                    <li>Implement university/college promotions to attract younger players</li>
                    <li>Consider special events or leagues for senior players (55+)</li>
                    <li>Improve age data collection for future analysis</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Gender Analysis</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-center">
                  All block bookers (100%) are male
                </p>
              </div>
            </div>
          </div>
        )}

        {viewType === 'geography' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Geographical Analysis</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Postcode Distribution</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={postcodeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {postcodeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Key Geographic Insights</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Most common area: CF5 (16 bookers, 22%)</li>
                    <li>CF14 and CF64 tied for second (10 bookers each, 14%)</li>
                    <li>73 unique postcodes across 23 different postcode areas</li>
                    <li>Some bookers travel from as far as London (E15, SW19)</li>
                    <li>26 bookers (26%) have missing postcode data</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">CF5 Postcodes Detail</h4>
                  <p className="mb-2 text-sm">Postcodes in the CF5 area (closest to Lawrenny Avenue):</p>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <div>CF5 1AB</div>
                    <div>CF5 1AH</div>
                    <div>CF5 1BB</div>
                    <div>CF5 1BW</div>
                    <div>CF5 1JF</div>
                    <div>CF5 1NB</div>
                    <div>CF5 1QP</div>
                    <div>CF5 2FH</div>
                    <div>CF5 2JS</div>
                    <div>CF5 2QJ</div>
                    <div>CF5 3AW</div>
                    <div>CF5 4DZ</div>
                    <div>CF5 5HS</div>
                    <div>CF5 6EF</div>
                    <div>CF5 6LH</div>
                    <div>CF5 6SR</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Distance Analysis</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-2">Travel Distance Observations</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Most bookers come from Cardiff postcodes (CF)</li>
                  <li>CF5 area (including Canton, Ely, and Caerau) is closest to us</li>
                  <li>Strong representation from Penarth (CF64) despite being further away</li>
                  <li>North Cardiff (CF14) shows good representation</li>
                  <li>Some customers travel significant distances from Newport (NP) and Swansea (SA)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {viewType === 'data-quality' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Quality Analysis</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Missing Data Fields</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Missing Entries
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {missingDataFields.map((field, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {field.field}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {field.missing}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {field.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Data Quality Visualisation</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={missingDataFields} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="field" />
                      <YAxis label={{ value: 'Missing Percentage (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="percentage" name="Missing Percentage" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2">Data Quality Recommendations</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Focus on collecting County information (96% missing)</li>
                  <li>Improve collection of Address Line 2 (46% missing) and Postcode (26% missing)</li>
                  <li>Implement a standardised format for address collection</li>
                  <li>Make certain fields mandatory in Spawtz</li>
                  <li>Regularise data collection processes to ensure consistency</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {viewType === 'recommendations' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">{recommendation.title}</h3>
                  <p className="text-gray-700">{recommendation.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Action Plan</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-red-600">High Priority</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Implement targeted marketing in CF5 area</li>
                    <li>Create special offerings for the 35-44 age group</li>
                    <li>Standardise data collection process</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-yellow-600">Medium Priority</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Develop loyalty programs for distant bookers</li>
                    <li>Partner with local universities for youth engagement</li>
                    <li>Review and update booking systems to improve data collection</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-green-600">Future Initiatives</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Expand marketing reach to underrepresented areas</li>
                    <li>Implement seasonal promotions and special events</li>
                    <li>Develop a comprehensive block bookers retention strategy</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default BlockBookersDashboard;