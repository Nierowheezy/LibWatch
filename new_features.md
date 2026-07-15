# Future Core Roadmap & Expansion Proposals

The following document catalogs high-yield, architecturally robust features recommended as future roadmap expansions to elevate the utility of LibWatch for production environments.

---

## 1. Webhooks & Outbound Dispatch Controls
- **Continuous Integration (CI) Trigger Hooks**: Automatically execute external webhooks when LibWatch identifies security vulnerability tags or breaking semantic updates.
- **Discord and Slack Notification Webhooks**: Dispatch formatted JSON summaries to communication channels when packages publish new semantic tags or exceed commit thresholds.

---

## 2. Advanced Security & Audits
- **Package Vulnerability Pulse**: Integrate free `npm audit` or Snyk APIs, marking dependency rows with critical security levels (Low, Medium, High, Critical) directly in the health overview table.
- **Licenses Evaluation Checks**: Continuously assess license types across registered packages, triggering warning beacons if high-risk licenses (e.g. GPL-3.0 with copyleft implications) enter tracked systems.

---

## 3. GitHub Multi-Branch & Pull Request Scope
- **Alternative Branches Monitoring**: Expand the scope from standard default branches to arbitrary historical branches or release streams (e.g., `beta`, `rc-2`).
- **Open PR Velocities Monitor**: View lists of incoming pull requests directly within rows, showing historical merged pacing and contributor collaboration trends.

---

## 4. Account Integrations & Collaborative Workspace
- **Firebase Firestore Authentication**: Allow teams to log in, persisting customized panels, tracked lists, and shortcuts profiles in dynamic cloud DBs rather than local browser state.
- **Public Shared Dashboards**: Generate safe sharing tokens, allowing developers to publish view-only status readouts for stakeholders or open-source community members.
- **Import package.json directly**: Provide file drag-and-drop support, allowing engineers to import their local `package.json` file to auto-populate LibWatch's dashboard instantly.
