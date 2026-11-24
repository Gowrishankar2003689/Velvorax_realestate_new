// Review-only examples for mongosh. These commands do not run automatically.
// Replace the example IDs with real ObjectIds in a non-production test database.

const companyId = ObjectId("64b000000000000000000001");
const projectId = ObjectId("64b000000000000000000002");
const leadId = ObjectId("64b000000000000000000003");
const propertyId = ObjectId("64b000000000000000000004");

// Example project document. All tenant-owned records include companyId.
db.re_projects.insertOne({
  companyId,
  name: "Aurelia Heights",
  developerName: "Northstar Developers",
  location: { city: "Hyderabad", locality: "Gachibowli" },
  projectType: "residential",
  reraNumber: "P02400007182",
  totalUnits: 240,
  availableUnits: 64,
  soldUnits: 148,
  blocks: [{ name: "Tower 1", floors: 18 }, { name: "Tower 2", floors: 18 }],
  amenities: ["Clubhouse", "Pool", "Gym"],
  possessionDate: ISODate("2028-12-31T00:00:00Z"),
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Example unit document.
db.re_properties.insertOne({
  companyId,
  projectId,
  unitNumber: "AH-T2-1104",
  block: "Tower 2",
  floor: 11,
  propertyType: "apartment",
  bhk: 3,
  areaSqFt: 1685,
  facing: "east",
  basePriceMinor: 1180000000,
  currentPriceMinor: 1240000000,
  currency: "INR",
  parking: 1,
  status: "available",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Example real-estate lead with activity evidence for explainable scoring.
db.re_leads.insertOne({
  companyId,
  name: "Aarav Mehta",
  source: "google_ads",
  campaign: "hyderabad_2bhk_q4",
  propertyInterest: [{ projectId, bhk: 2, location: "Gachibowli" }],
  budgetMinMinor: 750000000,
  budgetMaxMinor: 900000000,
  buyingTimeline: "0_3_months",
  assignedTo: ObjectId("64b000000000000000000005"),
  score: { value: 70, temperature: "hot", ruleSetVersion: "v1" },
  signals: { budgetProvided: true, propertySelected: true, callCount: 2, responseCount: 1, siteVisitCompleted: true, followUpCompleted: true, negotiationStarted: false, bookingInterest: false },
  pipelineStage: "site_visit",
  nextFollowUpAt: ISODate("2026-11-11T10:00:00Z"),
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create the proposed indexes after validating existing data for duplicates.
db.re_properties.createIndex({ companyId: 1, projectId: 1, unitNumber: 1 }, { unique: true });
db.re_properties.createIndex({ companyId: 1, status: 1, projectId: 1 });
db.re_projects.createIndex({ companyId: 1, status: 1, name: 1 });
db.re_leads.createIndex({ companyId: 1, assignedTo: 1, nextFollowUpAt: 1 });
db.re_leads.createIndex({ companyId: 1, source: 1, createdAt: -1 });
db.re_site_visits.createIndex({ companyId: 1, scheduledAt: 1, status: 1 });
db.re_paymentSchedules.createIndex({ companyId: 1, bookingId: 1, dueAt: 1, status: 1 });
db.re_commissions.createIndex({ companyId: 1, partnerId: 1, status: 1 });

// Available inventory for a project. Always include the active company scope.
db.re_properties.find(
  { companyId, projectId, status: "available" },
  { unitNumber: 1, block: 1, floor: 1, bhk: 1, areaSqFt: 1, currentPriceMinor: 1, facing: 1 }
).sort({ currentPriceMinor: 1 }).limit(50);

// Assigned follow-ups due before a given time; use a verified user ID.
db.re_leads.find(
  { companyId, assignedTo: ObjectId("64b000000000000000000005"), nextFollowUpAt: { $lte: new Date() } },
  { name: 1, source: 1, pipelineStage: 1, nextFollowUpAt: 1, score: 1 }
).sort({ nextFollowUpAt: 1 }).limit(50);

// Dashboard inventory counts, scoped before aggregation.
db.re_properties.aggregate([
  { $match: { companyId } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);

// Marketing funnel counts. Real implementations should define attribution rules,
// deduplicate records, and add date bounds before running large reports.
db.re_leads.aggregate([
  { $match: { companyId, createdAt: { $gte: ISODate("2026-11-01T00:00:00Z"), $lt: ISODate("2026-12-01T00:00:00Z") } } },
  { $group: { _id: "$source", leadCount: { $sum: 1 } } },
  { $sort: { leadCount: -1 } }
]);

// Tenant-scoped update example. A status transition also needs server-side
// permission checks, allowed-transition validation, and an activity record.
db.re_properties.updateOne(
  { _id: propertyId, companyId, status: "available" },
  { $set: { status: "hold", updatedAt: new Date() } }
);

// Cross-company-safe lookup for a referenced project. Do not query only by _id.
db.re_projects.findOne({ _id: projectId, companyId }, { name: 1, status: 1 });

// Reminder: never expose arbitrary database filters to clients, and do not use
// the sample ObjectIds above in production.
