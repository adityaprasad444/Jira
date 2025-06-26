import React, { useState } from 'react';
import './App.css';

const JIRA_HOST = 'upgrad-jira.atlassian.net'; // <-- Change to your Jira host

function parseTimeSpent(timeStr) {
  if (!timeStr) return 0;
  let total = 0;
  const hMatch = timeStr.match(/(\d+)h/);
  const mMatch = timeStr.match(/(\d+)m/);
  const sMatch = timeStr.match(/(\d+)s/);
  if (hMatch) total += parseInt(hMatch[1], 10) * 3600;
  if (mMatch) total += parseInt(mMatch[1], 10) * 60;
  if (sMatch) total += parseInt(sMatch[1], 10);
  return total;
}

function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s]
    .map(v => v < 10 ? '0' + v : v)
    .join(':');
}

function groupLogsByDate(logs) {
  //console.log('Raw logs:', logs);
  const grouped = {};
  logs.forEach(log => {
    // Normalize date to YYYY-MM-DD in UTC, skip if invalid
    if (!log.date || isNaN(new Date(log.date))) return;
    const date = new Date(log.date).toISOString().slice(0, 10);
    if (!grouped[date]) grouped[date] = { date, total_time_spent_seconds: 0, logs: [] };
    const seconds = parseTimeSpent(log.time_spent);
    grouped[date].total_time_spent_seconds += seconds;
    grouped[date].logs.push(log);
  });
  // Sort logs within each group by date (most recent first)
  Object.values(grouped).forEach(group => {
    group.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  const sortedGroups = Object.values(grouped).map(group => ({
    date: group.date, // This will be only YYYY-MM-DD
    total_time_spent: secondsToHMS(group.total_time_spent_seconds),
    logs: group.logs
  })).sort((a, b) => Number(b.date.replace(/-/g, '')) - Number(a.date.replace(/-/g, ''))); // Sort groups by date (descending)
  //console.log('Sorted date groups:', sortedGroups.map(g => g.date));
  return sortedGroups;
}

function App() {
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupedLogs, setGroupedLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDates, setExpandedDates] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGroupedLogs([]);
    try {
      // Use relative URL for API calls - works in both development and production
      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, startDate, endDate }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to fetch logs');
      } else if (Array.isArray(data.grouped_logs)) {
        // Use backend's grouped and sorted logs as-is
        setGroupedLogs(data.grouped_logs);
      } else if (Array.isArray(data.logs)) {
        // Only group and sort if backend sends raw logs
        const grouped = groupLogsByDate(data.logs);
        setGroupedLogs(grouped);
      } else {
        setGroupedLogs([]);
      }
    } catch (err) {
      setError('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="App">
      <h1>Jira Time Log Dashboard</h1>
      <form onSubmit={handleSubmit} className="email-form">
        <label htmlFor="email">Jira User Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <label htmlFor="start-date">Start Date:</label>
        <input
          type="date"
          id="start-date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          required
        />
        <label htmlFor="end-date">End Date:</label>
        <input
          type="date"
          id="end-date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Logs'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {groupedLogs.length > 0 && (
        <div className="grouped-logs">
          {groupedLogs.map((group, idx) => (
            <div key={idx} className="log-group">
              <div
                className="log-summary-row"
                onClick={() => toggleExpand(group.date)}
                style={{ cursor: 'pointer', background: '#eaf1fb', padding: '12px 18px', borderRadius: '6px', fontWeight: 600, color: '#357abd', marginBottom: expandedDates[group.date] ? 0 : 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <span>Date: {group.date}</span>
                <span style={{ marginLeft: 24 }}>Total: {group.total_time_spent}</span>
                <span style={{ marginLeft: 24 }}>Logs: {group.logs.length}</span>
                <span style={{ float: 'right', fontWeight: 400, color: '#2d3a4a' }}>{expandedDates[group.date] ? '▲' : '▼'}</span>
              </div>
              {expandedDates[group.date] && (
                <table className="logs-table" style={{ marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th>Issue Key</th>
                      <th>Summary</th>
                      <th>Time Spent</th>
                      <th>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.logs.map((log, i) => (
                      <tr key={i}>
                        <td>
                          <a
                            href={`https://${JIRA_HOST}/browse/${log.issue_key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#357abd', textDecoration: 'underline', fontWeight: 500 }}
                          >
                            {log.issue_key}
                          </a>
                        </td>
                        <td>{log.issue_summary}</td>
                        <td>{log.time_spent}</td>
                        <td>{log.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
      {groupedLogs.length === 0 && !loading && !error && (
        <p>No logs to display. Enter an email and fetch logs.</p>
      )}
    </div>
  );
}

export default App;
