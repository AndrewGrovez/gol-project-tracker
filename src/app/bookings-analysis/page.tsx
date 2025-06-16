'use client';

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart,
  Line
} from 'recharts';

// Define interfaces for our data
interface BookingsByDay {
  name: string;
  bookings: number;
}

interface BookingsByTime {
  time: string;
  bookings: number;
  revenue: number;
}

interface BookingsByProduct {
  name: string;
  value: number;
}

interface RevenueByProduct {
  name: string;
  value: number;
}

interface MonthlyBooking {
  month: string;
  bookings: number;
  revenue: number;
}

interface WeeklyBooking {
  week: string;
  bookings: number;
  revenue: number;
  label?: string; // For display label
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
            {entry.name.includes('Revenue') ? '£' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BookingAnalysisDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<string>('overview');

  // Bookings by day of week data
  const bookingsByDay: BookingsByDay[] = [
    { name: 'Sunday', bookings: 588 },
    { name: 'Monday', bookings: 518 },
    { name: 'Tuesday', bookings: 947 },
    { name: 'Wednesday', bookings: 1120 },
    { name: 'Thursday', bookings: 1415 },
    { name: 'Friday', bookings: 215 },
    { name: 'Saturday', bookings: 273 }
  ];

  // Bookings by time slot data (showing only slots with significant bookings)
  const bookingsByTime: BookingsByTime[] = [
    { time: '09:00', bookings: 130, revenue: 8026.50 },
    { time: '10:00', bookings: 143, revenue: 9463.00 },
    { time: '11:00', bookings: 126, revenue: 8669.00 },
    { time: '12:00', bookings: 81, revenue: 5713.50 },
    { time: '13:00', bookings: 54, revenue: 3693.00 },
    { time: '14:00', bookings: 43, revenue: 3120.00 },
    { time: '15:00', bookings: 40, revenue: 2766.00 },
    { time: '16:00', bookings: 29, revenue: 1943.50 },
    { time: '17:00', bookings: 315, revenue: 18956.50 },
    { time: '17:15', bookings: 156, revenue: 7671.75 },
    { time: '18:00', bookings: 1067, revenue: 67394.50 },
    { time: '19:00', bookings: 1147, revenue: 72837.00 },
    { time: '20:00', bookings: 1161, revenue: 71404.00 },
    { time: '21:00', bookings: 450, revenue: 30336.00 }
  ];

  // Product distribution data
  const bookingsByProduct: BookingsByProduct[] = [
    { name: '5s BB', value: 2184 },
    { name: '5s Hire', value: 1593 },
    { name: '7s BB', value: 713 },
    { name: '7s Hire', value: 394 },
    { name: '5s Hire Youth', value: 129 },
    { name: '5s Youth BB', value: 63 }
  ];

  // Revenue by product
  const revenueByProduct: RevenueByProduct[] = [
    { name: '5s BB', value: 123451.00 },
    { name: '5s Hire', value: 99248.75 },
    { name: '7s BB', value: 56507.00 },
    { name: '7s Hire', value: 34796.00 },
    { name: '5s Hire Youth', value: 4700.00 },
    { name: '5s Youth BB', value: 2633.00 }
  ];

  // Monthly booking trends (Mar 2024 - Feb 2025)
  const monthlyBookings: MonthlyBooking[] = [
    { month: 'Mar 2024', bookings: 397, revenue: 23907.00 },
    { month: 'Apr 2024', bookings: 468, revenue: 27736.00 },
    { month: 'May 2024', bookings: 427, revenue: 26338.00 },
    { month: 'Jun 2024', bookings: 400, revenue: 24351.00 },
    { month: 'Jul 2024', bookings: 434, revenue: 27348.00 },
    { month: 'Aug 2024', bookings: 368, revenue: 24228.00 },
    { month: 'Sep 2024', bookings: 435, revenue: 29072.75 },
    { month: 'Oct 2024', bookings: 514, revenue: 33515.00 },
    { month: 'Nov 2024', bookings: 412, revenue: 26578.00 },
    { month: 'Dec 2024', bookings: 293, revenue: 18903.00 },
    { month: 'Jan 2025', bookings: 478, revenue: 30439.25 },
    { month: 'Feb 2025', bookings: 450, revenue: 28919.75 }
  ];

  // Weekly booking trends (selecting key weeks throughout the year)
  const weeklyBookings: WeeklyBooking[] = [
    // Spring 2024
    { week: '2024-W10', bookings: 104, revenue: 6061.00, label: 'Week 10' },
    { week: '2024-W14', bookings: 117, revenue: 6876.00, label: 'Week 14' },
    { week: '2024-W18', bookings: 111, revenue: 6819.00, label: 'Week 18' },
    { week: '2024-W22', bookings: 101, revenue: 6157.00, label: 'Week 22' },
    // Summer 2024
    { week: '2024-W26', bookings: 102, revenue: 6473.00, label: 'Week 26' },
    { week: '2024-W30', bookings: 116, revenue: 7168.00, label: 'Week 30' },
    { week: '2024-W34', bookings: 88, revenue: 5702.00, label: 'Week 34' },
    { week: '2024-W38', bookings: 101, revenue: 6634.00, label: 'Week 38' },
    // Fall 2024
    { week: '2024-W42', bookings: 132, revenue: 8529.00, label: 'Week 42' },
    { week: '2024-W46', bookings: 107, revenue: 6915.00, label: 'Week 46' },
    { week: '2024-W50', bookings: 82, revenue: 5278.00, label: 'Week 50' },
    // Winter 2024/2025
    { week: '2025-W02', bookings: 126, revenue: 7834.00, label: 'Week 2' },
    { week: '2025-W06', bookings: 106, revenue: 6877.75, label: 'Week 6' }
  ];

  // Seasonal analysis data (quarters)
  const quarterlyData = [
    { name: 'Spring (Mar-May)', bookings: 1292, revenue: 77981.00 },
    { name: 'Summer (Jun-Aug)', bookings: 1202, revenue: 75927.00 },
    { name: 'Autumn (Sep-Nov)', bookings: 1361, revenue: 89165.75 },
    { name: 'Winter (Dec-Feb)', bookings: 1221, revenue: 78262.00 }
  ];

  // Recommendations based on data insights
  const recommendations: Recommendation[] = [
    {
      title: 'Weekend Promotion Strategy',
      description: 'Create special weekend packages or tournaments to boost Friday-Saturday bookings, which account for only 9.6% of all bookings despite having prime hours available.'
    },
    {
      title: 'Seasonal Balancing',
      description: 'Implement seasonal promotions for traditionally slower periods such as August (368 bookings) and December (293 bookings) to match peak months like October (514 bookings).'
    },
    {
      title: 'Youth Programme Expansion',
      description: 'Develop the youth booking segment (currently only 3.8% of bookings) by creating youth team and school partnerships, especially during underutilised daytime hours.'
    },
    {
      title: 'Time-Based Pricing Structure',
      description: 'Introduce dynamic pricing for high-demand slots (18:00-20:00 account for 66.5% of all bookings) and discounted rates for off-peak times to optimise facility usage.'
    },
    {
      title: 'Corporate Daytime Programme',
      description: 'Target local businesses with special daytime packages (13:00-16:00) which currently account for only 3.2% of bookings, potentially offering inclusive catering or meeting facilities.'
    }
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
  const TIME_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const PRODUCT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Calculate stats for overview
  const totalBookings = 5076;
  const totalRevenue = 321335.75;
  const avgMonthlyBookings = Math.round(totalBookings / 12);
  const avgDailyBookings = Math.round(totalBookings / 365);

  // Custom label formatter for pie charts to prevent overlap
  const renderCustomizedLabel = ({ name, percent }: { name: string, percent: number }) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Annual Booking Analysis Dashboard (Mar 2024 - Feb 2025)</h1>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              className={`px-4 py-2 rounded ${viewType === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewType === 'time-analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('time-analysis')}
            >
              Time Analysis
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewType === 'product-analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('product-analysis')}
            >
              Product Analysis
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewType === 'seasonal' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} 
              onClick={() => setViewType('seasonal')}
            >
              Seasonal Trends
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
              <h2 className="text-2xl font-semibold mb-4">Annual Overview</h2>
              <p className="text-gray-700 mb-4">
                Analysis of 5,076 bookings from March 2024 to February 2025.
                This dashboard provides comprehensive insights into booking patterns, product popularity, and revenue generation across a full year.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-blue-600">{totalBookings}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">£{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Monthly Avg</p>
                  <p className="text-3xl font-bold text-purple-600">{avgMonthlyBookings}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Daily Avg</p>
                  <p className="text-3xl font-bold text-yellow-600">{avgDailyBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Strengths</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Strong weekday bookings, especially Thursday (1,415 bookings)</li>
                    <li>Consistent evening demand (18:00-20:00 slots generate 66.5% of bookings)</li>
                    <li>5-A-Side block bookings provide reliable revenue (£123,451)</li>
                    <li>Autumn season shows strongest performance (1,361 bookings)</li>
                    <li>October is the peak month with 514 bookings (10.1% of annual total)</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Opportunities</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Weekend utilisation is low (Friday: 4.2%, Saturday: 5.4%)</li>
                    <li>Daytime slots (12:00-17:00) account for only 5.2% of all bookings</li>
                    <li>Youth bookings represent just 3.8% of total bookings</li>
                    <li>December shows significant seasonal drop (293 bookings)</li>
                    <li>Morning slots (09:00-12:00) have potential for growth (7.9% of bookings)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Annual Bookings by Month</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBookings} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="bookings" name="Number of Bookings" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  October shows the highest booking volume (514), while December has the lowest (293). There is a 75.4% difference between the peak and trough months.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Product Distribution</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={bookingsByProduct}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={renderCustomizedLabel}
                      >
                        {bookingsByProduct.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend layout="vertical" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  5-A-Side Block Bookings represent 43% of all bookings, followed by 5-A-Side Hire at 31.4%. Youth bookings (combined) make up only 3.8% of the total.
                </p>
              </div>
            </div>
          </div>
        )}

        {viewType === 'time-analysis' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Booking Time Analysis</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Bookings by Day of Week</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingsByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="bookings" name="Number of Bookings" fill="#8884d8">
                        {bookingsByDay.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Day of Week Insights</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Thursday is the busiest day (1,415 bookings, 27.9% of total)</li>
                      <li>Wednesday is the second busiest (1,120 bookings, 22.1%)</li>
                      <li>Tuesday ranks third (947 bookings, 18.7%)</li>
                      <li>Friday has the lowest utilisation (215 bookings, 4.2%)</li>
                      <li>Weekend days (Friday-Sunday) account for only 21.2% of bookings</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Booking Distribution</h4>
                    <p className="text-gray-700">
                      The data reveals a strong midweek pattern centered on Thursday, with a dramatic
                      decline on Friday. This pattern is consistent across all seasons, suggesting 
                      structural rather than seasonal factors. The weekend underutilisation represents
                      a significant opportunity for revenue growth, as these slots often go unfilled
                      despite having prime evening hours available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Time Slot Analysis</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Bookings by Time Slot</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingsByTime} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="bookings" name="Number of Bookings" fill="#00C49F">
                        {bookingsByTime.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TIME_COLORS[index % TIME_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Time Slot Insights</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>20:00 is the most popular time (1,161 bookings, 22.9%)</li>
                      <li>19:00 follows closely (1,147 bookings, 22.6%)</li>
                      <li>18:00 is third most popular (1,067 bookings, 21.0%)</li>
                      <li>Evening slots (17:00-21:00) account for 84.7% of bookings</li>
                      <li>Daytime slots (12:00-17:00) represent only 5.2%</li>
                      <li>Morning slots (09:00-12:00) account for 7.9%</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Time Utilisation Opportunities</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Implement tiered pricing to increase demand for off-peak hours</li>
                      <li>Create special daytime packages for schools and corporate clients</li>
                      <li>Target remote workers for lunchtime sessions (12:00-14:00)</li>
                      <li>Develop morning fitness programmes (09:00-11:00)</li>
                      <li>Consider maintenance and staff scheduling during naturally quieter periods</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Revenue by Time Slot Chart */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Revenue by Time Slot</h2>
              
              <div className="mb-8">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingsByTime} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue (£)" fill="#FF8042">
                        {bookingsByTime.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Revenue Insights</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>19:00 generates the highest revenue (£72,837, 22.7%)</li>
                      <li>20:00 is second (£71,404, 22.2%)</li>
                      <li>18:00 is third (£67,395, 21.0%)</li>
                      <li>Evening slots (17:00-21:00) generate 84.5% of revenue</li>
                      <li>Morning slots (09:00-12:00) generate 8.1% of revenue</li>
                      <li>Average revenue per booking is highest at 19:00 (£63.50)</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Revenue Optimisation Strategy</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Introduce premium pricing for prime evening slots (18:00-20:00)</li>
                      <li>Create value-added packages for afternoon slots (13:00-17:00)</li>
                      <li>Develop all-inclusive morning business packages with refreshments</li>
                      <li>Implement dynamic pricing based on historical booking patterns</li>
                      <li>Consider loyalty programmes to encourage repeat bookings in off-peak hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewType === 'product-analysis' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Product Analysis</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Bookings by Product</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={bookingsByProduct}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={renderCustomizedLabel}
                    >
                      {bookingsByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Product Insights</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>5-A-Side Block Booking is the most popular (2,184 bookings, 43.0%)</li>
                    <li>5-A-Side Hire represents 31.4% (1,593 bookings)</li>
                    <li>7-A-Side formats account for 21.8% (1,107 bookings)</li>
                    <li>Youth bookings are only 3.8% of total (192 bookings)</li>
                    <li>Block bookings overall represent 58.5% of all bookings</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Revenue Analysis</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={revenueByProduct}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Revenue (£)" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Product Strategy Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Current Strengths</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Block bookings provide stable, predictable revenue (£182,591)</li>
                    <li>5-A-Side format dominates with 74.4% of all bookings</li>
                    <li>5-A-Side products generate £230,033 in revenue (71.6% of total)</li>
                    <li>7-A-Side revenue contributes £91,303 (28.4% of total)</li>
                    <li>Average revenue per booking is consistent across all products</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Growth Opportunities</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Expand youth programmes (currently only 3.8% of bookings)</li>
                    <li>Create specialised products for underutilised time slots</li>
                    <li>Introduce premium products with value-added services</li>
                    <li>Develop programmes to convert casual hirers to block bookers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewType === 'seasonal' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Seasonal Analysis</h2>
            <p className="text-gray-700 mb-4">
              Analysis of booking patterns throughout the year, identifying seasonal trends and fluctuations.
            </p>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Monthly Booking Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyBookings} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                    <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="bookings" 
                      name="Number of Bookings" 
                      fill="#0088FE" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue (£)" 
                      stroke="#FF8042" 
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Monthly Pattern Insights</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>October has the highest booking volume (514 bookings)</li>
                    <li>December shows the lowest activity (293 bookings)</li>
                    <li>January shows strong recovery after December dip</li>
                    <li>Spring/Summer months (March-August) average 416 bookings per month</li>
                    <li>Autumn/Winter months (September-February) average 430 bookings per month</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Quarterly Analysis</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#82ca9d" />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue (£)" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Seasonal Planning Opportunities</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-blue-800 mb-1">Spring/Summer (Mar-Aug)</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Target schools for end-of-term tournaments in June/July</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-800 mb-1">Autumn/Winter (Sep-Feb)</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Launch specific December promotions to counter holiday dip</li>
                    <li>Create New Year fitness campaigns for January</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Selected Weekly Booking Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={weeklyBookings} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="bookings" name="Bookings" fill="#8884d8" />
                    <Bar dataKey="revenue" name="Revenue (£)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Selected weeks throughout the year show consistent booking patterns with notable peaks in October (Week 42) 
                and January (Week 2), and a significant dip in December (Week 50).
              </p>
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
                  <h4 className="font-bold text-md mb-2 text-red-600">Immediate Priorities (1-3 months)</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Introduce dynamic pricing structure for peak vs. off-peak hours</li>
                    <li>Develop weekend promotion packages for Friday/Saturday evenings</li>
                    <li>Launch corporate daytime package targeting local businesses</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-yellow-600">Medium-Term Goals (3-6 months)</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Establish youth league partnerships with local schools</li>
                    <li>Create loyalty programme for regular non-block bookers</li>
                    <li>Develop seasonal promotions calendar to balance demand</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-bold text-md mb-2 text-green-600">Long-Term Strategy (6-12 months)</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Create facility improvement plan based on usage patterns</li>
                    <li>Establish community partnerships for broader participation</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Expected Financial Impact</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential Revenue Increase</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Implementation Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Weekend Promotion Strategy</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£25,000 - £35,000 annually</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Medium</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Daytime Utilisation</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£15,000 - £20,000 annually</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Low</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Youth Programme Expansion</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£10,000 - £15,000 annually</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">High</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Time-Based Pricing</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£20,000 - £30,000 annually</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Medium</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Seasonal Balancing</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£8,000 - £12,000 annually</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Low</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingAnalysisDashboard;