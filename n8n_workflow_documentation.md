# AEROS Orchestra n8n Workflow - Complete Documentation

## 🎯 Overview

This enhanced n8n workflow implements a sophisticated multi-agent orchestration system based on the AEROS (Autonomous Enterprise Resource Optimization System) architecture. It provides voice-activated task processing with intelligent agent routing, safety mechanisms, and comprehensive error handling.

---

## 🏗️ Workflow Architecture

### **Core Components**

1. **Voice Input Pipeline** - Webhook → Preprocessing → Orchestration
2. **Central Orchestrator** - AI-powered task analysis and planning
3. **Safety Layer** - Human-in-the-loop approval system
4. **5-Agent Execution System** - Specialized agent routing and execution
5. **Collaboration Framework** - Shared context and inter-agent communication
6. **Error Recovery System** - Comprehensive fallback and retry mechanisms

---

## 📋 Node-by-Node Documentation

### **1. Voice Input Webhook**
**Type:** `n8n-nodes-base.webhook`  
**Purpose:** Entry point for voice commands and task requests  
**Configuration:**
- **Method:** POST
- **Path:** `orchestra-webhook`
- **Response Mode:** responseNode

**Expected Input:**
```json
{
  "transcript": "Create a market analysis for solar panels",
  "audioUrl": "optional_audio_file_url",
  "userId": "user_identifier",
  "sessionId": "session_identifier"
}
```

### **2. Preprocess Input**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Validate and normalize input data  
**Function:**
- Extract transcript from various input formats
- Generate session IDs for tracking
- Validate required fields
- Initialize session metadata

### **3. Orchestrator Brain**
**Type:** `@n8n/n8n-nodes-langchain.openAi`  
**Purpose:** Central AI agent for task analysis and planning  
**Model:** GPT-4  
**Key Features:**
- Understands user intent
- Maps tasks to appropriate agents
- Assesses risk levels
- Creates execution plans
- Determines approval requirements

**Agent Mapping:**
- **MANUS**: Enterprise automation, workflow optimization
- **GENSPARK**: Creative content, innovation strategy  
- **ABACUS**: Data analytics, statistical modeling
- **MINIMAX**: AI optimization, model training
- **MVP**: Startup strategy, market validation

### **4. Parse Plan**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Extract and validate JSON execution plan  
**Error Handling:** Implements fallback plan if parsing fails  
**Output Structure:**
```json
{
  "user_intent": "Brief description",
  "complexity_score": 1-10,
  "risk_level": "low/medium/high",
  "requires_approval": true/false,
  "tasks": [{
    "id": "task_1",
    "agent": "AGENT_NAME",
    "description": "Task details",
    "priority": "high/medium/low",
    "depends_on": [],
    "timeout_seconds": 300,
    "retry_count": 3
  }]
}
```

### **5. Safety & Approval System**

#### **Check Approval Required**
**Type:** `n8n-nodes-base.if`  
**Purpose:** Route high-risk tasks through approval process

#### **Human Approval Gate**
**Type:** `n8n-nodes-base.wait`  
**Purpose:** Human-in-the-loop safety mechanism  
**Features:**
- Clear task description and risk assessment
- Approve/Deny/Modify options
- 5-minute timeout for responses
- Comprehensive plan preview

#### **Check Approval Response**
**Type:** `n8n-nodes-base.if`  
**Purpose:** Process human approval decision

### **6. Execution Initialization**

#### **Initialize Execution**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Set up shared context and task queue  
**Creates:**
- Session-wide shared context
- Task queue with dependencies
- Result tracking system
- Execution metadata

#### **Task Iterator**
**Type:** `n8n-nodes-base.splitInBatches`  
**Purpose:** Process tasks sequentially

### **7. Task Processing Pipeline**

#### **Check Dependencies**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Ensure task dependencies are met  
**Features:**
- Dependency validation
- Shared context preparation
- Task readiness verification

#### **Dependencies Check**
**Type:** `n8n-nodes-base.if`  
**Purpose:** Route tasks waiting for dependencies

#### **Wait for Dependencies**
**Type:** `n8n-nodes-base.wait`  
**Purpose:** Delay execution until dependencies complete

### **8. Agent Routing System**

#### **Route to Agent**
**Type:** `n8n-nodes-base.switch`  
**Purpose:** Direct tasks to appropriate specialized agents  
**Routing Logic:**
- MANUS → Enterprise automation tasks
- GENSPARK → Creative and research tasks (with fallback)
- ABACUS → Data analysis and ML tasks
- MINIMAX → AI optimization and media generation
- MVP → Startup strategy and market analysis

### **9. Agent Execution Nodes**

#### **ABACUS Agent Execute**
**Type:** `n8n-nodes-base.httpRequest`  
**API:** `https://api.abacus.ai/v2/predict/executeAgentWithBinaryData`  
**Purpose:** Advanced data analytics and ML operations  
**Timeout:** 300 seconds (configurable)  
**Retries:** 3 attempts with exponential backoff

