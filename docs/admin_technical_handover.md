# AEROS Platform: Admin and Technical Handover Documentation

## Table of Contents
1. [Platform Architecture and Technical Stack](#1-platform-architecture-and-technical-stack)
2. [Database Schema and Supabase Configuration](#2-database-schema-and-supabase-configuration)
3. [Admin Panel Access and Management](#3-admin-panel-access-and-management)
4. [Monitoring and Maintenance Procedures](#4-monitoring-and-maintenance-procedures)
5. [Security Protocols and Backup Strategies](#5-security-protocols-and-backup-strategies)
6. [API Documentation and Integration Points](#6-api-documentation-and-integration-points)
7. [Troubleshooting and Support Procedures](#7-troubleshooting-and-support-procedures)

---

## 1. Platform Architecture and Technical Stack

### 1.1 Overall Platform Architecture

The **AEROS (Autonomous Enterprise Resource Optimization System)** is a sophisticated multi-agent AI platform serving as a centralized command center for enterprise automation, creative innovation, data analytics, and strategic decision-making.

**Live Platform URL:** https://x2i60jj95vs7.space.minimax.io

### 1.2 Core Agent System

#### Primary Agents
1. **MANUS Agent** - Enterprise Automation Specialist
   - Role: Enterprise Process Automation & Business Intelligence
   - Capabilities: Workflow optimization, business process re-engineering, ERP, operational efficiency analysis, compliance monitoring, supply chain optimization

2. **GENSPARK Agent** - Creative Innovation Engine
   - Role: Content Generation & Creative Problem Solving
   - Capabilities: Creative content generation, innovation strategy, design thinking, brand development, marketing automation, trend analysis

3. **ABACUS Agent** - Advanced Data Analytics
   - Role: Data Science & Statistical Analysis
   - Capabilities: Statistical modeling, predictive analytics, big data processing, ML model development, data visualization, BI dashboards

4. **MINIMAX Agent** - AI Optimization Specialist
   - Role: AI Model Training & Algorithm Optimization
   - Capabilities: AI model training, algorithm optimization, neural network design, hyperparameter optimization, model deployment, performance analysis

5. **MVP Agent** - Startup Strategy Specialist
   - Role: Minimum Viable Product Development & Market Validation
   - Capabilities: MVP development strategy, market research, product-market fit analysis, competitive assessment, go-to-market strategy, investor pitch preparation

### 1.3 Frontend Technology Stack

**Framework & Libraries:**
- React with TypeScript
- React Query for efficient data fetching
- Component memoization and optimization
- Lazy loading and code splitting
- Progressive Web App (PWA) capabilities

**UI/UX Components:**
- Brain-centered agent visualization interface
- Voice command integration
- Real-time task tracking
- Analytics dashboards
- Tier management interface

**Authentication:**
- Supabase Auth integration
- JWT token management
- Session persistence
- Automatic token refresh

### 1.4 Backend Services Infrastructure

**Supabase Backend Services:**
- **Authentication:** User management with row-level security
- **Database:** PostgreSQL with real-time subscriptions
- **Storage:** File uploads and media management
- **Edge Functions:** Serverless computing for agent orchestration

**Core Edge Function:**
- `ai-agent-orchestrator`: Central coordination service handling task routing, agent workload management, inter-agent communication, task queue processing, and system performance monitoring

### 1.5 External Integrations

**Payment Processing:**
- Stripe integration for subscription management
- Automatic billing and renewal
- Credit-based usage tracking

**AI Services:**
- OpenAI GPT-4o for agent processing
- Voice-to-text and text-to-speech APIs
- Natural language processing

**Third-Party APIs:**
- Yahoo Finance integration
- Twitter data access
- Booking.com integration
- TripAdvisor data access
- Google Maps functionality
- Pinterest content search

---

## 2. Database Schema and Supabase Configuration

### 2.1 Core Database Tables

#### Agent Capabilities Table
```sql
CREATE TABLE agent_capabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_name TEXT NOT NULL,
    capability_keywords TEXT[],
    description TEXT,
    api_endpoint TEXT,
    pricing_model TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Additional Core Tables (Inferred from Architecture)
```sql
-- User subscription management
CREATE TABLE neural_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    tier TEXT NOT NULL CHECK (tier IN ('standard', 'pro')),
    credits_remaining INTEGER DEFAULT 100,
    billing_cycle_start TIMESTAMPTZ,
    billing_cycle_end TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task tracking and history
CREATE TABLE neural_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    agent_type TEXT NOT NULL,
    task_description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result JSONB,
    credits_used DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Agent interaction tracking
CREATE TABLE agent_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    agent_type TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    request_data JSONB NOT NULL,
    response_data JSONB,
    status TEXT DEFAULT 'pending',
    processing_time_ms INTEGER,
    cost_credits DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Usage metrics tracking
CREATE TABLE usage_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    full_name TEXT,
    company TEXT,
    role TEXT,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Supabase Configuration

#### Environment Variables Required
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Row-Level Security (RLS) Policies
```sql
-- Enable RLS on all user-facing tables
ALTER TABLE neural_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE neural_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for neural_tasks
CREATE POLICY "Users can only see their own tasks" ON neural_tasks
FOR ALL USING (auth.uid() = user_id);

-- Example RLS policy for user_profiles
CREATE POLICY "Users can only see their own profile" ON user_profiles
FOR ALL USING (auth.uid() = user_id);
```

#### Real-time Subscriptions
```sql
-- Enable real-time for task updates
ALTER PUBLICATION supabase_realtime ADD TABLE neural_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_interactions;
```

### 2.3 Storage Configuration

**Buckets:**
- `user-uploads`: For user-submitted files and documents
- `agent-outputs`: For generated content and reports
- `system-backups`: For automated system backups

**Storage Policies:**
```sql
-- User uploads policy
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Agent outputs policy
CREATE POLICY "Users can read their agent outputs" ON storage.objects
FOR SELECT USING (bucket_id = 'agent-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 3. Admin Panel Access and Management

### 3.1 Admin Authentication

#### Admin User Setup
1. Create admin users in Supabase Auth dashboard
2. Assign admin role in user metadata:
```json
{
  "role": "admin",
  "permissions": ["user_management", "system_monitoring", "billing_management"]
}
```

#### Admin Access URLs
- **Main Admin Panel:** `https://x2i60jj95vs7.space.minimax.io/admin`
- **Supabase Dashboard:** `https://supabase.com/dashboard/project/[project-id]`
- **Stripe Dashboard:** `https://dashboard.stripe.com`

### 3.2 User Management

#### Subscription Management
```sql
-- View all user subscriptions
SELECT 
    u.email,
    ns.tier,
    ns.credits_remaining,
    ns.status,
    ns.billing_cycle_end
FROM auth.users u
JOIN neural_subscriptions ns ON u.id = ns.user_id
ORDER BY ns.created_at DESC;

-- Update user tier
UPDATE neural_subscriptions 
SET tier = 'pro', credits_remaining = 999999 
WHERE user_id = '[user-id]';

-- Reset user credits
UPDATE neural_subscriptions 
SET credits_remaining = 100 
WHERE user_id = '[user-id]' AND tier = 'standard';
```

#### User Activity Monitoring
```sql
-- View user task history
SELECT 
    u.email,
    nt.agent_type,
    nt.status,
    nt.credits_used,
    nt.created_at
FROM neural_tasks nt
JOIN auth.users u ON nt.user_id = u.id
WHERE nt.created_at >= NOW() - INTERVAL '7 days'
ORDER BY nt.created_at DESC;
```

### 3.3 Agent Management

#### Agent Status Monitoring
```sql
-- Check agent capabilities and status
SELECT 
    agent_name,
    is_active,
    pricing_model,
    array_length(capability_keywords, 1) as num_capabilities
FROM agent_capabilities;

-- Enable/disable agents
UPDATE agent_capabilities 
SET is_active = false 
WHERE agent_name = 'GENSPARK Agent';
```

#### Performance Metrics
```sql
-- Agent usage statistics
SELECT 
    agent_type,
    COUNT(*) as total_tasks,
    AVG(processing_time_ms) as avg_processing_time,
    SUM(cost_credits) as total_credits_used
FROM agent_interactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_type;
```

### 3.4 System Monitoring Dashboard

#### Key Metrics to Monitor
1. **Daily Active Users (DAU)**
2. **Task Completion Rate**
3. **Average Processing Time**
4. **Credit Consumption Rate**
5. **Error Rate by Agent**
6. **System Uptime**

#### Monitoring Queries
```sql
-- Daily active users
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users
FROM agent_interactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Error rate monitoring
SELECT 
    agent_type,
    COUNT(*) as total_requests,
    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
    ROUND((SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as error_rate
FROM agent_interactions
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY agent_type;
```

---

## 4. Monitoring and Maintenance Procedures

### 4.1 System Health Monitoring

#### Daily Health Checks
1. **Database Performance**
   ```sql
   -- Check database connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Check slow queries
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Edge Function Status**
   - Monitor `ai-agent-orchestrator` function logs in Supabase dashboard
   - Check function invocation count and error rate
   - Verify OpenAI API connectivity

3. **Storage Usage**
   ```sql
   -- Monitor storage usage
   SELECT 
       bucket_id,
       COUNT(*) as file_count,
       SUM(metadata->>'size')::bigint as total_size_bytes
   FROM storage.objects
   GROUP BY bucket_id;
   ```

#### Weekly Performance Review
1. **Agent Performance Analysis**
   - Review average processing times
   - Identify performance bottlenecks
   - Analyze user feedback and error patterns

2. **Credit Usage Trends**
   - Monitor credit consumption patterns
   - Identify unusual usage spikes
   - Review tier upgrade/downgrade patterns

3. **Database Optimization**
   - Analyze query performance
   - Update table statistics
   - Review and optimize indexes

### 4.2 Automated Monitoring

#### Set up alerts for:
- Edge function error rate > 5%
- Database connection count > 80% of limit
- Average response time > 10 seconds
- Credit consumption anomalies
- Failed payment notifications

#### Monitoring Tools Integration
```javascript
// Example Supabase Edge Function monitoring
const monitoringData = {
  timestamp: new Date().toISOString(),
  function_name: 'ai-agent-orchestrator',
  execution_time: processingTime,
  status: 'success',
  error_details: null
};

// Send to monitoring service
await fetch('https://your-monitoring-service.com/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(monitoringData)
});
```

### 4.3 Regular Maintenance Tasks

#### Daily Tasks
- [ ] Review system logs for errors
- [ ] Check Edge function performance metrics
- [ ] Monitor credit usage patterns
- [ ] Verify payment processing status

#### Weekly Tasks
- [ ] Analyze user engagement metrics
- [ ] Review and clean up temporary files
- [ ] Update system documentation
- [ ] Check and rotate API keys if needed

#### Monthly Tasks
- [ ] Comprehensive performance review
- [ ] Database maintenance and optimization
- [ ] Security audit and updates
- [ ] Backup verification and testing
- [ ] Cost analysis and optimization

---

## 5. Security Protocols and Backup Strategies

### 5.1 Authentication and Authorization

#### Multi-layered Security
1. **Supabase Auth with JWT tokens**
2. **Row-level security (RLS) policies**
3. **API key rotation schedule**
4. **Rate limiting on edge functions**

#### API Key Management
```bash
# Store in Supabase Edge Function secrets
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Rotation schedule: Every 90 days
# Update in both Supabase and third-party services
```

### 5.2 Data Encryption

#### Data at Rest
- Supabase handles encryption at rest for database
- All sensitive data encrypted using AES-256
- API keys stored in encrypted environment variables

#### Data in Transit
- All API communications use HTTPS/TLS 1.3
- WebSocket connections secured with WSS
- File uploads encrypted during transmission

### 5.3 Backup Strategies

#### Database Backups
```sql
-- Automated daily backups via Supabase Pro plan
-- Additional manual backup procedure:

-- Export user data
COPY (
  SELECT * FROM neural_subscriptions
) TO 'subscriptions_backup.csv' WITH CSV HEADER;

-- Export agent interactions
COPY (
  SELECT * FROM agent_interactions 
  WHERE created_at >= NOW() - INTERVAL '30 days'
) TO 'interactions_backup.csv' WITH CSV HEADER;
```

#### File Storage Backups
- Automated replication to secondary storage region
- Weekly manual verification of critical files
- 90-day retention policy for user uploads

#### Disaster Recovery Plan
1. **Recovery Time Objective (RTO):** 4 hours
2. **Recovery Point Objective (RPO):** 1 hour
3. **Backup Verification:** Weekly automated tests

### 5.4 GDPR Compliance

#### Data Processing Procedures
```sql
-- User data export (GDPR Article 20)
CREATE OR REPLACE FUNCTION export_user_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(up.*) FROM user_profiles up WHERE up.user_id = user_uuid),
    'subscription', (SELECT row_to_json(ns.*) FROM neural_subscriptions ns WHERE ns.user_id = user_uuid),
    'tasks', (SELECT array_agg(row_to_json(nt.*)) FROM neural_tasks nt WHERE nt.user_id = user_uuid),
    'interactions', (SELECT array_agg(row_to_json(ai.*)) FROM agent_interactions ai WHERE ai.user_id = user_uuid)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- User data deletion (GDPR Article 17)
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM agent_interactions WHERE user_id = user_uuid;
  DELETE FROM neural_tasks WHERE user_id = user_uuid;
  DELETE FROM neural_subscriptions WHERE user_id = user_uuid;
  DELETE FROM user_profiles WHERE user_id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. API Documentation and Integration Points

### 6.1 AI Agent Orchestrator API

#### Endpoint
`POST /functions/v1/ai-agent-orchestrator`

#### Authentication
```bash
Authorization: Bearer [user-jwt-token]
apikey: [supabase-anon-key]
```

#### Request Format
```json
{
  "task": "Analyze market trends for electric vehicles",
  "agentType": "research", // "research", "content", "analysis", "integration"
  "conversationId": "uuid-string",
  "tenantId": "uuid-string"
}
```

#### Response Format
```json
{
  "data": {
    "interactionId": "uuid-string",
    "result": {
      "type": "research",
      "agentName": "GenSpark AI",
      "summary": "Analysis summary...",
      "findings": ["Finding 1", "Finding 2"],
      "sources": ["Source 1", "Source 2"],
      "keyInsights": ["Insight 1", "Insight 2"],
      "recommendations": ["Rec 1", "Rec 2"],
      "fullResponse": "Complete analysis...",
      "completedAt": "2025-09-17T10:03:46.000Z",
      "metadata": {
        "aiModel": "GPT-4o",
        "processingTime": "3.2 seconds",
        "confidenceScore": 0.89,
        "dataQuality": "High"
      }
    },
    "processingTime": 3200,
    "cost": 0.25,
    "agentName": "GenSpark AI"
  }
}
```

#### Error Response Format
```json
{
  "error": {
    "code": "AI_AGENT_ERROR",
    "message": "Detailed error message"
  }
}
```

### 6.2 Agent Type Specifications

#### Research Agent (GenSpark AI)
- **Purpose:** Market research, competitive analysis, data-driven insights
- **Cost:** 0.25 credits per task
- **Response includes:** findings, sources, keyInsights, recommendations

#### Content Agent (MiniMax AI)
- **Purpose:** Professional content creation across multiple formats
- **Cost:** 0.50 credits per task  
- **Response includes:** content, wordCount, readingTime, metadata

#### Analysis Agent (Abacus AI)
- **Purpose:** Data interpretation, pattern recognition, strategic insights
- **Cost:** 0.35 credits per task
- **Response includes:** patterns, keyInsights, riskAssessment, opportunities

#### Integration Agent (Manus AI)
- **Purpose:** Workflow optimization, system connectivity, process enhancement
- **Cost:** 0.45 credits per task
- **Response includes:** architecture, workflowDesign, recommendedTech, implementationRoadmap

### 6.3 External API Integrations

#### Stripe Integration
```javascript
// Webhook endpoint: /api/stripe/webhook
// Events to handle:
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.payment_succeeded
// - invoice.payment_failed

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verify webhook signature
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

#### OpenAI Integration
```javascript
// Model: GPT-4o
// Max tokens: 2000
// Temperature varies by agent:
// - Research: 0.7
// - Content: 0.8  
// - Analysis: 0.6
// - Integration: 0.7

const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: agentSystemPrompt },
      { role: 'user', content: taskPrompt }
    ],
    max_tokens: 2000,
    temperature: agentTemperature
  })
});
```

### 6.4 Rate Limiting and Usage Controls

#### Current Limits
- **Standard Tier:** 100 credits/month
- **Pro Tier:** Unlimited credits
- **API Rate Limit:** 60 requests/minute per user
- **Concurrent Tasks:** 3 per user

#### Implementation
```javascript
// Rate limiting check in edge function
const userRequests = await supabase
  .from('agent_interactions')
  .select('created_at')
  .eq('user_id', userId)
  .gte('created_at', new Date(Date.now() - 60000).toISOString());

