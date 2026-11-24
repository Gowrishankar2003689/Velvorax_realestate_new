# Velvorax Real Estate Module — Review Draft

## Current delivery

The interface in `index.html` uses the MySQL CRUD endpoints under `/api/realestate/mysql`. The MySQL schema contains the 15 resource tables used by those endpoints plus `re_companies`, which supplies the workspace/tenant ID. The setup script recreates the schema and loads demo records.

The CRM dashboard keeps its own sidebar and header while loading Real Estate views into `#moduleContent`; the selected view is reflected in the URL hash.

Resource pages use Fetch for database-backed GET, POST, PATCH, and DELETE operations. New/edit forms apply browser validation and the MySQL routes validate required fields, enums, numeric/date values, JSON fields, and company-scoped references. Successful saves close the form and reload the current list; a failed reload is reported separately from the save result. Monetary `*_minor` values are stored in paise and shown in rupees.

The schema intentionally does not create separate tables for project blocks, project amenities, lead property interests, lead signals, or document ACLs because the current MySQL API has no routes for them. The backend also exposes a separate MongoDB/Mongoose API under `/api/realestate/v1`; it is not the persistence path used by this MySQL UI.

Document records currently store metadata and a storage reference; file storage, reminders, and external integrations are not end-to-end features. Sample dashboard totals come from the MySQL records.

## Module boundary

```text
Velvorax CRM Core
  ├─ existing identity, company, subscription, and user services
  └─ Industry module registry / entitlement checks (proposed core boundary)
       └─ Real Estate module
            ├─ projects and inventory
            ├─ real-estate leads and contacts
            ├─ visits, follow-ups, tasks, pipeline and activity
            ├─ bookings, payment schedules and receipts
            ├─ partners and commissions
            ├─ documents and reports
            └─ integrations / automation (provider adapters)
```

Keep real-estate-specific models, services, routes, and validators inside `backend/modules/realestate/` when implementation begins. Reuse Core identity and company membership; do not make a second user or company system. The module must not change the behavior of the existing CRM modules.

## Proposed MongoDB entities

Every tenant-owned document has a required `companyId` referencing the existing `Company` model. Set it from the authenticated server-side principal, never from an untrusted request body. Use `timestamps: true`, schema validation, and company-scoped indexes.

| Collection | Main fields / relationships |
|---|---|
| `re_projects` | `companyId`, `name`, `developerName`, `location`, `projectType`, `reraNumber`, unit counts, `blocks[]`, `amenities[]`, `possessionDate`, `status` |
| `re_properties` | `companyId`, `projectId`, `unitNumber`, `block`, `floor`, `propertyType`, `bhk`, `area`, `facing`, `floorPlanDocumentId`, `basePrice`, `currentPrice`, `parking`, `status` |
| `re_leads` | `companyId`, Core `contactId` (optional), `source`, `campaign`, `propertyInterest[]`, location/budget/BHK/timeline, `assignedTo`, `score`, `temperature`, last/next contact, visit/negotiation states, `bookingProbability` |
| `re_contacts` | `companyId`, name, contact details, contact type, consent/preferences; keep personal details access-controlled |
| `re_site_visits` | `companyId`, `leadId`, `contactId`, `projectId`, `propertyId`, `assignedTo`, `scheduledAt`, reminder, status, feedback, next follow-up |
| `re_activities` | `companyId`, subject type/id, actor, activity type, timestamp, metadata; append-only history for calls, responses, stage changes and follow-ups |
| `re_opportunities` | `companyId`, `leadId`, `projectId`, `propertyId`, stage, owner, estimated value, probability, stage dates; stage transitions recorded in `re_activities` |
| `re_bookings` | `companyId`, `leadId`, `contactId`, `projectId`, `propertyId`, amount, booking date, owner, partner, agreement/payment/registration/possession states |
| `re_paymentSchedules` | `companyId`, `bookingId`, installment name, due date, amount, paid amount, status |
| `re_paymentTransactions` | `companyId`, `bookingId`, schedule item, amount, paidAt, receipt document, external reference, status; do not treat a schedule row as a payment receipt |
| `re_partners` | `companyId`, profile, contact details, status, commission policy reference |
| `re_commissions` | `companyId`, `partnerId`, `bookingId`, amount, status, earnedAt, paidAt |
| `re_documents` | `companyId`, subject type/id, category, storage key, MIME type, size, uploader, ACL; store file bytes in private object storage, not public paths |
| `re_automationRules` | `companyId`, enabled, trigger, conditions, actions, version; actions invoke configured provider adapters |
| `re_integrations` | `companyId`, provider key, encrypted credentials reference, enabled state, allowed capabilities; never return secrets to the browser |

Use explicit status enums in each schema. Validate monetary values as non-negative integers in the smallest currency unit (for INR, paise), and dates as UTC instants. Use transactions where booking/property status and payment/commission records must change atomically.

### Index recommendations

- Unique `{ companyId: 1, projectId: 1, unitNumber: 1 }` for units.
- `{ companyId: 1, status: 1, projectId: 1 }` for inventory browsing.
- `{ companyId: 1, assignedTo: 1, nextFollowUpAt: 1 }` for assigned follow-ups.
- `{ companyId: 1, source: 1, createdAt: -1 }` for campaign/source analytics.
- `{ companyId: 1, scheduledAt: 1, status: 1 }` for visits.
- `{ companyId: 1, bookingId: 1, dueAt: 1, status: 1 }` for payment schedules.
- `{ companyId: 1, partnerId: 1, status: 1 }` for commissions.

