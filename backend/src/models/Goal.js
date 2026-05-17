const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  quarter:         { type: String, enum: ['Q1','Q2','Q3','Q4'] },
  achievement:     { type: Number, default: 0 },
  status:          { type: String, enum: ['not_started','on_track','completed','delayed'], default: 'not_started' },
  notes:           { type: String, default: '' },
  managerFeedback: { type: String, default: '' },
  updatedAt:       { type: Date,   default: Date.now },
}, { _id: false });

const goalSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cycleId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
  sharedGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedGoal', default: null },
  thrustArea:   { type: String, required: true },
  title:        { type: String, required: true },
  description:  { type: String, default: '' },

  // BRD-aligned UoM types:
  // numeric_min = Higher is better  → Achievement ÷ Target  (Sales Revenue etc.)
  // numeric_max = Lower is better   → Target ÷ Achievement  (TAT, Cost etc.)
  // timeline    = Date-based
  // zero        = Zero = 100%
  uomType: {
    type: String,
    enum: ['numeric_min','numeric_max','timeline','zero','max','min'], // legacy kept
    required: true,
  },

  target:    { type: Number, required: true },
  weightage: { type: Number, required: true, min: 10 },
  deadline:  { type: Date,   required: true },

  status: {
    type: String,
    enum: ['draft','submitted','approved','rejected','rework'],
    default: 'draft',
  },
  isLocked:        { type: Boolean, default: false },
  isShared:        { type: Boolean, default: false },
  managerComment:  { type: String,  default: '' },
  rejectionReason: { type: String,  default: '' },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt:      { type: Date, default: null },
  lockDate:        { type: Date, default: null },

  checkIns:        [checkInSchema],
  finalAchievement:{ type: Number, default: 0 },
  progress:        { type: Number, default: 0 },
}, { timestamps: true });

// BRD-aligned progress calculation
goalSchema.methods.calculateProgress = function () {
  const legacyMap = { max: 'numeric_min', min: 'numeric_max' };
  const uomType = legacyMap[this.uomType] || this.uomType;
  const order = ['Q4','Q3','Q2','Q1'];
  const latest = order.map(q => this.checkIns.find(c => c.quarter === q)).find(Boolean);
  if (!latest && uomType !== 'timeline') return 0;

  const achievement = latest?.achievement ?? 0;
  const target = this.target || 1;
  let progress = 0;

  switch (uomType) {
    case 'numeric_min': progress = Math.min((achievement / target) * 100, 100); break;
    case 'numeric_max': progress = achievement === 0 ? 0 : Math.min((target / achievement) * 100, 100); break;
    case 'zero':        progress = achievement === 0 ? 100 : 0; break;
    case 'timeline': {
      const now = Date.now();
      const start = new Date(this.createdAt).getTime();
      const end   = new Date(this.deadline).getTime();
      if (end <= start) { progress = 100; break; }
      progress = Math.min(((now - start) / (end - start)) * 100, 100);
      break;
    }
    default: progress = 0;
  }
  return Math.round(Math.max(0, progress));
};

module.exports = mongoose.model('Goal', goalSchema);
