router.post('/', async (req, res) => {
  //console.log('TEST LOG: timeLogs.js POST /api/time-logs handler is running');
  //console.log('Received POST /api/time-logs with body:', req.body);
  //console.log('JIRA_HOST:', process.env.JIRA_HOST);
  //console.log('JIRA_EMAIL:', process.env.JIRA_EMAIL);
  // Do NOT log the API token for security reasons
  const { email, startDate, endDate } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
   // console.log('About to group logs, logs array length:', logs.length);
    // Group by date and sum time_spent_seconds
    const grouped = {};
    logs.forEach(log => {
      // Normalize date to YYYY-MM-DD in UTC
      const dateKey = log.date ? new Date(log.date).toISOString().slice(0, 10) : 'Unknown';
      //console.log('Grouping log with dateKey:', `[${dateKey}]`);
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, total_time_spent_seconds: 0, logs: [] };
      }
      grouped[dateKey].total_time_spent_seconds += log.time_spent_seconds;
      grouped[dateKey].logs.push(log);
    });
   // console.log('Final grouped keys:', Object.keys(grouped));
    const result = Object.values(grouped).map(group => ({
      date: group.date,
      total_time_spent_seconds: group.total_time_spent_seconds,
      total_time_spent: secondsToHMS(group.total_time_spent_seconds),
      logs: group.logs
    }));
   // console.log('Dates before sorting:', result.map(g => g.date));
    result.sort((a, b) => Number(b.date.replace(/-/g, '')) - Number(a.date.replace(/-/g, '')));
    //console.log('Dates after sorting:', result.map(g => g.date));
    res.json({ grouped_logs: result });
  } catch (err) {
    //console.error(`[JIRA API ERROR] ${err.message}`);
    // console.error(err.stack);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}); 