Create indexes with migrations after checking existing data and duplicate values; do not silently discard or overwrite records.

## Proposed API boundary

All endpoints are under `/api/realestate/v1`. Each request requires Core authentication, active company membership, the `realestate` module entitlement, and a server-side permission check. List endpoints are paginated and apply a mandatory company filter before search or aggregation.

| Resource | Endpoints (illustrative) |
|---|---|
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/funnel`, `GET /dashboard/actions` |
| Projects | `GET/POST /projects`, `GET/PATCH /projects/:id` |
| Properties | `GET/POST /properties`, `GET/PATCH /properties/:id`, `GET /properties/matches` |
| Leads / Contacts | `GET/POST /leads`, `GET/PATCH /leads/:id`, `POST /leads/:id/activities`, `GET/POST /contacts` |
| Visits / Pipeline | `GET/POST /site-visits`, `PATCH /site-visits/:id`, `GET /opportunities`, `PATCH /opportunities/:id/stage` |
| Bookings / Payments | `GET/POST /bookings`, `GET/POST /bookings/:id/payment-schedule`, `POST /bookings/:id/payments` |
| Partners | `GET/POST /partners`, `GET /partners/:id/performance`, `GET /commissions` |
| Documents | `POST /documents/upload-url`, `GET /documents/:id/download-url` (short-lived signed URLs after ACL check) |
| Reports | `GET /reports/marketing`, `GET /reports/sales-performance`, `GET /reports/collections` |
| Automation | `GET/POST /automation/rules`, `PATCH /automation/rules/:id`, `POST /integrations/:provider/webhooks` |

For any `:id` lookup, query by both `_id` and `companyId`; returning 404 for an out-of-tenant record avoids confirming its existence. Validate allowed fields and transitions on the server. Never rely on hidden navigation or client-side filtering as authorization.

## Permission matrix (proposed)

`*` means only records inside the active company and permitted record scope. This matrix is a design proposal; it is not enforced by the static demo.

| Capability | Business Admin / Director | Sales Manager | Sales Executive | Channel Partner | Standard User |
|---|---:|---:|---:|---:|---:|
| View company dashboard and reports | Full | Team | Own/assigned | Own permitted data | Explicit grants only |
| Manage projects and inventory | Full | View | View available | View permitted | Explicit grants only |
| Manage and assign leads | Full | Team | Assigned leads | Submit / own leads | Explicit grants only |
| Contacts and activities | Full | Team | Assigned records | Own submitted leads | Explicit grants only |
| Site visits and pipeline | Full | Team | Assigned records | Own lead status | Explicit grants only |
| Create bookings / record payments | Full | Team scope | Assigned deals, policy-gated | No by default | No by default |
| Partner and commission administration | Full | View team performance | No | Own profile and commissions | No by default |
| Documents / customer PII | ACL-controlled | Team scope | Assigned records | Own permitted records | Explicit ACL only |
| Company settings, users, billing, integrations | Full | No | No | No | No by default |

Map this module policy to Core user roles and membership. Existing role names alone do not provide this matrix; add explicit permission middleware before exposing protected endpoints.

## Tenant isolation and plan enforcement

1. Resolve the active company from the verified Core identity/membership on the server.
2. Apply `{ companyId: req.company._id }` to every read, update, delete, aggregate, export, and document lookup. For related IDs, verify each referenced record is in the same company.
3. Use compound company-scoped indexes. Do not query by an entity `_id` alone.
4. Check the `realestate` module entitlement and individual feature limits server-side on every relevant operation; frontend visibility is only presentation.
5. Scope uploaded document ACL checks and signed download URLs to the same company and authorized record.
6. Add automated cross-company tests for every service, route, aggregation, and file operation before release.

## Rule-based intent and matching

The demo score is deterministic, configurable and intentionally not described as AI. Proposed initial score weights are: budget provided 15, property selected 15, two or more calls 10, customer response 15, site visit 15, follow-up activity 10, negotiation 10, booking interest 10. Clamp to 0–100; Hot ≥70, Warm ≥40, otherwise Cold. Persist the rule-set version and signal evidence when implemented. An AI scorer can later implement the same scoring interface without fabricating activity.

Property matching should be a separately versioned scoring service. Filter by company, availability, type/BHK, location, and budget first; then compute a configurable weighted match from those real fields. Return match reasons as well as a percentage. Do not persist a match score as fact unless its rule version and input snapshot are recorded.

## Implementation sequence

1. Review and approve entities, API boundaries, permissions, company scoping, and entitlement rules.
2. Implement Phase 1 models, indexes/migrations, validators, permission middleware, services/routes, and tenant-isolation tests.
3. Add payments, partner performance and reporting in Phase 2.
4. Add provider-neutral automation, WhatsApp/calling adapters and alerts in Phase 3.
5. Add configurable scoring, property matching and forecasting in Phase 4.
6. Add customer and channel-partner portals in Phase 5.

The MongoDB entities, `/api/realestate/v1` API design, permission matrix, and implementation sequence above remain proposals. The current delivery uses the MySQL schema and Express CRUD API described at the top; file storage, reminder delivery, external integrations, and the proposed permission/entitlement system remain future work.
