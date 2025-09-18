# Quick Setup Guide - AEROS Orchestra n8n Workflow

## 🚀 Get Running in 5 Minutes

### Step 1: Import the Fixed Workflow
1. Copy the entire contents of `n8n_orchestra_workflow_fixed.json`
2. In your n8n instance, go to **Workflows** → **Import from URL/File**
3. Paste the JSON content and click **Import**

### Step 2: Set Up OpenAI Credentials
1. Go to **Settings** → **Credentials** in n8n
2. Click **+ Add Credential** → Search for **OpenAI**
3. Enter your OpenAI API key
4. Save as credential name: **OpenAI**
5. Test the connection

### Step 3: Activate the Workflow
1. Open the imported workflow
2. Click the **Active** toggle (top right)
3. Copy the webhook URL from the "Voice Input Webhook" node

### Step 4: Test It!
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Create a marketing plan for my AI startup"}'
```

## 🎯 What You Get

- **Voice Input Processing**: Handles text/audio input
- **Intelligent Orchestration**: GPT-4 analyzes and plans execution
- **5 Specialized Agents**: ABACUS, GENSPARK, MINIMAX, MANUS, MVP
- **Parallel Execution**: All agents work simultaneously
- **Human Approval**: Optional safety gate for high-risk tasks
- **Comprehensive Results**: Structured JSON with all agent outputs

## 📋 Input Format
```json
{
  "transcript": "Your request here",
  "userId": "optional_user_id",
  "sessionId": "optional_session_id",
  "priority": "low/medium/high"
}
```

## 📊 Output Format
```json
{
  "session_id": "...",
  "user_intent": "...",
  "execution_summary": {
    "status": "success",
    "total_tasks": 3,
    "completed_tasks": 3,
    "success_rate": 100
  },
  "agent_results": {
    "ABACUS": { "data_analysis": "..." },
    "GENSPARK": { "creative_content": "..." },
    "MINIMAX": { "ai_optimization": "..." }
  },
  "summary": "Successfully completed all tasks"
}
```

## 🔧 Major Fixes Applied

✅ **Fixed broken API endpoints** (removed placeholder URLs)  
✅ **Simplified complex task iteration** (parallel execution)  
✅ **Implemented proper GENSPARK agent** (no more fallbacks)  
✅ **Added clean error handling** (removed complex retry logic)  
✅ **Standardized authentication** (OpenAI credentials only)  
✅ **Streamlined workflow connections** (clear execution path)

## 🎨 Agent Specializations

- **ABACUS**: Data analytics, statistics, forecasting
- **GENSPARK**: Content creation, writing, research  
- **MINIMAX**: AI optimization, complex reasoning
- **MANUS**: Process automation, system operations
- **MVP**: Business strategy, market analysis

## 🚨 Troubleshooting

**Issue**: "OpenAI credential not found"  
**Fix**: Ensure credential is named exactly "OpenAI" in n8n settings

**Issue**: Webhook not responding  
**Fix**: Check workflow is **Active** and webhook URL is correct

**Issue**: Agents not executing  
**Fix**: Verify OpenAI API key has sufficient credits and permissions

**Issue**: High-risk tasks stuck  
**Fix**: Check if human approval is required and respond to approval prompt

That's it! Your AEROS Orchestra system is now fully functional and ready to handle complex multi-agent tasks. 🎉
