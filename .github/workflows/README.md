# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the LucidCraft project.

## CI/CD Pipeline

The main workflow (`ci-cd.yml`) includes the following jobs:

### 1. Type Check
- Runs TypeScript type checking
- Ensures type safety across the codebase

### 2. Lint
- Runs ESLint and Prettier
- Enforces code style and best practices

### 3. Unit Tests
- Runs Jest tests with coverage
- Uploads coverage to Codecov

### 4. Build
- Builds the Next.js application
- Ensures the application can be built successfully

### 5. PostHog Schema Verification
- Validates event schemas against PostHog
- Ensures consistent analytics tracking

### 6. Lighthouse
- Runs Lighthouse audits for accessibility, best practices, and SEO
- Fails if scores are below 90%

### 7. Vercel Preview (on PRs)
- Deploys a preview build for each pull request
- Provides a live URL for review

### 8. Supabase Migrations (on push to develop)
- Applies database migrations to staging environment
- Ensures schema changes are properly deployed

## Required Secrets

### Repository Secrets

| Secret Name | Description |
|-------------|-------------|
| `POSTHOG_API_KEY` | API key for PostHog event verification |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for Supabase CLI |
| `SUPABASE_PROJECT_ID` | Supabase project ID |
| `SUPABASE_DB_PASSWORD` | Database password for migrations |
| `SUPABASE_DB_URL_STAGING` | Connection URL for staging database |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `VERCEL_TOKEN` | Vercel authentication token |
| `SLACK_WEBHOOK_URL` | Webhook URL for Slack notifications |

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# PostHog
POSTHOG_API_KEY=your_posthog_api_key

# Supabase
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_PROJECT_ID=your_supabase_project_id
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_DB_URL_STAGING=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Vercel
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
VERCEL_TOKEN=your_vercel_token

# Slack
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## Local Testing

To test the workflows locally:

1. Install `act` (https://github.com/nektos/act)
2. Run specific jobs:
   ```bash
   act -j lint
   act -j test
   ```
3. Run the entire workflow:
   ```bash
   act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest
   ```

## Customizing the Workflow

### Adding New Jobs
1. Add a new job to the `jobs` section in `ci-cd.yml`
2. Define dependencies using `needs`
3. Configure the appropriate triggers

### Modifying Existing Jobs
- Update the relevant job configuration in `ci-cd.yml`
- Test changes using `act` before pushing

## Troubleshooting

### Workflow Failing
1. Check the workflow logs in GitHub Actions
2. Look for error messages and failed steps
3. Re-run failed jobs if needed

### Local Testing Issues
- Ensure Docker is running
- Check available disk space
- Update `act` to the latest version

## Security

- Never commit sensitive information to the repository
- Use GitHub Secrets for all credentials
- Review third-party actions before using them
- Keep dependencies up to date
