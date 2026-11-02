# TutorHub agent guidance

TutorHub is a React/Vite frontend with a .NET 8 API, PostgreSQL, Redis, and payment/escrow workflows. Use `README.md` for setup, `DESIGN.md` for interface conventions, and the current code and migrations for implemented behavior. Read only the parts relevant to the task.

## Skills

The user's Codex skills are installed outside this repository. Use the available skill catalog and read a skill's `SKILL.md` when the task matches its description or the user names it. Do not copy skill folders into this repository. A skill's availability does not make it applicable to every task; choose the smallest useful set and follow the user's specific instructions.

| Work in or around TutorHub | Skills to consider when available |
| --- | --- |
| React pages, components, responsive layouts, accessibility, design tokens, UI review | `frontend-design`, `ui-ux-pro-max`, `ui-styling`, `design-system`; use `webapp-testing` for browser verification |
| Brand identity, marketing banners, static art, generated images, visual themes | `brand`, `design`, `banner-design`, `canvas-design`, `imagegen`, `algorithmic-art`, `theme-factory`; use `brand-guidelines` only for Anthropic-branded material |
| Project documentation, reports, proposals, internal updates | `doc-coauthoring`, `internal-comms`; use `discernment-nudge` when its response criteria apply |
| Word, PDF, slide, or spreadsheet deliverables | `docx` or `documents:documents`; `pdf` or `pdf:pdf`; `pptx`, `slides`, or `presentations:Presentations`; `xlsx` or `spreadsheets:Spreadsheets`; choose the workflow that matches the requested file |
| Reusable document or artifact templates | `template-creator:template-creator` |
| OpenAI/Codex integration or guidance, Claude integration or training, MCP servers, connected services | `openai-docs`, `claude-api`, `academy-guide`, `mcp-builder`, `plugin-management:plugin-management` when their own triggers apply |
| Creating or installing skills | `skill-creator` or `skill-installer` when explicitly requested |
| A separate Sites-hosted website or remix | `sites:sites` or `sites:sites-remix` when the user requests that platform; ordinary TutorHub frontend changes belong in `src/frontend` |
| Complex standalone web artifact, live Excel session, Slack GIF, or ChatGPT Pet | `web-artifacts-builder`, `spreadsheets:excel-live-control`, `slack-gif-creator`, `work-pets:create-pet`, `work-pets:pets`, or `work-pets:update-pet` only for the matching deliverable/service |

`template-skill` is an unconfigured example. Do not use it as project guidance. Skills that do not match a TutorHub task remain available for future requests but need no project setup.

## Local plans and testing artifacts

Store implementation plans, design-work notes, per-run test reports, screenshots, Playwright traces, and test-session state outside this repository in `C:/Users/Nguyen Nguyen/Documents/TutorHub-local/`. Use `plans/` for plans and `testing/` for test reports and artifacts. Do not create these documents in the project, even under an ignored folder.

The entire `scripts/` directory is local-only and ignored by Git. Do not add it back to the index. Store new ad hoc test runners in the external `testing/runners/` folder. Shared automated regression test source in `src/test` and `src/frontend/test` remains part of the repository. CI must use direct commands rather than depend on local scripts.

## Verification

After completing a task and running the relevant checks, create a focused Git commit for that task. Do not include unrelated changes or push to a remote unless requested.

For code changes, run checks that exercise the changed behavior. Backend projects use `dotnet build src/backend/TutorHub.sln` and targeted `dotnet test`; frontend uses `npm run lint` and `npm run build` from `src/frontend` when relevant. API integration tests need the PostgreSQL test database described in `README.md`. Do not claim a test passed unless it ran in the current work.
