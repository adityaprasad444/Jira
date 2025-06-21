# Jira Time Log Dashboard

A unified web application that combines a React frontend and Express.js backend to fetch and display Jira time logs in a user-friendly dashboard.

## Features

- Fetch time logs from Jira API for any user
- Group logs by date with total time calculations
- Expandable/collapsible log entries
- Direct links to Jira issues
- Responsive design
- Production-ready deployment setup

## Project Structure

```
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                 # Express.js backend
│   ├── routes/
│   ├── bin/
│   └── app.js
├── package.json           # Root package.json with unified scripts
├── Procfile              # Heroku deployment configuration
├── Dockerfile            # Docker configuration for containerized deployment
├── choreo.yaml           # Choreo deployment configuration
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Jira instance with API access
- Jira API token

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Jira Configuration
JIRA_HOST=your-jira-instance.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jira-time-log-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (backend)
   npm install
   
   # Install frontend dependencies
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
# Run both frontend and backend concurrently
npm run dev

# Or run them separately:
npm run server    # Backend only (port 3000)
npm run client    # Frontend only (port 3001)
```

### Building for Production

```bash
# Build the React frontend
npm run build
```

## Production Deployment

### Choreo Deployment (Recommended)

1. **Install Choreo CLI** (if not already installed)
   ```bash
   npm install -g @choreo/cli
   ```

2. **Login to Choreo**
   ```bash
   choreo login
   ```

3. **Create a new project in Choreo Console**
   - Go to [Choreo Console](https://console.choreo.dev)
   - Create a new project
   - Note down the project ID

4. **Create secrets in Choreo Console**
   - Go to your project in Choreo Console
   - Navigate to "Secrets" section
   - Create a secret named `jira-secrets` with the following keys:
     - `JIRA_HOST`: your-jira-instance.atlassian.net
     - `JIRA_EMAIL`: your-email@example.com
     - `JIRA_API_TOKEN`: your-jira-api-token

5. **Deploy using Choreo CLI**
   ```bash
   # Initialize Choreo project
   choreo init
   
   # Deploy the application
   choreo deploy
   ```

6. **Alternative: Deploy via Git**
   - Push your code to a Git repository (GitHub, GitLab, etc.)
   - Connect your repository to Choreo Console
   - Configure the build settings to use the Dockerfile
   - Deploy from the Choreo Console

### Heroku Deployment

1. **Create a Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set JIRA_HOST=your-jira-instance.atlassian.net
   heroku config:set JIRA_EMAIL=your-email@example.com
   heroku config:set JIRA_API_TOKEN=your-jira-api-token
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Other Platforms

The application can be deployed to any platform that supports Node.js:

- **Vercel**: Use the Vercel CLI or connect your GitHub repository
- **Railway**: Connect your GitHub repository
- **DigitalOcean App Platform**: Use the app platform
- **AWS Elastic Beanstalk**: Deploy as a Node.js application

## API Endpoints

- `POST /api/time-logs` - Fetch time logs for a user
  - Body: `{ email, startDate, endDate }`
  - Returns: `{ grouped_logs: [...] }`

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development mode (both frontend and backend)
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run build` - Build frontend for production
- `npm run install-client` - Install frontend dependencies
- `npm run install-all` - Install all dependencies

## Troubleshooting

### Common Issues

1. **CORS errors in development**
   - Make sure both frontend and backend are running
   - Check that the frontend is making requests to the correct backend URL

2. **Jira API errors**
   - Verify your Jira credentials in the environment variables
   - Ensure the user has permission to access the Jira API
   - Check that the Jira host is correct

3. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

4. **Choreo deployment issues**
   - Ensure all secrets are properly configured in Choreo Console
   - Check that the Dockerfile is in the root directory
   - Verify the choreo.yaml configuration

### Getting Jira API Token

1. Go to your Atlassian account settings
2. Navigate to Security → Create and manage API tokens
3. Create a new API token
4. Use this token in your environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 