if (userRequests.data.length >= 60) {
  throw new Error('Rate limit exceeded. Maximum 60 requests per minute.');
}
```

---

## 7. Troubleshooting and Support Procedures

### 7.1 Common Issues and Solutions

#### Authentication Issues
**Problem:** User cannot log in
**Diagnosis:**
```sql
-- Check user status
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'user@example.com';
```
**Solution:**
1. Verify email confirmation status
2. Check for account lockout
3. Reset password if necessary
4. Verify Supabase Auth configuration

#### Agent Processing Failures
**Problem:** Tasks stuck in "processing" status
**Diagnosis:**
```sql
-- Check stuck tasks
SELECT * FROM agent_interactions 
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '10 minutes';
```
**Solution:**
1. Check OpenAI API status and quotas
2. Verify edge function logs
3. Restart stuck tasks:
```sql
UPDATE agent_interactions 
SET status = 'failed' 
WHERE id = '[interaction-id]';
```

#### Credit System Issues
**Problem:** Credits not deducting properly
**Diagnosis:**
```sql
-- Check recent credit usage
SELECT user_id, metric_type, metric_value, created_at
FROM usage_metrics 
WHERE user_id = '[user-id]' 
ORDER BY created_at DESC 
LIMIT 10;
```
**Solution:**
1. Verify usage_metrics table updates
2. Check Stripe webhook processing
3. Manual credit adjustment if needed

### 7.2 Error Handling and Logging

#### Edge Function Error Logging
```javascript
// Comprehensive error logging in ai-agent-orchestrator
try {
  // Task processing logic
} catch (error) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    function: 'ai-agent-orchestrator',
    user_id: userId,
    agent_type: agentType,
    error_type: error.constructor.name,
    error_message: error.message,
    stack_trace: error.stack,
    request_data: { task, conversationId, tenantId }
  };
  
  console.error('Agent processing error:', errorLog);
  
  // Update interaction record with error
  await updateInteractionWithError(interactionId, errorLog);
}
```

#### Database Error Monitoring
```sql
-- Monitor database errors
SELECT 
  schemaname,
  tablename,
  attname,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;

