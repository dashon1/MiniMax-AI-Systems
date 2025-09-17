# AEROS Orchestra n8n Setup Guide

## 🚀 Quick Start Guide

This guide will help you set up the complete AEROS Orchestra multi-agent system in n8n within 30 minutes.

---

## 📋 Prerequisites

### **Required Services**
- **n8n instance** (self-hosted or cloud)
- **OpenAI API account** with GPT-4 access
- **API keys** for external agents (Abacus, Minimax)
- **Manus AI server** (local or hosted)

### **Optional Enhancements**
- **Webhook testing tool** (Postman, Insomnia)
- **Monitoring setup** (for production)
- **SSL certificates** (for secure webhooks)

---

## 🔧 Step 1: Import the Workflow

### **Method 1: Direct Import**
1. Open your n8n interface
2. Click **"+ New Workflow"**
3. Click **"Import from JSON"**
4. Copy the entire content from `n8n_orchestra_workflow_enhanced.json`
5. Paste into the import dialog
6. Click **"Import"**
7. Save the workflow with name: **"AEROS Orchestra System"**

### **Method 2: Manual Creation**
If import fails, you can recreate the workflow manually using the node documentation provided.

---

## 🔑 Step 2: Configure API Credentials

### **OpenAI Credential Setup**
1. Go to **Settings → Credentials**
2. Click **"+ Add Credential"**
3. Search for **"OpenAI"**
4. Enter your OpenAI API key
5. Set name: **"OpenAI-GPT4"**
6. Test the connection
7. Save

### **Abacus AI Credential Setup**
1. Create **"HTTP Header Auth"** credential
2. Set name: **"Abacus-API"**
3. Configure:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer YOUR_ABACUS_API_KEY`
4. Save

### **Minimax AI Credential Setup**
1. Create **"HTTP Header Auth"** credential
2. Set name: **"Minimax-API"**
3. Configure:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer YOUR_MINIMAX_API_KEY`
4. Save

---

## 🌐 Step 3: Configure Webhook

### **Webhook Setup**
1. Open the **"Voice Input Webhook"** node
2. Note the webhook URL (will look like: `https://your-n8n.com/webhook/orchestra-webhook`)
3. Set **HTTP Method**: `POST`
4. Configure **Response Mode**: `Response Node`
5. Save the workflow
6. **Activate** the workflow

### **Test Webhook**
Use this curl command to test:
```bash
curl -X POST https://your-n8n.com/webhook/orchestra-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Create a simple market analysis for electric vehicles",
    "userId": "test-user",
    "sessionId": "test-session-123"
  }'
```

---

## 🔄 Step 4: Configure Agent Endpoints

### **Manus AI Server Setup**

#### **Option A: Local Installation**
```bash
# Clone the open-source Manus implementation
git clone https://github.com/Simpleyyt/ai-manus.git
cd ai-manus

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start the server
npm start
```

#### **Option B: Docker Setup**
```bash
# Create docker-compose.yml
docker-compose up -d manus-api
```

#### **Option C: Cloud Hosting**
Deploy to Railway, Heroku, or AWS and update the endpoint URL in the workflow.

### **Update Endpoint URLs**
In the workflow, update these nodes with your actual endpoints:

1. **ABACUS Agent Execute**:
   - URL: `https://api.abacus.ai/v2/predict/executeAgentWithBinaryData`

2. **MINIMAX Agent Execute**:
   - URL: `https://api.minimaxi.com/v1/video_generation`

3. **MANUS Agent Execute**:
   - URL: `http://your-manus-server:8000/api/manus/execute`

---

## ⚙️ Step 5: Environment Configuration

### **Workflow Settings**
Update these settings in the appropriate nodes:

#### **Timeout Configuration**
```javascript
// In relevant nodes, update timeout values:
const TIMEOUTS = {
  orchestrator: 30000,     // 30 seconds
  approval: 300000,        // 5 minutes
  agent_execution: 300000, // 5 minutes
  inter_agent_wait: 2000,  // 2 seconds
  dependency_wait: 5000    // 5 seconds
};
```

#### **Retry Configuration**
```javascript
// In error recovery nodes:
const RETRY_CONFIG = {
  max_retries: 3,
  base_delay: 1000,
  max_delay: 30000,
  exponential_base: 2
};
```

---

## 🧪 Step 6: Testing & Validation

### **Test Suite**

#### **Test 1: Simple Voice Command**
```json
{
  "transcript": "Hello, can you help me with a simple task?",
  "userId": "test-user-1"
}
```
**Expected**: Low-risk task, no approval needed, single agent execution

#### **Test 2: Multi-Agent Task**
```json
{
  "transcript": "Analyze market data and create a presentation with charts and a summary video",
  "userId": "test-user-2"
}
```
**Expected**: Medium-risk task, possible approval needed, multiple agents

#### **Test 3: High-Risk Task**
```json
{
  "transcript": "Send emails to all our customers about the new product launch",
  "userId": "test-user-3"
}
```
**Expected**: High-risk task, approval required, external communication

