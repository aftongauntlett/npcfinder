Trigger a refactor proposal when you see:

- Components >~200 lines, or handling clearly distinct concerns.
- Repetition of the same markup/logic ≥3 times.
- Complex conditionals that hide domain rules; propose helper functions or state machines.
- Data fetching + presentation tangled; propose hook + presentational split.
- Props or context creeping beyond clarity; propose composition or colocation.