-- Check for connection issues
SELECT 
  state,
  COUNT(*) as connection_count
FROM pg_stat_activity 
GROUP BY state;
```

### 7.3 Customer Support Escalation

#### Level 1 Support (Automated)
- **Knowledge Base:** Common issues and solutions
- **Chatbot Integration:** Basic troubleshooting
- **Self-Service:** Password reset, account settings

#### Level 2 Support (Admin Team)
- **Database Access:** Direct issue investigation
- **Manual Credit Adjustments:** Billing discrepancies
- **Account Management:** Subscription changes

#### Level 3 Support (Technical Team)
- **System-wide Issues:** Infrastructure problems
- **Code Deployment:** Bug fixes and updates
- **Integration Problems:** Third-party API issues

#### Support Ticket System
```sql
-- Support ticket tracking table
CREATE TABLE support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.4 System Recovery Procedures

#### Edge Function Recovery
1. **Check Function Status:** Supabase dashboard → Edge Functions
2. **Redeploy if Necessary:**
```bash
supabase functions deploy ai-agent-orchestrator
```
3. **Verify Environment Variables:** Ensure all secrets are properly configured

#### Database Recovery
1. **Connection Issues:**
```sql
-- Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
AND query_start < NOW() - INTERVAL '10 minutes';
```

2. **Performance Issues:**
```sql
-- Rebuild indexes
REINDEX DATABASE postgres;

-- Update table statistics
ANALYZE;
```