### **Validation Checklist**
- [ ] Webhook receives and processes requests
- [ ] Orchestrator generates valid execution plans
- [ ] Approval system triggers for high-risk tasks
- [ ] Agent routing works correctly
- [ ] Error recovery functions properly
- [ ] Final responses are comprehensive
- [ ] Timeouts are respected
- [ ] Retry logic works as expected

---

## 🔍 Step 7: Monitoring Setup

### **Basic Monitoring**
1. Enable **workflow execution logging**
2. Set up **webhook response monitoring**
3. Configure **error notifications**
4. Monitor **API usage and costs**

### **Advanced Monitoring**
```javascript
// Add monitoring node after major operations
const monitoring = {
  execution_id: $execution.id,
  workflow_name: $workflow.name,
  timestamp: new Date().toISOString(),
  node_name: $node.name,
  execution_time: $execution.executionTime,
  status: 'success' // or 'error'
};

// Send to monitoring service
fetch('https://your-monitoring-service.com/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(monitoring)
});
```

---

## 🚨 Step 8: Security Configuration

### **Webhook Security**
1. **Enable HTTPS** for all webhook endpoints
2. **Add authentication** headers if needed
3. **Implement rate limiting** to prevent abuse
4. **Validate input** thoroughly

### **API Security**
1. **Rotate API keys** regularly
2. **Use environment variables** for secrets
3. **Implement proper CORS** headers
4. **Monitor API usage** for anomalies

### **Access Control**
```javascript
// Add authentication check in preprocessing
const authToken = $input.item.json.authToken;
if (!authToken || !validateToken(authToken)) {
  throw new Error('Unauthorized access');
}
```

---

## 📊 Step 9: Performance Optimization

### **Database Configuration**
If using workflow static data heavily:
```javascript
// Optimize data storage
const optimizeContext = (context) => {
  // Remove unnecessary data
  delete context.raw_responses;
  
  // Compress large objects
  context.compressed_data = compress(context.large_data);
  delete context.large_data;
  
  return context;
};
```

### **Memory Management**
```javascript
// Clear data when no longer needed
if ($execution.mode === 'webhook' && $node.name === 'Send Final Response') {
  $setWorkflowStaticData('sharedContext', null);
  $setWorkflowStaticData('taskQueue', null);
}
```

---

## 🔧 Step 10: Production Deployment

### **Production Checklist**
- [ ] All API credentials configured and tested
- [ ] Webhook URLs are HTTPS
- [ ] Error handling thoroughly tested
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures established
- [ ] Performance optimizations applied
- [ ] Security measures implemented
- [ ] Documentation updated

### **Scaling Considerations**
1. **Horizontal Scaling**: Deploy multiple n8n instances
2. **Load Balancing**: Distribute webhook requests
3. **Queue Management**: Handle burst requests
4. **Resource Monitoring**: Track CPU, memory, and API usage

---

## 🆘 Troubleshooting Guide

### **Common Issues & Solutions**

#### **Issue**: Workflow doesn't trigger
**Symptoms**: No response to webhook requests
**Solutions**:
1. Check workflow is activated
2. Verify webhook URL is correct
3. Ensure HTTP method matches (POST)
4. Check n8n server status

#### **Issue**: Orchestrator returns errors
**Symptoms**: JSON parsing failures, invalid plans
**Solutions**:
1. Verify OpenAI API key is valid
2. Check GPT-4 access permissions
3. Review system prompts for clarity
4. Test with simpler input

#### **Issue**: Agent execution failures
**Symptoms**: HTTP errors, timeouts
**Solutions**:
1. Verify API credentials
2. Check endpoint URLs
3. Test APIs independently
4. Review timeout settings

#### **Issue**: Approval system not working
**Symptoms**: No approval prompts, incorrect routing
**Solutions**:
1. Check risk assessment logic
2. Verify approval node configuration
3. Test with known high-risk inputs
4. Review approval timeout settings

#### **Issue**: Memory/performance problems
**Symptoms**: Slow execution, n8n crashes
**Solutions**:
1. Optimize data storage
2. Clear static data regularly
3. Reduce batch sizes
4. Implement data compression

---

## 📞 Support & Resources

### **Documentation Links**
- [n8n Official Documentation](https://docs.n8n.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Webhook Best Practices](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

### **Community Support**
- [n8n Community Forum](https://community.n8n.io/)
- [GitHub Issues](https://github.com/n8n-io/n8n/issues)
- [Discord Community](https://discord.gg/n8n)

### **Advanced Configuration**
For enterprise deployments, consider:
- Custom authentication providers
- Advanced monitoring and analytics
- Multi-tenant configurations
- Custom agent integrations
- Compliance and audit logging

---

**🎉 Congratulations!** You now have a fully functional AEROS Orchestra multi-agent system running in n8n. The system is ready to handle voice commands, orchestrate multiple AI agents, and provide comprehensive task execution with safety mechanisms and error recovery.

For additional customization or enterprise features, refer to the detailed workflow documentation or contact support.