#### **GENSPARK Fallback Handler**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Handle GenSpark API unavailability  
**Strategy:** Route to Manus for web automation fallback  
**Features:**
- Automated web interface interaction
- Configurable selectors and timeouts
- Results extraction and formatting

#### **MINIMAX Agent Execute**
**Type:** `n8n-nodes-base.httpRequest`  
**API:** `https://api.minimaxi.com/v1/video_generation`  
**Purpose:** Video, audio, and image generation  
**Features:**
- Multi-modal content creation
- High-definition output (1080p)
- Custom duration and quality settings

#### **MANUS Agent Execute**
**Type:** `n8n-nodes-base.httpRequest`  
**API:** `http://localhost:8000/api/manus/execute`  
**Purpose:** Web automation and file operations  
**Features:**
- Browser automation
- File system operations
- API integrations
- Long-running task support

#### **MVP Agent Execute**
**Type:** `@n8n/n8n-nodes-langchain.openAi`  
**Purpose:** Startup strategy and market analysis  
**Model:** GPT-4  
**Specialization:**
- MVP development strategy
- Market research and validation
- Competitive analysis
- Go-to-market planning

### **10. Result Processing & Collaboration**

#### **Process Agent Result**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Standardize agent outputs and update shared context  
**Features:**
- Multi-format result parsing
- Shared context updates
- Task completion tracking
- Inter-agent data handoffs

#### **Inter-Agent Wait**
**Type:** `n8n-nodes-base.wait`  
**Purpose:** Prevent agent collision and resource conflicts  
**Wait Times:**
- MINIMAX: 5 seconds (resource-intensive)
- Others: 2 seconds (standard)

### **11. Error Handling & Recovery**

#### **Check Task Success**
**Type:** `n8n-nodes-base.if`  
**Purpose:** Identify failed tasks for recovery processing

#### **Error Recovery Logic**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Comprehensive error recovery system  
**Features:**
- Retry count tracking
- Maximum retry limits (3 attempts)
- Exponential backoff calculation
- Permanent failure handling

#### **Exponential Backoff**
**Type:** `n8n-nodes-base.wait`  
**Purpose:** Implement intelligent retry delays  
**Formula:** `min(2^attempt * 1000ms, 30000ms)`

#### **Check Retry Action**
**Type:** `n8n-nodes-base.if`  
**Purpose:** Determine retry vs. skip decision

### **12. Task Continuation & Completion**

#### **Check More Tasks**
**Type:** `n8n-nodes-base.if`  
**Purpose:** Continue processing or finalize execution

#### **Generate Final Response**
**Type:** `n8n-nodes-base.code`  
**Purpose:** Create comprehensive execution summary  
**Features:**
- Execution statistics
- Success/failure rates
- Timing analysis
- Result aggregation
- Recommendations

#### **Send Final Response**
**Type:** `n8n-nodes-base.respondToWebhook`  
**Purpose:** Return results to client  
**Format:** JSON with execution metadata

#### **Send Denial Response**
**Type:** `n8n-nodes-base.respondToWebhook`  
**Purpose:** Handle user approval denials  
**Status:** 403 Forbidden

---

## ⚙️ Configuration Requirements

### **Environment Variables**
```bash
# AI Service Keys
OPENAI_API_KEY=your_openai_key
ABACUS_API_KEY=your_abacus_key
MINIMAX_API_KEY=your_minimax_key

# Service Endpoints
MANUS_API_URL=http://localhost:8000/api/manus/execute
ABACUS_API_URL=https://api.abacus.ai/v2/predict/executeAgentWithBinaryData
MINIMAX_API_URL=https://api.minimaxi.com/v1/video_generation

# Workflow Settings
DEFAULT_TIMEOUT=300
MAX_RETRIES=3
APPROVAL_TIMEOUT=300
```

### **n8n Credentials Setup**
1. **OpenAI Credential**: API key for GPT-4 access
2. **Abacus Credential**: HTTP Header Auth with Bearer token
3. **Minimax Credential**: HTTP Header Auth with Bearer token
4. **Manus Credential**: Optional custom authentication

---

## 🔄 Data Flow Architecture

### **1. Input Processing**
```
Voice Input → Preprocessing → Validation → Session Creation
```

### **2. Orchestration**
```
AI Analysis → Task Decomposition → Risk Assessment → Plan Generation
```

### **3. Safety Layer**
```
Risk Check → Human Approval → Decision Processing → Execution Authorization
```

### **4. Agent Execution**
```
Task Queue → Dependency Check → Agent Selection → Execution → Result Processing
```

### **5. Collaboration**
```
Shared Context → Data Handoffs → Inter-Agent Communication → Result Aggregation
```

### **6. Error Recovery**
```
Error Detection → Recovery Logic → Retry/Skip Decision → Backoff → Continuation
```

