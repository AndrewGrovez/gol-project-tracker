'use client';

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// Define interfaces for our data
interface AgeData {
  name: string;
  value: number;
}

interface GenderData {
  name: string;
  value: number;
}

interface PostcodeData {
  name: string;
  value: number;
}

interface DetailedAgeData {
  name: string;
  value: number;
}

interface BirthMonthData {
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

const LeaguesDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<string>('overview');

  // Gender distribution data
  const genderData: GenderData[] = [
    { name: 'Male', value: 1089 },
    { name: 'Female', value: 9 }
  ];


  // Detailed age distribution data (2-year bands)
  const detailedAgeData: DetailedAgeData[] = [
    { name: '16-17', value: 124 },
    { name: '18-19', value: 90 },
    { name: '20-21', value: 105 },
    { name: '22-23', value: 116 },
    { name: '24-25', value: 150 },
    { name: '26-27', value: 102 },
    { name: '28-29', value: 96 },
    { name: '30-31', value: 66 },
    { name: '32-33', value: 67 },
    { name: '34-35', value: 39 },
    { name: '36-37', value: 38 },
    { name: '38-39', value: 18 },
    { name: '40-41', value: 14 },
    { name: '42-43', value: 16 },
    { name: '44-45', value: 11 },
    { name: '46-47', value: 9 },
    { name: '48-49', value: 5 },
    { name: '50+', value: 8 }
  ];

  // Birth month distribution data
  const birthMonthData: BirthMonthData[] = [
    { name: 'Jan', value: 89 },
    { name: 'Feb', value: 98 },
    { name: 'Mar', value: 93 },
    { name: 'Apr', value: 77 },
    { name: 'May', value: 82 },
    { name: 'Jun', value: 107 },
    { name: 'Jul', value: 72 },
    { name: 'Aug', value: 105 },
    { name: 'Sep', value: 96 },
    { name: 'Oct', value: 83 },
    { name: 'Nov', value: 94 },
    { name: 'Dec', value: 87 }
  ];

  // Postcode area distribution data
  const postcodeData: PostcodeData[] = [
    { name: 'CF5', value: 109 },
    { name: 'CF11', value: 69 },
    { name: 'CF24', value: 57 },
    { name: 'CF14', value: 54 },
    { name: 'CF64', value: 44 },
    { name: 'CF62', value: 35 },
    { name: 'CF10', value: 32 },
    { name: 'CF3', value: 31 },
    { name: 'CF23', value: 22 },
    { name: 'CF72', value: 22 },
    { name: 'Other CF', value: 180 },
    { name: 'NP Areas', value: 21 },
    { name: 'SA Areas', value: 17 },
    { name: 'Other', value: 11 }
  ];

  // Female distribution by age
  const femaleAgeData: AgeData[] = [
    { name: '18-24', value: 7 },
    { name: '25-34', value: 1 },
    { name: '35-44', value: 1 }
  ];

  // Data completeness information
  const missingDataFields: MissingDataField[] = [
    { field: 'Postcode', missing: 218, percentage: 19.9 },
    { field: 'DOB', missing: 15, percentage: 1.4 },
    { field: 'Gender', missing: 0, percentage: 0 }
  ];

  // Missing data by age group
  const missingDataByAge: AgeData[] = [
    { name: 'Under 18', value: 27 },
    { name: '18-24', value: 70 },
    { name: '25-34', value: 97 },
    { name: '35-44', value: 21 },
    { name: '45-54', value: 3 }
  ];

