const express = require('express');
const router = express.Router();
const JiraClient = require('jira-client');
require('dotenv').config();

// Jira credentials from .env
console.log('Initializing Jira client with:');
console.log('- Host:', process.env.JIRA_HOST);
console.log('- Email:', process.env.JIRA_EMAIL);
console.log('- API Token length:', process.env.JIRA_API_TOKEN ? process.env.JIRA_API_TOKEN.length : 'NOT SET');
console.log('JIRA_HOST value:', `[${process.env.JIRA_HOST}]`, 'length:', process.env.JIRA_HOST ? process.env.JIRA_HOST.length : 'undefined');

const jira = new JiraClient({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_EMAIL,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
});

// POST /api/time-logs
router.post('/', async (req, res) => {
  console.log('Received POST /api/time-logs with body:', req.body);
  console.log('JIRA_HOST:', process.env.JIRA_HOST);
  console.log('JIRA_EMAIL:', process.env.JIRA_EMAIL);
  // Do NOT log the API token for security reasons
  const { email, startDate, endDate } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    // First, get the Jira user accountId for the given email
    let jqlStartDate, jqlEndDate;
    if (startDate && endDate) {
      jqlStartDate = startDate.slice(0, 10);
      jqlEndDate = endDate.slice(0, 10);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      jqlStartDate = start.toISOString().slice(0, 10);
      jqlEndDate = end.toISOString().slice(0, 10);
    }

    // Jira Cloud API: find user by email to get accountId
    let accountId;
    try {
      console.log('Searching for Jira user with email:', email);
      const requestUri = jira.makeUri({
        pathname: '/user/search',
        query: { query: email }
      });
      const requestHeader = jira.makeRequestHeader(requestUri);
      //console.log('Request URI:', requestUri);
      //console.log('Request headers:', JSON.stringify(requestHeader, null, 2));
      
      const users = await jira.doRequest(requestHeader);
      //console.log('Jira user search response:', JSON.stringify(users, null, 2));
      if (!users || users.length === 0) {
        return res.status(404).json({ error: `No Jira user found for email: ${email}` });
      }
      accountId = users[0].accountId;
      console.log('Found accountId:', accountId);
    } catch (err) {
      //console.error(`[JIRA API ERROR] Failed to get user by email: ${err.message}`);
      //console.error('Full error object:', err);
      //console.error('Error response:', err.response?.data);
      //console.error('Error status:', err.response?.status);
      //console.error('Error code:', err.code);
      console.error('Error name:', err.name);
      return res.status(500).json({ error: 'Failed to get Jira user by email', details: err.message });
    }

    const jql = `worklogAuthor = "${accountId}" AND worklogDate >= "${jqlStartDate}" AND worklogDate <= "${jqlEndDate}"`;
    console.log(`[JIRA API] About to search issues with JQL: ${jql}`);
    const issues = await jira.searchJira(jql, { maxResults: 100 });
    console.log(`[JIRA API] Received ${issues.issues.length} issues for accountId: ${accountId}`);
    const logs = [];
    for (const issue of issues.issues) {
      const worklogs = await jira.getIssueWorklogs(issue.key);
      for (const worklog of worklogs.worklogs) {
        if (worklog.author && worklog.author.accountId === accountId) {
          logs.push({
            issue_key: issue.key,
            issue_summary: issue.fields.summary,
            time_spent_seconds: worklog.timeSpentSeconds,
            time_spent: worklog.timeSpent,
            date: worklog.started,
            comment: worklog.comment
          });
        }
      }
    }
    console.log('Built logs array, length:', logs.length);
    console.log('Sample logs:', logs.slice(0, 3));
    console.log('About to group logs, logs array length:', logs.length);
    const grouped = {};
    logs.forEach(log => {
      // Normalize date to YYYY-MM-DD in UTC
      const dateKey = log.date ? new Date(log.date).toISOString().slice(0, 10) : 'Unknown';
      console.log('Grouping log with dateKey:', `[${dateKey}]`);
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, total_time_spent_seconds: 0, logs: [] };
      }
      grouped[dateKey].total_time_spent_seconds += log.time_spent_seconds;
      grouped[dateKey].logs.push(log);
    });
    console.log('Final grouped keys:', Object.keys(grouped));
    // Convert to array and add formatted total time
    const result = Object.values(grouped).map(group => ({
      date: group.date,
      total_time_spent_seconds: group.total_time_spent_seconds,
      total_time_spent: secondsToHMS(group.total_time_spent_seconds),
      logs: group.logs
    }));
    console.log('Before sort:', result.map(g => g.date));
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log('After sort:', result.map(g => g.date));
    res.json({ grouped_logs: result });
  } catch (err) {
    console.error(`[JIRA API ERROR] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Helper to convert seconds to HH:MM:SS
function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s]
    .map(v => v < 10 ? '0' + v : v)
    .join(':');
}

module.exports = router; 