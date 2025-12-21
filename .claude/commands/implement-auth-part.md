---
argument-hint: [implementation-plan, types]
description: Create a plan for API endpoint implementation
model: claude-sonnet-4-5-20250929
---

Your task is to implement a part of authorization flow based on the provided implementation plan. Your goal is to create a solid and well-organized implementation that includes appropriate validation, error handling, and follows all logical steps described in the plan.

First, carefully review the provided implementation plan:

<implementation_plan>
{{implementation-plan}}
</implementation_plan>

<types>
{{types}} <- add reference to type definitions (e.g., @types)
</types>

Follow best practices described here: @.ai/supabase-auth.md

<implementation_approach>
Implement a maximum of 3 steps from the implementation plan, briefly summarize what you've done, and describe the plan for the next 3 actions - stop work at this point and wait for my feedback.
</implementation_approach>