  // Recommendations
  const recommendations: Recommendation[] = [
    {
      title: 'Target Female Participants',
      description: 'Develop the womens league further, feature female ambassadors in marketing.'
    },
    {
      title: 'Age-Specific Strategies',
      description: 'Explore senior leagues (45+) or 30+ leagues, maintain strong focus on core 18-34 demographic.'
    },
    {
      title: 'Geographic Expansion',
      description: 'Target marketing in underrepresented postcode areas.'
    },
    {
      title: 'Data Collection Improvements',
      description: 'Implement mandatory postcode field in registration, conduct participant surveys, track retention rates to identify drop-off patterns.'
    },
    {
      title: 'Community Building Initiatives',
      description: 'Implement social leagues emphasizing community over competition.'
    },
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
  const GENDER_COLORS = ['#0088FE', '#FF8042'];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">League Demographics Dashboard - All Spawtz Users</h1>
        
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
                Analysis of 1,098 participants in our leagues. 
                This dashboard provides insights into demographics and geographical distribution of our participant base.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Participants</p>
                  <p className="text-3xl font-bold text-blue-600">1,098</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Male/Female Ratio</p>
                  <p className="text-3xl font-bold text-green-600">99:1</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Primary Age Group</p>
                  <p className="text-3xl font-bold text-purple-600">25-34</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Demographics Summary</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Overwhelming male participation (99.2%)</li>
                    <li>Core demographic is 18-34 year olds (74.2%)</li>
                    <li>Sharp participation drop-off after age 35</li>
                    <li>Peak participation at ages 24-25 (150 participants)</li>
                    <li>Strong youth presence (16-17) with 124 participants - potentially skewed as multiple players from the same team on Spawtz are more likely to be</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Geographic Reach</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Most participants from Cardiff areas (CF postcodes)</li>
                    <li>Top areas: CF5 (109), CF11 (69), CF24 (57)</li>
                    <li>218 missing postcodes (19.9% of records)</li>
                    <li>Limited representation from Newport (NP) and Swansea (SA)</li>
                    <li>Female participants spread across 8 different postcode areas</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Gender Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  There is a striking gender imbalance with 99.2% male participants (1,089) and only 0.8% female participants (9).
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Age Distribution (2-Year Bands)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={detailedAgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Number of Participants" fill="#8884d8">
                        {detailedAgeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Peak participation is at ages 24-25 (150 participants), with another strong group at 16-17 (124 participants).
                  There&apos;s a sharp decline after age 35. 15 participants (1.4%) have no recorded date of birth.
                </p>
              </div>
            </div>
          </div>
        )}

        {viewType === 'demographics' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Detailed Age Analysis</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Age Distribution (2-Year Bands)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={detailedAgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Number of Participants" fill="#8884d8">
                        {detailedAgeData.map((entry, index) => (
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
                      <li>Peak participation: 24-25 year olds (150 participants)</li>
                      <li>Strong youth presence: 16-17 year olds (124 participants)</li>
                      <li>Sharp decline after age 35 (only 38 participants aged 36-37)</li>
                      <li>Minimal participation from 45+ age group (only 22 participants)</li>
                      <li>Distinct age clusters at 18-19, 22-23, and 24-25</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Birth Month Analysis</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={birthMonthData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="value" name="Born in Month" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      No significant seasonal patterns. Slight peaks in June (107) and August (105).
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Gender Analysis</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Gender Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Female Participant Analysis</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={femaleAgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="value" name="Female Participants" fill="#FF8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Female Participant Insights</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>78% of female participants (7 out of 9) are in the 18-24 age bracket</li>
                      <li>Spread across 8 different postcode areas (CF10, CF5, CF24, CF729DP, CF37, CF48, CF64, CF11)</li>
                      <li>No female participants under 18 or over 45</li>
                      <li>All female participants provided complete data (no missing postcodes)</li>
                    </ul>
                  </div>
                </div>
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
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
                    <li>Most common area: CF5 (109 participants, 12.4%)</li>
                    <li>Second highest: CF11 (69 participants, 7.8%)</li>
                    <li>Third highest: CF24 (57 participants, 6.5%)</li>
                    <li>Strong representation from CF14 (54) and CF64 (44)</li>
                    <li>Limited participation from outside Cardiff (CF) postcodes</li>
                    <li>218 participants (19.9%) have missing postcode data</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Geographic Expansion Opportunities</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Many CF districts have only 1-3 participants despite proximity to high-participation areas</li>
                    <li>Newport (NP) and Swansea (SA) areas show limited but consistent participation</li>
                    <li>Missing data concentrated in 25-34 age group (97 missing postcodes)</li>
                    <li>Female participants spread across 8 different postcode areas</li>
                    <li>Potential for satellite locations in underrepresented areas</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Distance Analysis</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-2">Travel Distance Observations</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Most participants from Cardiff (CF) postcodes with high concentration in CF5, CF11, and CF24</li>
                  <li>Some participants travel from Newport (NP) and Swansea (SA) areas</li>
                  <li>Isolated participants from more distant locations</li>
                  <li>High participation from CF5 suggests proximity to venue/facilities</li>
                  <li>CF districts with below-average participation might benefit from targeted marketing</li>
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
                <h3 className="text-xl font-semibold mb-4">Missing Postcode Data by Age Group</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={missingDataByAge} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Missing Postcodes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Missing Postcodes" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2">Data Quality Observations</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>25-34 age group has the highest rate of missing postcodes (97 missing)</li>
                  <li>Missing data is exclusively from male participants</li>
                  <li>20% of male participants did not provide postcode information</li>
                  <li>Incomplete data is less common in older participants (45+)</li>
                  <li>All female participants provided complete information</li>
                  <li>Gender data is complete for all participants</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {viewType === 'recommendations' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Strategic Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">{recommendation.title}</h3>
                  <p className="text-gray-700">{recommendation.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Implementation Plan</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-red-600">High Priority</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Launch a University League targeting the 18-25 demographic peak</li>
                    <li>Develop women-only leagues or divisions to increase female participation</li>
                    <li>Improve data collection with mandatory postcode field in registration</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-yellow-600">Medium Priority</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Create a Veterans League for 35+ participants</li>
                    <li>Target marketing in underrepresented CF districts</li>
                    <li>Implement a youth-to-adult transition program for 16-17 year olds</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-green-600">Future Initiatives</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Establish satellite league locations in Newport (NP) and Swansea (SA) areas</li>
                    <li>Create mixed-gender format options with specific team composition requirements</li>
                    <li>Develop a comprehensive retention strategy to prevent drop-off after age 35</li>
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

export default LeaguesDashboard;