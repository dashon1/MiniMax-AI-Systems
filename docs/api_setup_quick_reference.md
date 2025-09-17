# API Integration Quick Setup Commands

## Environment Variables Setup

Once you have obtained the API keys, set them in your Supabase project using the Supabase CLI or dashboard:

```bash
# Supabase CLI method (if you have CLI access)
supabase secrets set DISCORD_BOT_TOKEN="your-discord-bot-token"
supabase secrets set TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
supabase secrets set GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token"
supabase secrets set AIRTABLE_API_KEY="your-airtable-key"
supabase secrets set ANTHROPIC_API_KEY="your-anthropic-key"
supabase secrets set HUGGINGFACE_API_TOKEN="your-huggingface-token"
supabase secrets set REPLICATE_API_TOKEN="your-replicate-token"
supabase secrets set SLACK_BOT_TOKEN="your-slack-bot-token"
supabase secrets set GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"..."}'
```

## Quick Test Commands

Test each API integration using curl:

```bash
# Test OpenAI (already working)
curl -X POST https://ftxadlakjhklmrfznciq.supabase.co/functions/v1/openai-integration \
  -H "Content-Type: application/json" \
  -d '{"service": "chat_completion", "messages": [{"role": "user", "content": "Hello!"}]}'

# Test Discord Bot
curl -X POST https://ftxadlakjhklmrfznciq.supabase.co/functions/v1/discord-bot-integration \
  -H "Content-Type: application/json" \
  -d '{"action": "get_bot_info"}'

# Test Telegram Bot
curl -X POST https://ftxadlakjhklmrfznciq.supabase.co/functions/v1/telegram-bot-integration \
  -H "Content-Type: application/json" \
  -d '{"action": "get_bot_info"}'

# Test GitHub
curl -X POST https://ftxadlakjhklmrfznciq.supabase.co/functions/v1/github-integration \
  -H "Content-Type: application/json" \
  -d '{"action": "get_user_info"}'
```

## API Endpoints Summary

| API | Function URL | Status |
|-----|-------------|--------|
| OpenAI | `/functions/v1/openai-integration` | ✅ Active |
| Discord | `/functions/v1/discord-bot-integration` | ⚠️ Needs Token |
| Telegram | `/functions/v1/telegram-bot-integration` | ⚠️ Needs Token |
| GitHub | `/functions/v1/github-integration` | ⚠️ Needs Token |
| Airtable | `/functions/v1/airtable-integration` | ⚠️ Needs Token |
| Anthropic | `/functions/v1/anthropic-integration` | ⚠️ Needs Token |
| Hugging Face | `/functions/v1/huggingface-integration` | ⚠️ Needs Token |
| Replicate | `/functions/v1/replicate-integration` | ⚠️ Needs Token |
| Slack | `/functions/v1/slack-integration` | ⚠️ Needs Token |
| Google Sheets | `/functions/v1/google-sheets-integration` | ⚠️ Needs Credentials |

## Database Tables Created

- `api_configurations` - Main API settings
- `api_usage_logs` - Usage tracking
- `api_rate_limits` - Rate limiting
- `api_health_checks` - Health monitoring
- `api_integration_templates` - Quick setup templates

## Admin Access

1. **Login** to AEROS platform
2. **Navigate** to `/admin/apis` for API management
3. **Use** `/admin/api-testing` for interactive testing
4. **Monitor** usage via analytics dashboard

All APIs are deployed and ready - just add your API keys to activate them!