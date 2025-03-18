'use client';

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis
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

interface DistanceData {
  name: string;
  value: number;
  distance: number;
}

interface DistanceBandData {
  name: string;
  value: number;
  color: string;
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

const LeagueParticipantsDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<string>('overview');

  // Gender distribution data
  const genderData: GenderData[] = [
    { name: 'Male', value: 353 },
    { name: 'Female', value: 3 }
  ];

  // Detailed age distribution data (2-year bands)
  const detailedAgeData: DetailedAgeData[] = [
    { name: 'Under 16', value: 2 },
    { name: '16-17', value: 11 },
    { name: '18-19', value: 18 },
    { name: '20-21', value: 33 },
    { name: '22-23', value: 32 },
    { name: '24-25', value: 57 },
    { name: '26-27', value: 41 },
    { name: '28-29', value: 35 },
    { name: '30-31', value: 26 },
    { name: '32-33', value: 23 },
    { name: '34-35', value: 18 },
    { name: '36-37', value: 13 },
    { name: '38-39', value: 11 },
    { name: '40+', value: 29 },
    { name: 'Unknown', value: 7 }
  ];

  // Birth month distribution data
  const birthMonthData: BirthMonthData[] = [
    { name: 'Jan', value: 33 },
    { name: 'Feb', value: 27 },
    { name: 'Mar', value: 28 },
    { name: 'Apr', value: 25 },
    { name: 'May', value: 29 },
    { name: 'Jun', value: 30 },
    { name: 'Jul', value: 31 },
    { name: 'Aug', value: 32 },
    { name: 'Sep', value: 29 },
    { name: 'Oct', value: 27 },
    { name: 'Nov', value: 29 },
    { name: 'Dec', value: 29 }
  ];

  // Postcode area distribution data
  const postcodeData: PostcodeData[] = [
    { name: 'CF5', value: 55 },
    { name: 'CF11', value: 36 },
    { name: 'CF14', value: 29 },
    { name: 'CF24', value: 29 },
    { name: 'CF64', value: 26 },
    { name: 'CF3', value: 21 },
    { name: 'CF62', value: 19 },
    { name: 'CF10', value: 15 },
    { name: 'CF63', value: 9 },
    { name: 'CF23', value: 8 },
    { name: 'Other CF', value: 46 },
    { name: 'Missing', value: 63 }
  ];

  // Female distribution by age
  const femaleAgeData: AgeData[] = [
    { name: '20-24', value: 1 },
    { name: '25-29', value: 1 },
    { name: '30-34', value: 1 }
  ];

  // Data completeness information
  const missingDataFields: MissingDataField[] = [
    { field: 'Postcode', missing: 63, percentage: 17.7 },
    { field: 'DOB', missing: 7, percentage: 2.0 },
    { field: 'Gender', missing: 0, percentage: 0 }
  ];

  // Missing data by age group
  const missingDataByAge: AgeData[] = [
    { name: 'Under 18', value: 1 },
    { name: '18-24', value: 15 },
    { name: '25-34', value: 32 },
    { name: '35-44', value: 10 },
    { name: '45+', value: 3 },
    { name: 'Unknown', value: 2 }
  ];

  // Distance data - Approximate distances from CF11 8BR to other postcodes (in miles)
  const postcodeDistances: DistanceData[] = [
    { name: 'CF11', value: 36, distance: 0 },
    { name: 'CF10', value: 15, distance: 1 },
    { name: 'CF5', value: 55, distance: 2 },
    { name: 'CF24', value: 29, distance: 3 },
    { name: 'CF14', value: 29, distance: 4 },
    { name: 'CF3', value: 21, distance: 4 },
    { name: 'CF64', value: 26, distance: 5 },
    { name: 'CF23', value: 8, distance: 5 },
    { name: 'CF62', value: 19, distance: 8 },
    { name: 'CF63', value: 9, distance: 10 },
    { name: 'Other CF', value: 46, distance: 6 }
  ];

