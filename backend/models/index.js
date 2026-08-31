const Company = require('./Company');
const Deal = require('./Deal');
const Lead = require('./Lead');
const Task = require('./Task');
const Ticket = require('./Ticket');
const Account = require('./Account');
const Chat = require('./Chat');
const HotLead = require('./HotLead');
const Notification = require('./Notification');
const PromptUsage = require('./PromptUsage');
const DailyReport = require('./DailyReport');
const Pricing = require('./Pricing');
const Invoice = require('./Invoice');
const RecurringInvoice = require('./RecurringInvoice');
const Product = require('./Product');
const Opportunity = require('./Opportunity');

// Internal CRM users (admin/staff)
const User = require('./User');

// External users (clients/customers)
const StandardUser = require('./StandardUser');

module.exports = {
  Company,
  Deal,
  Lead,
  Task,
  Ticket,
  Account,
  Chat,
  HotLead,
  Notification,
  PromptUsage,
  DailyReport,
  Pricing,
  Invoice,
  RecurringInvoice,
  Product,
  Opportunity,
  User,
  StandardUser
};
