# SpinSmith Playlist Builder – Build Plan

## 1. Product Vision
Create a web application that dramatically reduces the time and effort indoor cycling (spin) instructors spend crafting class playlists. The app should automatically generate high-quality playlists that align with instructor musical tastes, introduce curated variety, and match the workout profile of a planned class (duration, intensity, segment types).

## 2. Target Users & Core Value
- **Primary user:** Spin instructors preparing classes.
- **Value proposition:** Fast, tailored playlist generation aligned to class objectives, with built-in discovery and refinement tools.

## 3. MVP Scope & Requirements
### 3.1 Key Flows
1. **Class configuration intake**
   - Duration selector (30/45/60 minutes + custom)
   - Class difficulty/intensity slider
   - Class type presets (e.g., Endurance, Sprint-heavy, Climb-heavy, Mixed)
   - Optional thematic keywords, instructor notes, or desired vibes
   - Explicit content toggle, remix preference, freshness slider (existing MVP concepts)
2. **Music preference inputs**
   - Instructor genre & artist preferences (multi-select + exclusion)
   - Ability to seed favorite tracks or existing playlists for inspiration
3. **Playlist generation via LLM orchestration**
   - Prompt engineering layer for ChatGPT to ingest configuration + catalog context
   - Generate structured segment plan + track recommendations
   - Provide reasoning metadata (why each track fits)
4. **Review & refinement**
   - Present generated playlist with segments, BPMs, energy levels
   - Allow replace/reshuffle individual tracks or entire segments
   - Save/export playlist to CSV, PDF, or streaming platform links (MVP: mock export)

### 3.2 Non-functional Goals
- Responsive web experience optimized for desktop, usable on tablet/mobile
- Latency target: <5s perceived response for generation (depends on OpenAI API latency)
- Basic auth guard (passwordless magic link or simple login) considered for future

## 4. Architecture Overview
```
Frontend (React + Vite + Tailwind)         Backend (Node/Express or Edge Functions)
- UI components for forms, playlist view   - API proxy for OpenAI ChatGPT requests
- State management (React Query/Zustand)   - Business logic: prompt assembly, validation
- Client-side routing (React Router)       - Optional persistence (Supabase/Firebase)
```
- **External APIs:** OpenAI ChatGPT (gpt-4.1/4o) for playlist generation; optional music metadata APIs (Spotify, Apple Music) for enrichment in later phases.
- **Data Sources:** Start with curated mock catalog (existing MVP). Transition to dynamic catalog via Spotify API once authentication workflows defined.

## 5. Milestones & Deliverables
| Milestone | Duration | Deliverables |
|-----------|----------|--------------|
| **M0 – Planning & Design** | 1 week | UX wireframes, data flow diagrams, API contract, prompt strategy |
| **M1 – Frontend Intake & State Layer** | 1.5 weeks | Config forms, validation, local state management, mocked generation trigger |
| **M2 – LLM Orchestration Service** | 2 weeks | Backend endpoint calling ChatGPT, prompt templating, safety guardrails, caching |
| **M3 – Playlist Review UI** | 1 week | Generated playlist visualization, segment editing, replace track interactions |
| **M4 – Export & Polish** | 1 week | Export stubs, user settings persistence, loading/error states, responsive QA |
| **M5 – Beta Hardening** | 1 week | Observability, analytics hooks, feedback loop, accessibility audit |

## 6. Detailed Task Breakdown
### 6.1 Planning & UX
- Review existing assumptions about instructor personas & JTBD that informed the MVP
- Define acceptance criteria per user flow
- Produce Figma wireframes and component inventory

### 6.2 Frontend Implementation
- Audit existing MVP components; align on design system tokens
- Implement multi-step configuration wizard using existing Tailwind components
- Introduce global state (Zustand or React Query + Context) to store form inputs and results
- Build skeleton loaders and optimistic UI for generation request

### 6.3 Backend / API Layer
- Scaffold lightweight Node/Express service (or serverless functions) within Vite project or separate repo
- Implement `/generate-playlist` endpoint
  - Validate payload, transform into prompt for ChatGPT
  - Inject curated catalog snippets for grounding
  - Handle retries, rate limiting, and error messaging
- Implement feature flag for mock vs. real LLM responses (fallback to local heuristic generator)

### 6.4 LLM Prompting Strategy
- Craft system prompt describing role (expert spin instructor & music curator)
- Template user prompt with:
  - Class configuration summary
  - Music preferences
  - Desired output schema (JSON with segments, tracks, reasoning)
- Leverage function calling or JSON mode to enforce structure
- Post-process response to map to UI model

### 6.5 Playlist Review & Editing
- Render segments in timeline order with metrics (duration, BPM, energy)
- Provide actions: swap track (re-prompt with constraints), adjust duration, mark as favorite
- Track change history for later analytics

### 6.6 Export & Persistence
- For MVP, allow export to CSV and copy-to-clipboard track list
- Store instructor preferences locally (localStorage) with path to integrate Supabase auth later
- Outline integration steps for Spotify API (OAuth flow, playlist creation)

### 6.7 Quality Assurance
- Automated tests: component unit tests (Vitest + Testing Library), integration tests for API calls, contract tests for LLM output parsing
- Manual QA scripts focused on generation reliability, edge cases (short/long classes)
- Observability: integrate basic logging + error tracking (e.g., Sentry)

## 7. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM output inconsistency | Broken playlists | Use JSON mode, validate responses, implement retry/backoff with guardrails |
| API latency/cost | Poor UX, high spend | Cache common prompts, provide mock mode, streaming responses |
| Limited music catalog coverage | Non-viable recommendations | Augment with Spotify API once authentication is in place |
| Instructor trust | Low adoption | Provide explainability metadata, allow manual edits |

## 8. Future Enhancements
- Mobile-first redesign with offline mode for in-studio access
- Instructor profiles with saved templates and analytics on class performance
- Collaborative playlist editing & sharing between instructors
- Integration with heart-rate or cadence data to auto-balance segments
- Direct publishing to Spotify/Apple Music and auto-download of clean/explicit versions

## 9. Success Metrics
- Time-to-playlist: <2 minutes from intake completion to final playlist
- Playlist satisfaction rating ≥4/5 in beta surveys
- ≥80% of generated playlists include at least one new-to-instructor track

## 10. Next Steps
1. Confirm MVP scope with stakeholders asynchronously (no additional research cycles)
2. Begin implementing the frontend intake flow using existing component primitives
3. Scaffold the backend playlist generation endpoint to unblock ChatGPT integration