#### Payment System Recovery
1. **Stripe Webhook Issues:**
   - Check webhook endpoint status
   - Verify webhook secret configuration
   - Resend failed webhook events from Stripe dashboard

2. **Subscription Sync Issues:**
```sql
-- Manual subscription sync
UPDATE neural_subscriptions 
SET status = 'active', updated_at = NOW() 
WHERE stripe_subscription_id = '[stripe-sub-id]';
```

### 7.5 Performance Optimization

#### Database Optimization
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_agent_interactions_user_created 
ON agent_interactions(user_id, created_at);

CREATE INDEX CONCURRENTLY idx_neural_tasks_status_created 
ON neural_tasks(status, created_at);

-- Partition large tables by date
CREATE TABLE agent_interactions_2025_09 PARTITION OF agent_interactions
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
```

#### Edge Function Optimization
```javascript
// Connection pooling for database connections
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Implement caching for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

---

## Contact Information

**Technical Lead:** [To be assigned]
**System Administrator:** [To be assigned]
**Database Administrator:** [To be assigned]

**Emergency Contacts:**
- **System Down:** [Emergency contact]
- **Payment Issues:** [Billing contact]
- **Security Incidents:** [Security contact]

**External Support:**
- **Supabase Support:** https://supabase.com/support
- **Stripe Support:** https://support.stripe.com
- **OpenAI Support:** https://help.openai.com

---

## Document Maintenance

**Last Updated:** 2025-09-17 10:03:46
**Next Review Date:** 2025-10-17
**Document Version:** 1.0
**Prepared By:** MiniMax Agent

**Change Log:**
- 2025-09-17: Initial creation of comprehensive handover documentation
- [Future updates to be logged here]

---

*This document contains sensitive system information. Handle with appropriate security measures and access controls.*