# TODO

## Get a model API key (Groq, the default)

Hugging Face ran out of free credits (402), so the default is now Groq, which serves the same `openai/gpt-oss-120b` model on a free tier.

- [ ] Sign in or create a free account at https://console.groq.com
- [ ] Open **API Keys**: https://console.groq.com/keys
- [ ] **Create API Key**, give it a name (e.g. `scopeguard-local`)
- [ ] Copy the key (starts with `gsk_`). It is shown only once.
- [ ] Local: in `.envs/.local/.django` (gitignored), replace the old `hf_` key and point at Groq:
  ```
  LLM_BASE_URL=https://api.groq.com/openai/v1
  LLM_MODEL=openai/gpt-oss-120b
  LLM_API_KEY=gsk_your_key_here
  ```
  Then recreate the Django container so it picks up the change:
  ```bash
  docker compose -f docker-compose.local.yml up -d --force-recreate django
  ```
- [ ] Re-run a failed check in the app and confirm it gets a verdict
- [ ] Render: create a separate key (e.g. `scopeguard-prod`) and paste it into the `LLM_API_KEY` prompt when creating the Blueprint. Never commit it.
- [ ] Check the free tier's rate limits at https://console.groq.com/settings/limits. If judges hit them, the app shows a readable error and a Re-run button.

### Other providers (optional)

Get a key from the provider, then change all three of `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL`. Copy the exact model ID from the provider's model list.

| Provider   | Key page                           | `LLM_BASE_URL`                   |
| ---------- | ---------------------------------- | -------------------------------- |
| Hugging Face | huggingface.co/settings/tokens   | `https://router.huggingface.co/v1` |
| Together   | api.together.ai/settings/api-keys  | `https://api.together.xyz/v1`    |
| OpenRouter | openrouter.ai/settings/keys        | `https://openrouter.ai/api/v1`   |

## Before publishing the blog post

- [ ] Run one real scope check and confirm the provider honours the JSON schema
- [x] Deploy the app and API to Render (`scopeguard.icvn.tech`); the post says it's live
- [ ] Confirm "a fraction of a cent per check" against current token pricing
- [ ] Add screenshots of the dashboard and an out-of-scope result card