---

## 🛡️ Safety Mechanisms

### **Risk Classification**
- **HIGH**: Financial transactions, external communications, file modifications
- **MEDIUM**: Data analysis with personal info, public content creation
- **LOW**: Research, simple content generation, basic analysis

### **Human-in-the-Loop Triggers**
- Risk level: MEDIUM or HIGH
- Complexity score: >7
- Multi-agent workflows: >3 agents
- External API integrations
- File system operations

### **Timeout Configuration**
- **Voice input processing**: 30 seconds
- **AI orchestration**: 30 seconds  
- **Human approval**: 300 seconds (5 minutes)
- **Agent execution**: 300 seconds (per task)
- **Inter-agent waits**: 2-5 seconds
- **Dependency waits**: 5 seconds
- **Error backoff**: 1-30 seconds

---

## 🔧 Advanced Features

### **Fallback Strategies**
1. **GenSpark Fallback**: Automatic routing to Manus for web automation
2. **Parse Fallback**: Default task creation on JSON parsing errors
3. **Agent Fallback**: Alternative agent assignment on primary failure
4. **Timeout Fallback**: Graceful degradation on timeout events

### **Shared Context System**
- **Session persistence**: Cross-task data sharing
- **Result aggregation**: Agent output compilation
- **Dependency tracking**: Task prerequisite management
- **State management**: Execution progress monitoring

### **Performance Optimization**
- **Parallel execution**: Independent task processing
- **Resource management**: Agent collision prevention
- **Memory efficiency**: Context cleanup on completion
- **Network optimization**: Request batching and caching

---

## 📊 Monitoring & Analytics

### **Execution Metrics**
- Total execution time
- Task success/failure rates
- Agent utilization statistics
- Error frequency and types
- User approval patterns

### **Response Headers**
```http
X-Execution-Time: 45s
X-Success-Rate: 85%
X-Session-ID: session_1234567890
Content-Type: application/json
```

### **Logging Points**
- Input validation
- Plan generation
- Approval decisions
- Agent executions
- Error occurrences
- Final results

---

## 🚀 Usage Examples

### **Example 1: Simple Research Task**
```json
{
  "transcript": "Research the latest trends in renewable energy"
}
```
**Expected Flow:** Voice Input → Orchestrator → GenSpark Agent → Results

### **Example 2: Complex Multi-Agent Task**
```json
{
  "transcript": "Analyze our sales data, create a forecast, and generate a presentation with a summary video"
}
```
**Expected Flow:** Voice Input → Orchestrator → Approval → Abacus (Analysis) → GenSpark (Presentation) → Minimax (Video) → Results

### **Example 3: High-Risk Task**
```json
{
  "transcript": "Send an email to all customers about our new product launch"
}
```
**Expected Flow:** Voice Input → Orchestrator → **Human Approval Required** → Manus (Email) → Results

---

## 🛠️ Setup Instructions

### **1. Import Workflow**
1. Copy the JSON workflow file
2. Open n8n interface
3. Click "Import from JSON"
4. Paste workflow content
5. Save workflow

### **2. Configure Credentials**
1. Set up OpenAI credential with API key
2. Configure Abacus API authentication
3. Add Minimax API credentials
4. Test all connections

### **3. Environment Setup**
1. Ensure Manus API server is running
2. Configure webhook endpoints
3. Set timeout values
4. Test workflow execution

### **4. Testing**
1. Send test webhook request
2. Verify orchestrator responses
3. Test approval workflow
4. Validate agent executions
5. Check error handling

---

## 📝 Troubleshooting

### **Common Issues**

**Issue**: Workflow not triggering  
**Solution**: Check webhook URL and method configuration

**Issue**: Orchestrator parsing errors  
**Solution**: Verify OpenAI API key and model access

**Issue**: Agent execution failures  
**Solution**: Validate API credentials and endpoint URLs

**Issue**: Approval timeout  
**Solution**: Increase timeout value or check notification delivery

**Issue**: Infinite loops  
**Solution**: Check retry logic and maximum attempt limits

### **Debug Mode**
Enable workflow execution logging to track:
- Node execution order
- Data transformations
- Error details
- Timing information

---

## 📈 Performance Tuning

### **Optimization Strategies**
1. **Adjust timeouts** based on agent performance
2. **Configure retry limits** to balance reliability vs. speed
3. **Optimize wait times** between agent executions
4. **Implement caching** for repeated requests
5. **Monitor resource usage** and scale accordingly

### **Scalability Considerations**
- **Horizontal scaling**: Multiple workflow instances
- **Load balancing**: Distribute agent requests
- **Rate limiting**: Prevent API quota exhaustion
- **Queue management**: Handle burst requests

---

This documentation provides comprehensive guidance for implementing, configuring, and maintaining the AEROS Orchestra n8n workflow. The system is designed for production use with enterprise-grade reliability, safety, and performance characteristics.