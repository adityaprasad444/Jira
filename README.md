# Jira Time Log Dashboard

A unified web application with a React frontend and Express.js backend to fetch and display Jira time logs in a user-friendly dashboard.

## Features

- Fetch time logs from Jira API for any user
- Group logs by date with total time calculations
- Expandable/collapsible log entries
- Direct links to Jira issues
- Responsive design
- Production-ready deployment setup

## Project Structure

```
Jira New/
├── client/      # React frontend (runs on port 3000)
├── server/      # Express.js backend (runs on port 3001)
├── package.json # Root package.json with unified scripts
├── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Jira instance with API access
- Jira API token

## Environment Variables

Create a `.env` file in the **project root** with the following variables:

```env
# Jira Configuration
JIRA_HOST=your-jira-instance.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Jira\ New
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm run install-client
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Jira credentials
   ```

## Development

### Running in Development Mode

```bash
npm run dev # Runs both backend (3001) and frontend (3000)
```

Or run them separately:

```bash
npm run server # Backend only (port 3001)
npm run client # Frontend only (port 3000)
```

### Building for Production

```bash
npm run build # Build the React frontend
```

## API Usage

- `POST /api/time-logs` - Fetch time logs for a user
  - Body: `{ email, startDate, endDate }`
  - Returns: `{ grouped_logs: [ { date, total_time_spent, logs: [...] }, ... ] }`

## Troubleshooting

- **Date sorting/grouping issues:** Ensure backend uses normalized date keys and sorts with `new Date(b.date) - new Date(a.date)`.
- **CORS errors:** Make sure both frontend and backend are running, and the frontend uses the proxy setting in `client/package.json`.
- **Jira API errors:** Verify your Jira credentials and permissions.

## License

MIT License - see LICENSE file for details 