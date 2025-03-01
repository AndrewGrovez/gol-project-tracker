"use client";

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';

interface TooltipPayload {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// Define TypeScript interfaces
interface ChurnData {
  league: string;
  shortLeague?: string;
  day: string;
  format: string;
  date: string;
  month: string;
  year: number;
  totalTeams: number;
  teamsLost: number;
  churnRate: number;
  season?: string;
  seasonNumber?: number;
  isLatestSeason?: boolean;
  prevSeasonChurn?: number;
  churnChange?: number;
}

interface LeagueChurnSummary {
  league: string;
  shortLeague: string;
  avgChurn: number;
  totalEntries: number;
  day: string;
  format: string;
  totalTeams: number;
  year: number;
  month: string;
}

interface DayChurnSummary {
  day: string;
  avgChurn: number;
  latestAvgChurn: number;
  totalEntries: number;
  totalTeams: number;
}

interface FormatChurnSummary {
  format: string;
  avgChurn: number;
  latestAvgChurn: number;
  totalEntries: number;
  totalTeams: number;
}

interface SeasonChurnSummary {
  season: string;
  avgChurn: number;
  totalEntries: number;
}

interface YearChurnSummary {
  year: number;
  avgChurn: number;
  totalSeasons: number;
  totalTeams: number;
}

// Raw data – you can replace this with an API call in a real implementation
const rawData = `League/Start Date	Total Teams	Teams Lost	Churn Rate (%)
Monday 5s - March 24 60 7 11.67
Monday 5s - June 24 62 7 11.29
Monday 5s - September 24 64 6 9.38
Monday 7s - June 23 11 3 27.27
Monday 7s - October 23 10 2 20.00
Monday 7s - March 24 10 2 20.00
Monday 7s - July 24 10 1 10.00
Tuesday 5s - August 23 32 9 28.13
Tuesday 5s - November 23 36 12 33.33
Tuesday 5s - March 24 32 12 37.50
Tuesday 5s - July 24 30 3 10.00
Tuesday Works - June 23 12 2 16.67
Tuesday Works - September 23 12 3 25.00
Tuesday Works - January 24 12 2 16.67
Tuesday Works - May 24 12 5 41.67
Tuesday Works - August 24 8 0 0.00
Wednesday 5s - July 23 30 3 10.00
Wednesday 5s - October 23 32 7 21.88
Wednesday 5s - February 24 30 4 13.33
Wednesday 5s - May 24 30 10 33.33
Wednesday 5s - September 24 28 6 21.43
Wednesday Works - August 23 15 5 33.33
Wednesday Works - December 23 14 5 35.71
Wednesday Works - March 24 12 4 33.33
Wednesday Works - July 24 8 2 25.00
Wednesday Works - October 24 12 2 16.67
Thursday 5s - August 23 18 5 27.78
Thursday 5s - November 23 25 9 36.00
Thursday 5s - March 24 20 2 10.00
Thursday 5s - June 24 22 8 36.36
Thursday 5s - October 24 20 3 15.00
Thursday Works - September 23 6 3 50.00
Thursday Works - November 23 12 2 16.67
Thursday Works - March 24 14 4 28.57
Thursday Works - June 24 12 5 41.67
Thursday Works - October 24 11 1 9.09
Sunday 5s - September 23 16 2 12.50
Sunday 5s - January 24 22 2 9.09
Sunday 5s - April 24 22 7 31.82
Sunday 5s - July 24 18 3 16.67`;

// Custom tooltip component
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="font-bold">{label}</p>
        {payload.map((entry: TooltipPayload, index: number) => (
          <p key={index}>
            {entry.name}: {entry.value}{entry.name.includes('Churn') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChurnAnalysisPage: React.FC = () => {
  const [viewType, setViewType] = useState<string>('byLeague');

  // Process the raw data
  const processData = (): ChurnData[] => {
    const lines = rawData.split('\n').slice(1);
    const data: ChurnData[] = [];

    // Maps for month and season info
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const seasonMap: Record<string, string> = {
      'December': 'Winter', 'January': 'Winter', 'February': 'Winter',
      'March': 'Spring', 'April': 'Spring', 'May': 'Spring',
      'June': 'Summer', 'July': 'Summer', 'August': 'Summer',
      'September': 'Autumn', 'October': 'Autumn', 'November': 'Autumn'
    };

    const dayAbbrev: Record<string, string> = {
      "Monday": "Mon",
      "Tuesday": "Tue",
      "Wednesday": "Wed",
      "Thursday": "Thu",
      "Friday": "Fri",
      "Saturday": "Sat",
      "Sunday": "Sun"
    };

    const monthAbbrev: Record<string, string> = {
      "January": "Jan",
      "February": "Feb",
      "March": "Mar",
      "April": "Apr",
      "May": "May",
      "June": "Jun",
      "July": "Jul",
      "August": "Aug",
      "September": "Sep",
      "October": "Oct",
      "November": "Nov",
      "December": "Dec"
    };

    // Group by league string (each group is unique per start date)
    const leagueSequences: Record<string, ChurnData[]> = {};

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.trim().split(' ');
      if (parts.length < 8) return; // Expect at least 8 tokens
      const day = parts[0];
      const format = parts[1];
      const monthStr = parts[3];
      const yearStr = parts[4];
      const year = parseInt(yearStr);
      if (isNaN(year)) return;

      const leagueType = parts.slice(0, 5).join(' ');
      const totalTeams = parseInt(parts[5]);
      const teamsLost = parseInt(parts[6]);
      const churnRate = parseFloat(parts[7]);

      const dataPoint: ChurnData = {
        league: leagueType,
        day,
        format,
        date: `${monthStr} ${yearStr}`,
        month: monthStr,
        year,
        totalTeams,
        teamsLost,
        churnRate,
        season: seasonMap[monthStr] || 'Unknown'
      };

      dataPoint.shortLeague = `${dayAbbrev[day] || day} ${format} - ${monthAbbrev[monthStr] || monthStr} ${yearStr}`;

      data.push(dataPoint);

      if (!leagueSequences[leagueType]) {
        leagueSequences[leagueType] = [];
      }
      leagueSequences[leagueType].push(dataPoint);
    });

    // For each league group, sort by date and assign season numbers
    Object.keys(leagueSequences).forEach(league => {
      leagueSequences[league].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (monthMap[a.month] || 0) - (monthMap[b.month] || 0);
      });
      leagueSequences[league].forEach((item, index) => {
        item.seasonNumber = index + 1;
        item.isLatestSeason = index === leagueSequences[league].length - 1;
        if (index > 0) {
          const prevSeason = leagueSequences[league][index - 1];
          item.prevSeasonChurn = prevSeason.churnRate;
          item.churnChange = item.churnRate - prevSeason.churnRate;
        }
      });
    });

    return data;
  };

  const processedData = processData();

  // ---------------------------
  // By League tab: group by league and order by start date (earliest first)
  const leagueTypes = [...new Set(processedData.map(item => item.league))];
  const churnByLeague: LeagueChurnSummary[] = leagueTypes.map(league => {
    const leagueData = processedData.filter(item => item.league === league);
    const totalTeamsHist = leagueData.reduce((sum, item) => sum + item.totalTeams, 0);
    const totalLostHist = leagueData.reduce((sum, item) => sum + item.teamsLost, 0);
    const historicalAvgChurn = totalTeamsHist ? (totalLostHist / totalTeamsHist) * 100 : 0;
    const latestSeasonData = leagueData.find(item => item.isLatestSeason);
    const totalTeamsLatest = latestSeasonData ? latestSeasonData.totalTeams : 0;
    return {
      league,
      shortLeague: leagueData[0].shortLeague || league,
      avgChurn: Number(historicalAvgChurn.toFixed(2)),
      totalEntries: leagueData.length,
      day: leagueData[0].day,
      format: leagueData[0].format,
      totalTeams: totalTeamsLatest,
      year: leagueData[0].year,
      month: leagueData[0].month
    };
  }).sort((a, b) => {
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    if (a.year !== b.year) return a.year - b.year;
    return (monthMap[a.month] || 0) - (monthMap[b.month] || 0);
  });

  // ---------------------------
  // By Day tab:
  //   - TOTAL TEAMS of all time (sum over all entries for that day)
  //   - Historical average churn (weighted over all entries for that day)
  //   - Latest churn computed only from the most recent entry per format for that day.
  const days = [...new Set(processedData.map(item => item.day))];
  const churnByDay: DayChurnSummary[] = days.map(day => {
    const dayData = processedData.filter(item => item.day === day);
    const totalTeamsAllTime = dayData.reduce((sum, item) => sum + item.totalTeams, 0);
    const totalLostHist = dayData.reduce((sum, item) => sum + item.teamsLost, 0);
    const historicalAvgChurn = totalTeamsAllTime ? (totalLostHist / totalTeamsAllTime) * 100 : 0;

    // Group by format and select the most recent entry per format
    const formatsForDay = [...new Set(dayData.map(item => item.format))];
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    const latestEntries: ChurnData[] = [];
    formatsForDay.forEach(fmt => {
      const entries = dayData.filter(item => item.format === fmt);
      let latestEntry: ChurnData | null = null;
      entries.forEach(entry => {
        if (!latestEntry) {
          latestEntry = entry;
        } else if (entry.year > latestEntry.year) {
          latestEntry = entry;
        } else if (entry.year === latestEntry.year && (monthMap[entry.month] || 0) > (monthMap[latestEntry.month] || 0)) {
          latestEntry = entry;
        }
      });
      if (latestEntry) {
        latestEntries.push(latestEntry);
      }
    });
    const totalTeamsLatest = latestEntries.reduce((sum, item) => sum + item.totalTeams, 0);
    const totalLostLatest = latestEntries.reduce((sum, item) => sum + item.teamsLost, 0);
    const latestAvgChurn = totalTeamsLatest ? (totalLostLatest / totalTeamsLatest) * 100 : 0;

    return {
      day,
      avgChurn: Number(historicalAvgChurn.toFixed(2)),
      latestAvgChurn: Number(latestAvgChurn.toFixed(2)),
      totalEntries: dayData.length,
      totalTeams: totalTeamsAllTime
    };
  }).sort((a, b) => {
    const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return order.indexOf(a.day) - order.indexOf(b.day);
  });

  // ---------------------------
  // By Format tab: historical average is weighted; latest average is computed from the overall latest season for that format.
  const formats = [...new Set(processedData.map(item => item.format))];
  const churnByFormat: FormatChurnSummary[] = formats.map(format => {
    const formatData = processedData.filter(item => item.format === format);
    const totalTeamsHist = formatData.reduce((sum, item) => sum + item.totalTeams, 0);
    const totalLostHist = formatData.reduce((sum, item) => sum + item.teamsLost, 0);
    const historicalAvgChurn = totalTeamsHist ? (totalLostHist / totalTeamsHist) * 100 : 0;
    // Determine the overall latest season for this format.
    const maxYear = Math.max(...formatData.map(item => item.year));
    const candidates = formatData.filter(item => item.year === maxYear);
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    const maxMonth = Math.max(...candidates.map(item => monthMap[item.month] || 0));
    const latestSeasonData = formatData.filter(item => item.year === maxYear && (monthMap[item.month] || 0) === maxMonth);
    const totalTeamsLatest = latestSeasonData.reduce((sum, item) => sum + item.totalTeams, 0);
    const totalLostLatest = latestSeasonData.reduce((sum, item) => sum + item.teamsLost, 0);
    const latestAvgChurn = totalTeamsLatest ? (totalLostLatest / totalTeamsLatest) * 100 : 0;
    return {
      format,
      avgChurn: Number(historicalAvgChurn.toFixed(2)),
      latestAvgChurn: Number(latestAvgChurn.toFixed(2)),
      totalEntries: formatData.length,
      totalTeams: totalTeamsLatest
    };
  }).sort((a, b) => b.avgChurn - a.avgChurn);

  // ---------------------------
  // Other tabs (By Season, By Year) remain unchanged.
  const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];
  const churnBySeason: SeasonChurnSummary[] = seasons.map(season => {
    const seasonData = processedData.filter(item => item.season === season);
    const totalTeamsHist = seasonData.reduce((sum, item) => sum + item.totalTeams, 0);
    const totalLostHist = seasonData.reduce((sum, item) => sum + item.teamsLost, 0);
    const historicalAvgChurn = totalTeamsHist ? (totalLostHist / totalTeamsHist) * 100 : 0;
    return {
      season,
      avgChurn: Number(historicalAvgChurn.toFixed(2)),
      totalEntries: seasonData.length
    };
  }).sort((a, b) => b.avgChurn - a.avgChurn);

