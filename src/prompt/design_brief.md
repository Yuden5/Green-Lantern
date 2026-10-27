REDESIGN BRIEF — Bangkok Urban Green Atlas
1. Your role
Act as a senior frontend designer, creative director, and frontend engineer. Use the installed Taste Skill (design-taste-frontend) as a core design reference. Read its SKILL.md completely before planning or implementing anything.

The goal is a professionally redesigned, distinctive, emotionally engaging, and highly interactive website—not merely a recoloring or a collection of generic cards.

2. Strict project scope
Only redesign these existing public-facing pages:

Home
Policy
District Analysis
Do not modify the Dashboard. It belongs to another team. Do not change its files, styles, components, routes, data logic, map, layout, or behavior. Avoid editing shared styles or components if doing so could change the Dashboard. Prefer scoped styles and page-specific components.

Preserve the existing application architecture, routing, working features, and real data. Do not replace the project with a new app.

3. Creative direction
Create an immersive Bangkok Urban Green Atlas: a thoughtful, editorial, contemporary digital experience that connects Bangkok’s green spaces, public policy, and district-level data.

The experience should feel alive, atmospheric, memorable, and carefully art-directed. Balance visual storytelling with analytical credibility. Avoid generic SaaS dashboards, repetitive rounded cards, excessive gradients, decorative clutter, and default-looking AI-generated layouts.

Use the existing forest-green, botanical, and pale-background palette as a starting point, but improve the full visual system: typography, spacing, hierarchy, composition, transitions, and visual rhythm.

4. Floating island centerpiece
The existing floating-island illustration is an important part of the site’s identity.

Keep the existing illustration and its recognizable concept.
Make it substantially larger and more visually prominent on the Home page.
Improve its composition, placement, surrounding atmosphere, and relationship to the page’s content.
Make it feel intentional and distinctive rather than like a small decorative image.
Inspect the actual asset before deciding how to improve it. Reuse and enhance existing assets where practical.
Do not replace it with an unrelated illustration or remove it simply because a different design is easier.
Use motion thoughtfully where appropriate, with reduced-motion support.

5. Home page
Reimagine the Home page as an engaging introduction to Bangkok’s urban greenery.

Establish a strong visual identity immediately.
Create a compelling hero composition around the floating island.
Improve the headline, supporting copy, typography, and calls to action while preserving the site’s purpose and factual meaning.
Create a clear visual journey into Policy and District Analysis.
Use meaningful visual storytelling, subtle movement, and interactive details where they add value.
Make the page feel polished and alive without sacrificing readability or performance.
6. Policy page
Preserve the existing policy information, figures, charts, and intended meaning. Redesign how people understand and explore the information.

The page includes targets and performance indicators such as:

10 m² of green space per person
50% of the city within 400 m of green space
30% urban tree canopy target
FY2025 performance and timeline
Remaining gaps between current performance and targets
Interactive comparisons of green-space sites
Inspect the existing data and calculations before changing any visualization. Do not invent figures, update numbers without evidence, or silently change definitions.

Design this page as a clear policy narrative: what Bangkok is aiming for, where it stands, what remains to be achieved, and how individual green-space sites compare.

Use engaging, legible visualizations and meaningful interactions. Avoid presenting every metric as an identical KPI card. Make chart labels, units, legends, and comparisons easy to understand on desktop and mobile. Retain the underlying data and working interactions.

If a figure or calculation appears inconsistent, flag it in your findings rather than silently correcting it.

7. District Analysis and the official interactive map
Preserve the existing district-analysis purpose and data while making the page more coherent, engaging, and easy to explore.

The existing “Green Space Distribution” section uses a screenshot of the 15-Minute Green Space / 2030 Green Bangkok Project map. I would prefer to reuse the official interactive map rather than build another native map.

Official map:
https://greener.bangkok.go.th/en/map-15-minute-garden/

Investigate the following before implementation:

Inspect the official page and determine whether it offers an officially supported embed or another permitted integration method.
Check whether the map can be integrated reliably and responsively without scraping private endpoints or depending on undocumented APIs.
Preserve clear attribution and link users to the official source.
If a reliable, permitted embedded experience is not feasible, create a well-designed section introducing the official map with a clear link to open it. Do not pretend a static screenshot is interactive.
Do not download, scrape, or republish data unless its availability, terms, and appropriate use have been verified.
Official dataset reference for investigation:
https://data.go.th/en/dataset/15min

Do not assume the dataset is complete, current, or licensed for reuse without verifying it.

Improve the surrounding district-analysis experience, section hierarchy, explanations, chart readability, and transitions into the map. Do not create a duplicate map if the official interactive experience is the better option.

8. Interaction and motion
Make the public-facing experience genuinely interactive, not just animated.

Consider appropriate interactions such as:

Hover, focus, and click states that communicate purpose
Thoughtful navigation between the three public pages
Interactive chart exploration and comparisons
Clear visual feedback for selections and filters
Subtle transitions between content sections
Responsive interactive elements that remain usable on touchscreens
Use existing libraries and project conventions where possible. Do not add heavy dependencies without a clear benefit. Every interaction must work, have an understandable purpose, and remain accessible by keyboard where applicable.

9. Visual and technical quality
Inspect existing code and assets before making design decisions.
Use the installed Taste Skill throughout the design process.
Establish a coherent typography, color, spacing, and component system for the three public pages.
Use scoped styles so the Dashboard remains unaffected.
Preserve existing routes, real data, working functionality, and important content.
Ensure responsive behavior on desktop, tablet, and mobile.
Maintain readable contrast, visible focus indicators, semantic structure, and reduced-motion support.
Avoid unnecessary duplicated CSS, fragile overrides, fake functionality, and placeholder data.
Do not add dependencies unless needed and justified.
Do not expose secrets, credentials, or private configuration.
Verify changes and check for regressions before declaring the work complete.
10. Required workflow
Work in stages and explain your plan before implementing.

Stage A — Audit and plan ONLY
Do not edit, create, delete, or overwrite project files.

Read the complete Taste Skill instructions.
Inspect the project structure, routes, public-page components, relevant styles, and assets.
Identify exactly which files implement Home, Policy, and District Analysis.
Identify shared components and styles that could affect the Dashboard.
Review the floating-island asset and how it is currently used.
Inspect the existing policy and district data and interactions.
Investigate the official map integration options and limitations.
Propose a cohesive creative direction for all three pages.
Provide a concise implementation plan listing the exact files you intend to change and why.
Flag uncertainties, data inconsistencies, risks, or integration limitations.
Do not start implementation during Stage A. Wait for my explicit approval.

Stage B — Home page
After approval, implement the Home page redesign only. Summarize the files changed and checks performed, then pause for review.

Stage C — Policy page
After approval, implement the Policy page redesign only. Preserve and verify the data and existing functionality, then pause for review.

Stage D — District Analysis page
After approval, implement the District Analysis redesign and the verified official-map integration or fallback. Then pause for review.

Stage E — Final verification
After approval, check all three public pages for visual consistency, responsiveness, accessibility, working interactions, and regressions.

Verify that Dashboard files and behavior remain untouched. Report any checks that could not be completed; never claim a test passed unless it was actually performed.

11. Approval rule
I am learning and want to remain in control of the process. Explain findings in plain language and proceed one stage at a time. Do not skip ahead, silently expand the scope, or make changes before I approve them.

My immediate request is Stage A only: inspect, investigate, and propose a plan. No file edits yet.