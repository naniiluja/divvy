# Backend Directory Structure

Divvy backend is entirely Supabase. No separate Node/Express server.

```
supabase/
├── migrations/
│   ├── 00001_init_schema.sql         # Initial tables + RLS
│   ├── 00002_add_invite_links.sql
│   └── ...                           # One file per schema change
├── functions/
│   ├── generate-tasks/
│   │   └── index.ts                  # AI task generation via Anthropic
│   ├── reset-tasks/
│   │   └── index.ts                  # Triggered by pg_cron, resets completions
│   └── _shared/
│       ├── cors.ts                   # CORS headers (fallback — prefer jsr:@supabase/supabase-js@2/cors)
│       └── supabase-client.ts        # Shared Supabase admin client
└── seed.sql                          # Dev seed data (not pushed to prod)
```

## Edge Function File Structure

Each Edge Function is a single `index.ts` file in its own directory:

```ts
// supabase/functions/generate-tasks/index.ts

import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.39'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ... implementation
    return Response.json({ tasks }, { headers: corsHeaders })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
})
```

## Naming Conventions

- Migration files: `NNNNN_verb_noun.sql` (e.g., `00003_add_task_reset_flag.sql`)
- Edge Functions: `kebab-case` directory names matching action (`generate-tasks`, `reset-tasks`)
- Shared utilities: `_shared/` prefix
- Supabase secrets: `SCREAMING_SNAKE_CASE` (e.g., `ANTHROPIC_API_KEY`)
