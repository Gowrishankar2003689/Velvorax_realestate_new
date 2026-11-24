const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const Company = require('./models/Company');
const {
  ReProject,
  ReProperty,
  ReLead,
  ReContact,
  ReSiteVisit,
  ReOpportunity,
  ReBooking,
  RePaymentSchedule,
  RePartner,
  ReActivity,
  RePaymentTransaction,
  ReCommission,
  ReDocument,
  ReAutomationRule,
  ReIntegration
} = require('./modules/realestate/models');

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://nithish020306_db_user:Nithish%40236@cluster0.duzlpo7.mongodb.net/velvorax?appName=Cluster0';

async function seed() {
  await mongoose.connect(mongoUri, { family: 4 });
  let company = await Company.findOne({ name: 'Velvorax Real Estate' });
  if (!company) {
    company = await Company.create({
      name: 'Velvorax Real Estate',
      industry: 'Real Estate',
      subscriptionPlan: 'pro',
      usersLimit: 50,
      approvalStatus: 'Approved'
    });
  }

  const companyId = company._id;
  await Promise.all([
    ReProject.deleteMany({ companyId }),
    ReProperty.deleteMany({ companyId }),
    ReContact.deleteMany({ companyId }),
    ReLead.deleteMany({ companyId }),
    ReSiteVisit.deleteMany({ companyId }),
    ReOpportunity.deleteMany({ companyId }),
    ReBooking.deleteMany({ companyId }),
    RePaymentSchedule.deleteMany({ companyId }),
    RePartner.deleteMany({ companyId }),
    ReActivity.deleteMany({ companyId }),
    RePaymentTransaction.deleteMany({ companyId }),
    ReCommission.deleteMany({ companyId }),
    ReDocument.deleteMany({ companyId }),
    ReAutomationRule.deleteMany({ companyId }),
    ReIntegration.deleteMany({ companyId })
  ]);

  const [projectA, projectB] = await ReProject.create([
    {
      companyId, name: 'Aurelia Heights', developerName: 'Northstar Developers',
      location: { city: 'Hyderabad', locality: 'Gachibowli' },
      projectType: 'residential', reraNumber: 'P02400007182',
      totalUnits: 240, availableUnits: 64, soldUnits: 148,
      blocks: [{ name: 'Tower 1', floors: 18 }, { name: 'Tower 2', floors: 18 }],
      amenities: ['Clubhouse', 'Pool', 'Gym'], possessionDate: new Date('2028-12-31'),
      status: 'active'
    },
    {
      companyId, name: 'Palm Grove Villas', developerName: 'Greenway Estates',
      location: { city: 'Hyderabad', locality: 'Tellapur' },
      projectType: 'villa', reraNumber: 'P02400004976',
      totalUnits: 48, availableUnits: 11, soldUnits: 33,
      amenities: ['Clubhouse', 'Garden'], possessionDate: new Date('2027-06-30'),
      status: 'active'
    }
  ]);

  const [propertyA, propertyB] = await ReProperty.create([
    {
      companyId, projectId: projectA._id, unitNumber: 'AH-T2-1104',
      block: 'Tower 2', floor: 11, propertyType: 'apartment', bhk: 3,
      areaSqFt: 1685, facing: 'east', basePriceMinor: 1180000000,
      currentPriceMinor: 1240000000, currency: 'INR', parking: 1, status: 'available'
    },
    {
      companyId, projectId: projectB._id, unitNumber: 'VG-V-014',
      block: 'Villa 14', floor: 2, propertyType: 'villa', bhk: 4,
      areaSqFt: 2850, facing: 'north_east', basePriceMinor: 2500000000,
      currentPriceMinor: 2650000000, currency: 'INR', parking: 2, status: 'available'
    }
  ]);

  const [partner] = await RePartner.create([
    { companyId, name: 'BlueKey Realty', contactName: 'Sales Team', phone: '+91-0000000000', email: 'sales@bluekey.example', status: 'active' }
  ]);

  const [contact] = await ReContact.create([
    { companyId, name: 'Aarav Mehta', contactType: 'buyer', phone: '+91-0000000001', email: 'aarav@example.test', status: 'active' }
  ]);

  const [lead] = await ReLead.create([
    {
      companyId, contactId: contact._id, name: 'Aarav Mehta',
      phone: '+91-0000000001', email: 'aarav@example.test', source: 'google_ads',
      campaign: 'hyderabad_2bhk_q4',
      propertyInterest: [{ projectId: projectA._id, bhk: 3, location: 'Gachibowli' }],
      budgetMinMinor: 750000000, budgetMaxMinor: 900000000,
      buyingTimeline: '0_3_months',
      score: { value: 70, temperature: 'hot', ruleSetVersion: 'v1' },
      signals: { budgetProvided: true, propertySelected: true, callCount: 2, responseCount: 1, siteVisitCompleted: false, followUpCompleted: true },
      pipelineStage: 'site_visit', bookingProbability: 54,
      nextFollowUpAt: new Date('2026-11-24T10:00:00Z')
    }
  ]);

  await ReSiteVisit.create({
    companyId, leadId: lead._id, contactId: contact._id,
    projectId: projectA._id, propertyId: propertyA._id,
    scheduledAt: new Date('2026-11-24T10:00:00Z'), status: 'scheduled'
  });

  await ReOpportunity.create({
    companyId, leadId: lead._id, projectId: projectA._id, propertyId: propertyA._id,
    stage: 'site_visit', estimatedValueMinor: 1240000000, probability: 54
  });

  const [booking] = await ReBooking.create([
    {
      companyId, bookingNumber: 'RE-2026-0001', leadId: lead._id, contactId: contact._id,
      projectId: projectA._id, propertyId: propertyA._id,
      bookingAmountMinor: 50000000, bookingDate: new Date('2026-11-23'),
      partnerId: partner._id, agreementStatus: 'in_review', status: 'booked'
    }
  ]);

  await RePaymentSchedule.create({
    companyId, bookingId: booking._id, installmentName: 'Booking Amount',
    dueAt: new Date('2026-11-23'), amountMinor: 50000000,
    paidAmountMinor: 50000000, status: 'paid'
  });

  await ReActivity.create([
    {
      companyId, subjectType: 'lead', subjectId: lead._id,
      activityType: 'call', title: 'Qualification call',
      description: 'Customer confirmed a 3 BHK requirement and Gachibowli location preference.',
      metadata: { durationMinutes: 12, outcome: 'interested' }
    },
    {
      companyId, subjectType: 'opportunity', subjectId: (await ReOpportunity.findOne({ companyId, leadId: lead._id }))._id,
      activityType: 'stage_change', title: 'Moved to site visit',
      description: 'Opportunity stage changed from qualified to site_visit.'
    }
  ]);

  await RePaymentTransaction.create({
    companyId, bookingId: booking._id, amountMinor: 50000000,
    paidAt: new Date('2026-11-23'), method: 'bank_transfer',
    externalReference: 'SEED-RECEIPT-0001', status: 'completed'
  });

  await ReCommission.create({
    companyId, partnerId: partner._id, bookingId: booking._id,
    amountMinor: 11600000, status: 'earned', earnedAt: new Date('2026-11-23')
  });

  await ReDocument.create({
    companyId, subjectType: 'project', subjectId: projectA._id,
    category: 'brochure', name: 'Aurelia Heights Brochure',
    storageKey: 'realestate/projects/aurelia-heights/brochure.pdf',
    mimeType: 'application/pdf', sizeBytes: 0
  });

  await ReAutomationRule.create({
    companyId, name: 'Hot lead follow-up',
    enabled: true, trigger: 'lead.score.changed',
    conditions: { minimumScore: 70 },
    actions: [{ type: 'create_follow_up', config: { priority: 'high', dueInHours: 24 } }]
  });

  await ReIntegration.create({
    companyId, providerKey: 'whatsapp',
    enabled: false, credentialsReference: 'vault://realestate/whatsapp',
    allowedCapabilities: ['send_message', 'receive_webhook']
  });

  await mongoose.disconnect();
  console.log(`Real estate database seeded for company ${company.name} (${companyId})`);
  console.log('Collections: re_projects, re_properties, re_contacts, re_leads, re_site_visits, re_opportunities, re_bookings, re_paymentSchedules, re_paymentTransactions, re_partners, re_commissions, re_activities, re_documents, re_automationRules, re_integrations');
}

seed().catch(async (err) => {
  console.error('Real estate seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
