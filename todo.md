# TODO

## Get a model API key (Hugging Face, the default)

- [ ] Sign in or create a free account at https://huggingface.co
- [ ] Open **Settings → Access Tokens**: https://huggingface.co/settings/tokens
- [ ] **Create new token** → type **Fine-grained**
- [ ] Tick only **"Make calls to Inference Providers"**
- [ ] Copy the token (starts with `hf_`). It is shown only once.
- [ ] Local: add it to `.envs/.local/.django` (gitignored), then restart the stack:
  ```
  LLM_API_KEY=hf_your_token_here
  ```
  ```bash
  docker compose -f docker-compose.local.yml up
  ```
- [ ] Render: paste it (or a separate token) into the `LLM_API_KEY` prompt when creating the Blueprint. Never commit it.
- [ ] Check the free monthly inference credit at https://huggingface.co/settings/billing. Usage beyond it needs a payment method or PRO.

### Other providers (optional)

Get a key from the provider, then change all three of `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL`. Copy the exact model ID from the provider's model list.

| Provider   | Key page                           | `LLM_BASE_URL`                   |
| ---------- | ---------------------------------- | -------------------------------- |
| Groq       | console.groq.com/keys              | `https://api.groq.com/openai/v1` |
| Together   | api.together.ai/settings/api-keys  | `https://api.together.xyz/v1`    |
| OpenRouter | openrouter.ai/settings/keys        | `https://openrouter.ai/api/v1`   |

## Before publishing the blog post

- [ ] Run one real scope check and confirm the provider honours the JSON schema
- [ ] Deploy to Render and point `scopeguard.icvn.tech` at it (the post says it's live)
- [ ] Confirm "a fraction of a cent per check" against current token pricing
- [ ] Add screenshots of the dashboard and an out-of-scope result card
