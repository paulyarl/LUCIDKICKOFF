// This script helps set up SLI (Service Level Indicator) dashboards in PostHog
// Make sure to set the following environment variables:
// - POSTHOG_API_KEY: Your PostHog personal API key
// - POSTHOG_HOST: Your PostHog instance URL (e.g., https://app.posthog.com)

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  apiKey: process.env.POSTHOG_API_KEY,
  host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  apiUrl: process.env.POSTHOG_HOST ? `${process.env.POSTHOG_HOST}/api` : 'https://app.posthog.com/api',
};

if (!CONFIG.apiKey) {
  console.error('Error: POSTHOG_API_KEY environment variable is required');
  process.exit(1);
}

const client = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Authorization': `Bearer ${CONFIG.apiKey}`,
    'Content-Type': 'application/json',
  },
});

// Dashboard templates
const DASHBOARDS = {
  'LucidKickoff - Performance Overview': {
    description: 'Key performance indicators for LucidKickoff application',
    tags: ['performance', 'sli', 'production'],
    items: [
      // Time to First Stroke
      {
        name: 'Time to First Stroke (p95)',
        type: 'InsightCard',
        layout: { x: 0, y: 0, w: 6, h: 4 },
        filters: {
          events: [{ id: 'performance_metric', type: 'events' }],
          properties: [
            { key: 'metricName', operator: 'exact', value: 'time_to_first_stroke', type: 'event' },
          ],
          display: 'BoldNumber',
          insights: [
            {
              id: 'time_to_first_stroke_p95',
              name: 'Time to First Stroke (p95)',
              type: 'TRENDS',
              math: 'p95',
              display: 'BoldNumber',
              breakdown: '$browser',
            },
          ],
        },
      },
      // Brush Latency
      {
        name: 'Brush Latency (p95)',
        type: 'InsightCard',
        layout: { x: 6, y: 0, w: 6, h: 4 },
        filters: {
          events: [{ id: 'performance_metric', type: 'events' }],
          properties: [
            { key: 'metricName', operator: 'exact', value: 'brush_latency', type: 'event' },
          ],
          display: 'BoldNumber',
          insights: [
            {
              id: 'brush_latency_p95',
              name: 'Brush Latency (p95)',
              type: 'TRENDS',
              math: 'p95',
              display: 'BoldNumber',
              breakdown: '$browser',
            },
          ],
        },
      },
      // Save Success Rate
      {
        name: 'Save Success Rate',
        type: 'InsightCard',
        layout: { x: 0, y: 4, w: 6, h: 4 },
        filters: {
          events: [{ id: 'save', type: 'events' }],
          display: 'BoldNumber',
          insights: [
            {
              id: 'save_success_rate',
              name: 'Save Success Rate',
              type: 'FUNNELS',
              steps: [
                { name: 'Save Attempted', type: 'events', order: 0, custom_name: 'Save Attempted' },
                { name: 'Save Succeeded', type: 'events', order: 1, custom_name: 'Save Succeeded', properties: [{ key: 'success', value: 'true' }] },
              ],
              display: 'FunnelViz',
            },
          ],
        },
      },
      // Crash-Free Sessions
      {
        name: 'Crash-Free Sessions (7d)',
        type: 'InsightCard',
        layout: { x: 6, y: 4, w: 6, h: 4 },
        filters: {
          events: [{ id: 'session', type: 'events' }],
          display: 'BoldNumber',
          insights: [
            {
              id: 'crash_free_sessions',
              name: 'Crash-Free Sessions (7d)',
              type: 'TRENDS',
              math: 'unique_session',
              display: 'BoldNumber',
              properties: [
                { key: 'type', operator: 'exact', value: 'end', type: 'event' },
                { key: 'reason', operator: 'is_not_set', type: 'event' },
              ],
            },
          ],
        },
      },
    ],
  },
};

async function createDashboard(dashboardName, dashboardConfig) {
  try {
    console.log(`Creating dashboard: ${dashboardName}`);
    
    // Check if dashboard already exists
    const { data: dashboards } = await client.get('/api/projects/@current/dashboards/');
    const existingDashboard = dashboards.results.find(d => d.name === dashboardName);
    
    if (existingDashboard) {
      console.log(`Dashboard '${dashboardName}' already exists (ID: ${existingDashboard.id}). Updating...`);
      return existingDashboard;
    }
    
    // Create new dashboard
    const { data: dashboard } = await client.post('/api/projects/@current/dashboards/', {
      name: dashboardName,
      description: dashboardConfig.description,
      pinned: true,
      filters: {},
    });
    
    console.log(`Created dashboard with ID: ${dashboard.id}`);
    
    // Add tags
    if (dashboardConfig.tags && dashboardConfig.tags.length > 0) {
      await client.post(`/api/projects/@current/dashboards/${dashboard.id}/tags/`, {
        tags: dashboardConfig.tags,
      });
      console.log(`Added tags: ${dashboardConfig.tags.join(', ')}`);
    }
    
    // Add items to dashboard
    for (const item of dashboardConfig.items) {
      try {
        const { data: insight } = await client.post('/api/projects/@current/insights/', {
          name: item.name,
          description: item.description || '',
          filters: item.filters,
          dashboard: dashboard.id,
        });
        
        await client.post(`/api/projects/@current/dashboards/${dashboard.id}/insights/`, {
          insight: insight.id,
          layout: item.layout,
        });
        
        console.log(`Added insight: ${item.name}`);
      } catch (error) {
        console.error(`Error creating insight '${item.name}':`, error.message);
      }
    }
    
    return dashboard;
  } catch (error) {
    console.error('Error creating dashboard:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting PostHog dashboard setup...');
    
    // Test connection
    const { data: me } = await client.get('/api/users/@me/');
    console.log(`Connected to PostHog as ${me.email}`);
    
    // Create dashboards
    for (const [name, config] of Object.entries(DASHBOARDS)) {
      await createDashboard(name, config);
    }
    
    console.log('\nDashboard setup completed successfully!');
    console.log(`Visit your PostHog instance at: ${CONFIG.host}/dashboard`);
  } catch (error) {
    console.error('Error during setup:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
