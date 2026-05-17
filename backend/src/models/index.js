const mongoose = require('mongoose');

// ─── Cycle Model ───────────────────────────────────────────────────────────────
const cycleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['planning', 'active', 'closed'], default: 'active' },
  submissionDeadline: { type: Date },
  quarters: [{
    name: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'] },
    startDate: Date,
    endDate: Date,
    checkInDeadline: Date,
    isActive: { type: Boolean, default: false }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ─── SharedGoal Model ──────────────────────────────────────────────────────────
const sharedGoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  department: { type: String, required: true },
  thrustArea: { type: String, required: true },
  uomType: { type: String, enum: ['max', 'min', 'zero', 'timeline'], required: true },
  target: { type: Number, required: true },
  deadline: { type: Date, required: true },
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ─── AuditLog Model ───────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

// ─── Notification Model ───────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error', 'reminder'], default: 'info' },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  relatedGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null }
}, { timestamps: true });

// ─── Department Model ─────────────────────────────────────────────────────────
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  description: { type: String, default: '' },
  headCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  Cycle: mongoose.model('Cycle', cycleSchema),
  SharedGoal: mongoose.model('SharedGoal', sharedGoalSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Department: mongoose.model('Department', departmentSchema)
};