  // Group participants by distance bands
  const distanceBands: DistanceBandData[] = [
    { name: '0-2 miles', value: 0, color: '#0088FE' },
    { name: '2-4 miles', value: 0, color: '#00C49F' },
    { name: '4-6 miles', value: 0, color: '#FFBB28' },
    { name: '6+ miles', value: 0, color: '#FF8042' }
  ];

  // Calculate total participants by distance band
  postcodeDistances.forEach(item => {
    if (item.distance <= 2) {
      distanceBands[0].value += item.value;
    } else if (item.distance <= 4) {
      distanceBands[1].value += item.value;
    } else if (item.distance <= 6) {
      distanceBands[2].value += item.value;
    } else {
      distanceBands[3].value += item.value;
    }
  });

  // Calculate total participants with known postcodes
  const totalParticipantsWithPostcode = postcodeDistances.reduce((sum, item) => sum + item.value, 0);

  // Prepare data for scatter plot visualization
  const scatterData = postcodeDistances.map(item => ({
    x: item.distance,
    y: item.value,
    z: item.value,
    name: item.name
  }));

  // Recommendations
  const recommendations: Recommendation[] = [
    {
      title: 'Gender Diversity Initiatives',
      description: 'Develop the current womens league. With just 0.8% female participants, this presents a major growth opportunity.'
    },
    {
      title: 'Age-Specific Strategies',
      description: 'Focus on the 24-27 age range where we have the most participants (28%).'
    },
    {
      title: 'Youth Development',
      description: 'With only 4% of participants under 18, there is an opportunity to target 16 - 18 year olds which is currently missed between the youth and full leagues.'
    },
    {
      title: 'Data Collection Improvement',
      description: 'Focus on collecting complete postcode information (18% missing) to better understand geographic distribution and target marketing efforts.'
    }
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
  const GENDER_COLORS = ['#0088FE', '#FF8042'];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">League Participants Dashboard</h1>
        
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
              className={`px-4 py-2 rounded ${viewType === 'distance' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('distance')}
            >
              Distance
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
                Analysis of 356 organisers in our leagues. 
                This dashboard provides insights into demographics and geographical distribution of our player base.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Participants</p>
                  <p className="text-3xl font-bold text-blue-600">356</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Male/Female Ratio</p>
                  <p className="text-3xl font-bold text-green-600">118:1</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Primary Age Group</p>
                  <p className="text-3xl font-bold text-purple-600">24-27</p>
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
                    <li>Core demographic is 24-27 year olds (28%)</li>
                    <li>Sharp participation drop-off after age 35</li>
                    <li>Peak participation at ages 24-25 (57 participants)</li>
                    <li>Only 13 participants (3.7%) under age 18</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Geographic Reach</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Most participants from Cardiff areas (CF postcodes)</li>
                    <li>Top areas: CF5 (55), CF11 (36), CF14/CF24 (29 each)</li>
                    <li>63 missing postcodes (17.7% of records)</li>
                    <li>CF5 postcode area accounts for 18.8% of participants</li>
                    <li>{distanceBands[0].value} participants ({((distanceBands[0].value / totalParticipantsWithPostcode) * 100).toFixed(1)}%) live within 2 miles of our center</li>
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
                  There is a striking gender imbalance with 99.2% male participants (353) and only 0.8% female participants (3).
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
                  Peak participation is at ages 24-25 (57 participants), with 26-27 being the second highest (41 participants).
                  There&apos;s a sharp decline after age 35. 7 participants (2.0%) have no recorded date of birth.
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
                      <li>Peak participation: 24-25 year olds (57 participants)</li>
                      <li>Second highest: 26-27 year olds (41 participants)</li>
                      <li>Significant group: 20-21 year olds (33 participants)</li>
                      <li>Sharp decline after age 35 (only 13 participants aged 36-37)</li>
                      <li>Minimal participation from under-16 age group (only 2 participants)</li>
                      <li>Age 40+ participants (29) represent 8.3% of the total</li>
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
                      No significant seasonal patterns. Birth months are relatively evenly distributed throughout the year.
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
                      <li>Only 3 female participants out of 356 total (0.8%)</li>
                      <li>Female participants are evenly distributed across different age ranges</li>
                      <li>No female participants under 20 or over 35</li>
                      <li>Major opportunity to increase female participation through targeted initiatives</li>
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
                    <li>Most common area: CF5 (55 participants, 18.8% of known postcodes)</li>
                    <li>Second highest: CF11 (36 participants, 12.3% of known postcodes)</li>
                    <li>Strong representation from CF14 and CF24 (29 participants each)</li>
                    <li>CF64 shows good participation (26 participants) despite greater distance</li>
                    <li>63 participants (17.7%) have missing postcode data</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Geographic Expansion Opportunities</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Target underrepresented postcode areas with focused marketing campaigns</li>
                    <li>Improve postcode data collection to better understand geographic distribution</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Top Postcode Areas</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={postcodeData.filter(d => d.name !== 'Missing' && d.name !== 'Other CF')} 
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Number of Participants" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {viewType === 'distance' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Distance Analysis</h2>
            <p className="text-gray-700 mb-4">
              Analysis of participant distance from our centre (CF11 8BR).
              This helps identify catchment areas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Participants by Distance Band</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distanceBands}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {distanceBands.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  {distanceBands[0].value} participants ({((distanceBands[0].value / totalParticipantsWithPostcode) * 100).toFixed(1)}%) 
                  live within 2 miles of our center, while {distanceBands[3].value} participants 
                  ({((distanceBands[3].value / totalParticipantsWithPostcode) * 100).toFixed(1)}%) travel more than 6 miles.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Postcode Areas by Distance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Distance" 
                        unit=" miles" 
                        label={{ value: 'Distance from Center (miles)', position: 'bottom', offset: 0 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="Participants" 
                        label={{ value: 'Number of Participants', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => {
                          if (name === 'Distance') return [`${value} miles`, name];
                          return [value, name];
                        }}
                        labelFormatter={(value) => `${scatterData.find(d => d.x === value)?.name || ''}`}
                      />
                      <Scatter name="Postcode Areas" data={scatterData} fill="#8884d8">
                        {scatterData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0088FE' : '#00C49F'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  The scatter plot shows the number of participants from each postcode area versus their distance from the center.
                  CF5 (2 miles away) has the highest concentration of participants.
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Distance Analysis Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Key Distance Insights</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Most participants ({postcodeDistances[2].value}) come from CF5, just 2 miles away</li>
                    <li>{((distanceBands[0].value / totalParticipantsWithPostcode) * 100).toFixed(1)}% of participants live within 2 miles of the center</li>
                    <li>{((distanceBands[1].value / totalParticipantsWithPostcode) * 100).toFixed(1)}% travel between 2-4 miles</li>
                    <li>Even with a 10-mile distance, CF63 still contributes {postcodeDistances[9].value} participants</li>
                    <li>Strong presence in immediate area (CF11) with {postcodeDistances[0].value} participants</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Geographical Opportunities</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Target marketing in CF24 (3 miles away) with {postcodeDistances[3].value} participants already</li>
                  </ul>
                </div>
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
                <h4 className="font-semibold mb-2">Data Quality Recommendations</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Focus on collecting complete postcode information (missing for 17.7% of participants)</li>
                  <li>Improve collection of date of birth data (missing for 2.0% of participants)</li>
                  <li>Consider collecting additional demographic information (e.g., playing experience, how they heard about the leagues)</li>
                  <li>Implement standardised data collection processes for registration</li>
                  <li>Create a system to periodically verify and update participant information</li>
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
                    <li>Develop women-only leagues</li>
                    <li>Develop marketing campaigns targeting the 24-27 age demographic</li>
                    <li>Improve data collection processes for more complete information</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-yellow-600">Medium Priority</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Establish youth development programs for players between 18 and 20</li>
                    <li>Explore new targeted marketing in underrepresented geographic areas</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-green-600">Future Initiatives</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Develop specialised offerings for players aged 35+</li>
                    <li>Implement referral programs to incentivise current players to bring new participants</li>
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

export default LeagueParticipantsDashboard;