const express = require('express');
const router = express.Router();
const JiraClient = require('jira-client');
require('dotenv').config();

// Jira credentials from .env
const jira = new JiraClient({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_EMAIL,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// POST /api/time-logs
router.post('/api/time-logs', async (req, res) => {
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
      const users = await jira.doRequest(jira.makeRequestHeader(
        jira.makeUri({
          pathname: '/user/search',
          query: { query: email }
        })
      ));
      if (!users || users.length === 0) {
        return res.status(404).json({ error: `No Jira user found for email: ${email}` });
      }
      accountId = users[0].accountId;
    } catch (err) {
      console.error(`[JIRA API ERROR] Failed to get user by email: ${err.message}`);
      return res.status(500).json({ error: 'Failed to get Jira user by email' });
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
    // Group by date and sum time_spent_seconds
    const grouped = {};
    logs.forEach(log => {
      // Always group by just the date part
      const date = log.date ? log.date.slice(0, 10) : 'Unknown';
      if (!grouped[date]) {
        grouped[date] = { date: date, total_time_spent_seconds: 0, logs: [] };
      }
      grouped[date].total_time_spent_seconds += log.time_spent_seconds;
      grouped[date].logs.push(log);
    });
    // Convert to array and add formatted total time
    const result = Object.values(grouped).map(group => ({
      date: group.date,
      total_time_spent_seconds: group.total_time_spent_seconds,
      total_time_spent: secondsToHMS(group.total_time_spent_seconds),
      logs: group.logs
    }));
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