  const years = [...new Set(processedData.map(item => item.year))];
  const churnByYear: YearChurnSummary[] = years.map(year => {
    const yearData = processedData.filter(item => item.year === year);
    const totalTeamsHist = yearData.reduce((sum, item) => sum + item.totalTeams, 0);
    const totalLostHist = yearData.reduce((sum, item) => sum + item.teamsLost, 0);
    const historicalAvgChurn = totalTeamsHist ? (totalLostHist / totalTeamsHist) * 100 : 0;
    return {
      year,
      avgChurn: Number(historicalAvgChurn.toFixed(2)),
      totalSeasons: yearData.length,
      totalTeams: totalTeamsHist
    };
  }).sort((a, b) => a.year - b.year);

  // Compute highest and lowest historical churn days from churnByDay
  const highestChurnDay = churnByDay.reduce((prev, curr) => (curr.avgChurn > prev.avgChurn ? curr : prev));
  const lowestChurnDay = churnByDay.reduce((prev, curr) => (curr.avgChurn < prev.avgChurn ? curr : prev));

  return (
    <div className="p-4 w-full">
      <h1 className="text-3xl font-bold mb-6">League Churn Rate Analysis</h1>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button className={`px-4 py-2 rounded ${viewType === 'byLeague' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setViewType('byLeague')}>By League</button>
          <button className={`px-4 py-2 rounded ${viewType === 'byDay' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setViewType('byDay')}>By Day</button>
          <button className={`px-4 py-2 rounded ${viewType === 'byFormat' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setViewType('byFormat')}>By Format</button>
          <button className={`px-4 py-2 rounded ${viewType === 'bySeason' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setViewType('bySeason')}>By Season</button>
        </div>

        {viewType === 'byLeague' && (
          <div>
            <h2 className="text-xl font-bold mb-2">Average Churn Rate by League</h2>
            <p className="mb-4">
              Showing average churn rate (left axis) and total teams (right axis) for each league, ordered by start date (earliest first).
            </p>
            <div className="w-full">
              <div className="h-[48rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnByLeague} margin={{ top: 20, right: 60, left: 20, bottom: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortLeague" angle={-45} textAnchor="end" height={100} interval={0} />
                    <YAxis label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Total Teams', angle: 90, position: 'insideRight' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="avgChurn" name="Avg Churn Rate (%)" fill="#8884d8" />
                    <Bar dataKey="totalTeams" name="Total Teams" fill="#ffc658" yAxisId="right" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {viewType === 'byDay' && (
          <div>
            <h2 className="text-xl font-bold mb-2">Average Churn Rate by Day</h2>
            <p className="mb-4">
              This chart shows:
              <br />
              • Total Teams (all teams for that day)
              <br />
              • Historical Average Churn Rate (across all leagues for that day)
              <br />
              • Latest Churn Rate computed only from the most recent entry per format (e.g. for Monday, the latest 5‑a‑side and 7‑a‑side)
            </p>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnByDay} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="totalTeams" name="Total Teams (All Time)" fill="#ffc658" />
                  <Bar dataKey="avgChurn" name="Historical Avg Churn (%)" fill="#8884d8" />
                  <Bar dataKey="latestAvgChurn" name="Latest Avg Churn (%)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewType === 'byFormat' && (
          <div>
            <h2 className="text-xl font-bold mb-2">Average Churn Rate by Format</h2>
            <p className="mb-4">
              Comparing weighted historical churn rate and latest season churn rate for each format.
            </p>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnByFormat} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="format" />
                  <YAxis label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="avgChurn" name="Historical Avg Churn (%)" fill="#8884d8" />
                  <Bar dataKey="latestAvgChurn" name="Latest Avg Churn (%)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewType === 'bySeason' && (
          <div>
            <h2 className="text-xl font-bold mb-2">Average Churn Rate by Season</h2>
            <p className="mb-4">Analysing if leagues starting during certain seasons of the year have higher churn rates.</p>
            <div className="h-96 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnBySeason} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="avgChurn" name="Avg Churn Rate (%)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <h2 className="text-xl font-bold mt-8 mb-2">Churn Rate by Year</h2>
            <p className="mb-4">Analysing year-over-year trends in churn rates.</p>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={churnByYear} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="avgChurn" name="Avg Churn Rate (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Key Insights Section */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Format Comparison</h3>
            <p>
              Works leagues have an average churn rate of {churnByFormat.find(f => f.format === 'Works')?.avgChurn}%,
              while 5s leagues have {churnByFormat.find(f => f.format === '5s')?.avgChurn}% and
              7s leagues have {churnByFormat.find(f => f.format === '7s')?.avgChurn}%.
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Day of Week Impact</h3>
            <p>
              The highest historical churn day is {highestChurnDay.day} ({highestChurnDay.avgChurn}%),
              while the lowest is {lowestChurnDay.day} ({lowestChurnDay.avgChurn}%).
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Seasonal Trends</h3>
            <p>
              Leagues starting in {churnBySeason[0]?.season} have the highest average churn ({churnBySeason[0]?.avgChurn}%),
              while {churnBySeason[churnBySeason.length-1]?.season} starts have the lowest ({churnBySeason[churnBySeason.length-1]?.avgChurn}%).
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">League Size Correlation</h3>
            <p>
              Larger leagues (e.g. Monday 5s, Tuesday 5s) tend to have more stable retention rates compared to smaller leagues (Works leagues).
            </p>
          </div>
        </div>
      </div>

      {/* Action Plan Section */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Action Plan</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2 text-red-600">High Priority</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Survey teams in high-churn Works leagues to identify specific issues</li>
              <li>Document and analyse retention practices from Monday 5s leagues</li>
              <li>Implement an early warning system for teams at risk of leaving</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2 text-yellow-600">Medium Priority</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Redesign season structure for Works leagues based on feedback</li>
              <li>Test adjusted division sizes in select leagues</li>
              <li>Create loyalty incentives for upcoming season registrations</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2 text-green-600">Future Initiatives</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Implement scheduling changes to minimise Spring season starts</li>
              <li>Consolidate the smallest leagues with chronic retention issues</li>
              <li>Develop a comprehensive new team onboarding programme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurnAnalysisPage;