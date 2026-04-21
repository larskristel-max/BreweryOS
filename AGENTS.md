# 📘 Operon (BrewOS) — agents.md

This document defines how agents (Codex, ChatGPT, or any future AI contributor) must operate when working on the Operon codebase and product.

It is derived from the full project history, decisions, regressions, architecture work, and product pivots.

This is NOT a suggestion document.
These are **operating rules**.

⸻

# 1. 🧠 PRODUCT UNDERSTANDING (MANDATORY)

Operon is NOT a traditional app.

It is:
→ a **mobile-first brewery operating system**

Core principle:
User acts → system suggests → user confirms → system structures, links, and logs data

The system must:

* reduce admin
* preserve traceability
* guide real-world workflows
* never block operations

⸻

# 2. 🔴 CORE PRODUCT MODEL (DO NOT BREAK)

## 2.1 Action-first system

Operon is:

❌ NOT tab-driven
❌ NOT form-driven
❌ NOT navigation-driven

Operon IS:

✅ action-driven
✅ flow-driven
✅ context-driven

---

## 2.2 Let’s Brew = system core

Let’s Brew is:

→ the **primary operating interface**

It must:

* be the main entry point
* drive ALL operational flows
* eventually host AI routing

Agents MUST NOT:

* demote Let’s Brew to a feature
* duplicate its role elsewhere

---

## 2.3 Ops page = dashboard only

Ops is:

→ overview + preview + navigation entry

It must:

* show:

  * active batches
  * tasks
  * agenda
  * financials
* link via “See more”

It must NOT:

* become an execution interface

---

## 2.4 Navigation is secondary

Navigation must:

* be minimal
* not compete with Let’s Brew
* not reintroduce tab-heavy UX

Agents MUST NOT:

* add new top-level tabs
* rebuild multi-tab paradigms

---

# 3. 🧱 ARCHITECTURE (LOCKED)

## 3.1 Three-layer system

Airtable = operational truth
Notion = semantic/workflow brain
App = input + runtime + orchestration

Agents MUST NOT:

* move operational data to Notion
* bypass Airtable for structured records
* duplicate responsibilities across layers

---

## 3.2 Generic vs instance split

System must support:

* generic templates (App Core)
* brewery-specific instance (Ops Base)

Agents MUST:

* preserve this separation
* never hardcode brewery-specific assumptions globally

---

## 3.3 Data principles

* Plan ≠ Actual (never overwrite recipes)
* No blocking workflows
* Partial input is allowed
* All fields optional unless absolutely required

---

## 3.4 Inventory rules (CRITICAL)

* Inventory Movements = stock truth
* No direct stock editing
* Pending Movements = allowed temporary bypass
* Lots are immutable
* Packaging creates child lots

Agents MUST NEVER:

* mutate stock directly
* bypass movement logic

---

# 4. ⚙️ CODEBASE RULES

## 4.1 Current architecture

* Vanilla JS (modularized)
* No framework
* No build pipeline (yet)
* Cloudflare Pages hosting

Modules include:

* core/
* domain/
* ui/
* airtable/
* tasks/
* agenda/

---

## 4.2 Structural rule (from Phase 8)

Separation of concerns is mandatory:

* core = lifecycle / state / navigation / semantics
* domain = business logic
* ui = rendering only
* data = Airtable interaction

Agents MUST NOT:

* mix logic into UI files
* duplicate ownership across files
* reintroduce index.html monolith behavior

---

## 4.3 Boot / load safety

* No premature execution
* Respect script load order
* Do not call functions before definition

This caused real failures before (boot-order bug).

---

# 5. 🎨 UI / UX RULES

## 5.1 Design language

* calm
* industrial
* low-noise
* mobile-first
* soft spacing
* no aggressive colors

---

## 5.2 Visual hierarchy (CRITICAL)

Must clearly separate:

1. Shell (background)
2. Operational content (primary)
3. Guidance (secondary)

Agents MUST:

* avoid flat UI
* avoid “washed-out grey soup”
* ensure operational content dominates

---

## 5.3 Shell rules (iOS critical)

* Single layout owner (`.app`)
* No multiple safe-area owners
* No duplicated env() usage
* Must work in:

  * Safari
  * iOS standalone (PWA)

Past failures:
→ grey band
→ layout shift
→ broken safe-area

Agents MUST NOT reintroduce these.

---

## 5.4 Bottom navigation

Must:

* be anchored to safe-area bottom
* feel native
* not float unnaturally high
* not compete with Let’s Brew

---

## 5.5 Action system

Primary pattern:

→ top-right circular actions

FAB usage:

* only where justified
* consistent across screens

Agents MUST NOT:

* mix multiple action paradigms
* duplicate entry points

---

## 5.6 Guidance system

* unified visual system
* lighter than operational content
* toggleable

Must NOT:

* compete with real work
* feel like primary content

---

# 6. 🔄 FLOWS (CRITICAL PRODUCT LAYER)

All flows must:

* start from Let’s Brew
* be guided (not forms)
* allow partial input
* be non-blocking

Core flows:

* Brew execution
* Logging (gravity/temp/notes)
* Packaging
* Inventory movement
* Task continuation

Agents MUST:

* keep flows simple
* avoid form-heavy UX
* avoid multi-step friction unless necessary

---

# 7. 🤖 AI LAYER (FUTURE BUT STRUCTURAL)

AI will:

* take user input (text/voice)
* detect intent
* map to structured actions
* require confirmation

Agents MUST:

* design flows compatible with AI routing
* avoid rigid UI that blocks AI integration

---

# 8. 🚫 WHAT AGENTS MUST NOT DO

* Add new top-level tabs
* Rebuild tab-heavy navigation
* Convert to React / TS prematurely
* Introduce Tailwind globally
* Modify Airtable structure without explicit phase
* Expand Notion unnecessarily
* Reintroduce blocking workflows
* Break safe-area / shell system
* Duplicate logic across modules

---

# 9. 🧭 DEVELOPMENT PHILOSOPHY

Always follow:

Stabilize → Structure → Then expand

NOT:

Expand → Fix later

---

# 10. 🧪 TESTING EXPECTATIONS

After any change, agents must verify:

* App loads cleanly
* No console errors
* Navigation stable
* Tasks / Agenda still work
* No layout shifts
* No safe-area issues
* Works in iOS standalone context

---

# 11. 📊 CURRENT PRIORITY ORDER

1. Action system consolidation (Let’s Brew)
2. Flow integration
3. UI hierarchy refinement
4. Onboarding system
5. AI routing (MVP)
6. Only later:

   * TypeScript
   * Tailwind
   * build pipeline

---

# 12. 🧠 FINAL RULE

Operon is not a UI project.

It is:
→ an operational system

Agents must always ask:

“Does this help the brewer act faster, safer, and with less admin?”

If not:
→ it does not belong

---

END
