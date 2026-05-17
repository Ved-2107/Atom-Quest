require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Goal     = require('../models/Goal');
const { Cycle, SharedGoal, AuditLog, Notification, Department } = require('../models/index');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracker';

async function seed() {
  await mongoose.connect(URI);
  console.log('✅ MongoDB connected');

  await Promise.all([User,Goal,Cycle,SharedGoal,AuditLog,Notification,Department].map(M => M.deleteMany({})));
  console.log('🗑️  Cleared');

  const hp = await bcrypt.hash('password123', 12);

  // Users
  const admin = await User.create({ name:'Alex Morgan',   email:'admin@demo.com',    password:hp, role:'admin',    department:'HR',          designation:'HR Director',          employeeId:'EMP001' });
  const mgr1  = await User.create({ name:'Priya Sharma',  email:'manager@demo.com',  password:hp, role:'manager',  department:'Engineering',  designation:'Engineering Manager',  employeeId:'EMP002', managerId:admin._id });
  const mgr2  = await User.create({ name:'David Chen',    email:'manager2@demo.com', password:hp, role:'manager',  department:'Sales',        designation:'Sales Manager',        employeeId:'EMP003', managerId:admin._id });
  const emp   = await User.create({ name:'Rahul Verma',   email:'employee@demo.com', password:hp, role:'employee', department:'Engineering',  designation:'Senior Developer',     employeeId:'EMP004', managerId:mgr1._id });
  const extras = await User.insertMany([
    { name:'Anjali Singh', email:'anjali@demo.com', password:hp, role:'employee', department:'Engineering', designation:'Frontend Developer', managerId:mgr1._id, employeeId:'EMP005' },
    { name:'Rohit Kumar',  email:'rohit@demo.com',  password:hp, role:'employee', department:'Engineering', designation:'Backend Developer',  managerId:mgr1._id, employeeId:'EMP006' },
    { name:'Neha Gupta',   email:'neha@demo.com',   password:hp, role:'employee', department:'Sales',       designation:'Sales Executive',    managerId:mgr2._id, employeeId:'EMP007' },
    { name:'Vikram Patel', email:'vikram@demo.com', password:hp, role:'employee', department:'Sales',       designation:'Account Manager',   managerId:mgr2._id, employeeId:'EMP008' },
    { name:'Meera Joshi',  email:'meera@demo.com',  password:hp, role:'employee', department:'Marketing',   designation:'Marketing Analyst', managerId:admin._id, employeeId:'EMP009' },
  ]);
  console.log('👥 Users created');

  // Departments
  await Department.insertMany([
    { name:'Engineering', code:'ENG', managerId:mgr1._id },
    { name:'Sales',       code:'SAL', managerId:mgr2._id },
    { name:'Marketing',   code:'MKT' },
    { name:'HR',          code:'HR0', managerId:admin._id },
    { name:'Finance',     code:'FIN' },
  ]);

  // Cycle (BRD-aligned: opens May 1)
  const cycle = await Cycle.create({
    name:'FY 2025-26', year:2025,
    startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'),
    status:'active',
    submissionDeadline: new Date('2025-05-31'),
    quarters:[
      { name:'Q1', startDate:new Date('2025-04-01'), endDate:new Date('2025-06-30'), checkInDeadline:new Date('2025-07-31'), isActive:false },
      { name:'Q2', startDate:new Date('2025-07-01'), endDate:new Date('2025-09-30'), checkInDeadline:new Date('2025-10-31'), isActive:true },
      { name:'Q3', startDate:new Date('2025-10-01'), endDate:new Date('2025-12-31'), checkInDeadline:new Date('2026-01-31'), isActive:false },
      { name:'Q4', startDate:new Date('2026-01-01'), endDate:new Date('2026-03-31'), checkInDeadline:new Date('2026-04-30'), isActive:false },
    ],
    createdBy: admin._id,
  });
  console.log('📅 Cycle created');

  // Shared goal (BRD: admin/mgr pushes to multiple employees)
  await SharedGoal.create({
    title:'Achieve 99.9% System Uptime', description:'All production systems must maintain 99.9% uptime',
    department:'Engineering', thrustArea:'Operational Excellence',
    uomType:'numeric_min', target:99.9, deadline:new Date('2026-03-31'),
    cycleId:cycle._id, createdBy:mgr1._id,
    assignedTo:[emp._id, extras[0]._id, extras[1]._id],
  });

  // Main employee goals — using BRD-correct uomType values
  const empGoals = [
    { thrustArea:'Business Growth',        title:'Deliver 5 Major Product Features', uomType:'numeric_min', target:5,    weightage:25, status:'approved', isLocked:true,  progress:60, deadline:'2025-09-30',
      checkIns:[
        { quarter:'Q1', achievement:2, status:'on_track',  notes:'Auth & dashboard done', updatedAt:new Date() },
        { quarter:'Q2', achievement:3, status:'on_track',  notes:'API integration complete', updatedAt:new Date() },
      ]},
    { thrustArea:'Operational Excellence', title:'Reduce Bug Backlog by 40%',        uomType:'numeric_max', target:50,   weightage:20, status:'approved', isLocked:true,  progress:45, deadline:'2026-03-31',
      checkIns:[
        { quarter:'Q1', achievement:90, status:'on_track', notes:'Closed 30 critical bugs', updatedAt:new Date() },
        { quarter:'Q2', achievement:70, status:'on_track', notes:'Continued P1/P2 focus',  updatedAt:new Date() },
      ]},
    { thrustArea:'People Development',     title:'Complete AWS Certification',        uomType:'zero',        target:0,    weightage:15, status:'approved', isLocked:true,  progress:0,  deadline:'2025-12-31',
      checkIns:[{ quarter:'Q1', achievement:1, status:'not_started', notes:'Enrolled in course', updatedAt:new Date() }]},
    { thrustArea:'Digital Transformation', title:'Migrate 8 Services to Microservices',uomType:'numeric_min',target:8,   weightage:20, status:'approved', isLocked:true,  progress:37, deadline:'2026-03-31',
      checkIns:[
        { quarter:'Q1', achievement:2, status:'on_track', notes:'Auth & notification done', updatedAt:new Date() },
        { quarter:'Q2', achievement:3, status:'on_track', notes:'User service in progress', updatedAt:new Date() },
      ]},
    { thrustArea:'Customer Experience',    title:'API Response Time <200ms',          uomType:'numeric_max', target:200,  weightage:10, status:'submitted', isLocked:false, progress:0,  deadline:'2025-12-31', checkIns:[] },
    { thrustArea:'Innovation',             title:'AI-Powered Code Review System',     uomType:'timeline',    target:100,  weightage:10, status:'draft',     isLocked:false, progress:0,  deadline:'2026-03-31', checkIns:[] },
  ];

  for (const g of empGoals) {
    await Goal.create({ ...g, userId:emp._id, cycleId:cycle._id, deadline:new Date(g.deadline),
      approvedBy: g.status==='approved'?mgr1._id:null, approvedAt: g.status==='approved'?new Date():null });
  }

  // Extra employee goals
  const templates = [
    { thrustArea:'Business Growth',    title:'Increase Revenue by 30%',         uomType:'numeric_min', target:130, weightage:30, status:'approved', progress:55 },
    { thrustArea:'Customer Experience',title:'Achieve NPS > 70',                uomType:'numeric_min', target:70,  weightage:25, status:'approved', progress:70 },
    { thrustArea:'Operational Excellence',title:'Reduce Deployment Time (mins)',uomType:'numeric_max', target:15,  weightage:20, status:'submitted',progress:30 },
    { thrustArea:'People Development', title:'Complete Leadership Training',     uomType:'zero',        target:0,   weightage:15, status:'approved', progress:100 },
    { thrustArea:'Risk & Compliance',  title:'Zero Security Incidents',          uomType:'zero',        target:0,   weightage:10, status:'approved', progress:100 },
  ];

  for (const u of [...extras, mgr2]) {
    const mgr = u.department==='Engineering' ? mgr1 : mgr2;
    let used = 0;
    for (let i = 0; i < Math.min(3, templates.length); i++) {
      const t = templates[i];
      if (used + t.weightage > 100) continue;
      used += t.weightage;
      await Goal.create({
        ...t, userId:u._id, cycleId:cycle._id, description:`${t.title} — ${u.department}`,
        deadline:new Date('2026-03-31'), isLocked:t.status==='approved',
        approvedBy: t.status==='approved'?mgr._id:null, approvedAt: t.status==='approved'?new Date():null,
        checkIns: t.status==='approved' ? [
          { quarter:'Q1', achievement:Math.floor(t.target*0.3), status:'on_track', notes:'Q1 update', updatedAt:new Date() },
          { quarter:'Q2', achievement:Math.floor(t.target*(t.progress/100)), status:'on_track', notes:'Q2 update', updatedAt:new Date() },
        ] : [],
      });
    }
  }
  console.log('🎯 Goals created');

  // Audit logs
  const actions = [
    { action:'LOGIN',  entity:'User',     description:'User logged in' },
    { action:'CREATE', entity:'Goal',     description:'Goal created: Deliver 5 Major Product Features' },
    { action:'SUBMIT', entity:'GoalSheet',description:'Goal sheet submitted for approval' },
    { action:'APPROVE',entity:'Goal',     description:'Goal approved and locked by Manager' },
    { action:'CHECKIN',entity:'Goal',     description:'Q1 check-in updated — achievement: 3/5' },
    { action:'CHECKIN',entity:'Goal',     description:'Q2 check-in updated — achievement: 5/5' },
    { action:'UPDATE', entity:'Goal',     description:'Goal weightage revised from 20% to 25%' },
    { action:'REJECT', entity:'Goal',     description:'Goal returned for rework — insufficient detail' },
    { action:'UNLOCK', entity:'Goal',     description:'Goal unlocked by Admin for revision' },
  ];
  const allU = [admin, mgr1, mgr2, emp, ...extras];
  for (let i = 0; i < 40; i++) {
    const a = actions[i % actions.length];
    const u = allU[i % allU.length];
    await AuditLog.create({ userId:u._id, ...a, entityId:emp._id,
      oldValue: i%2===0?{ status:'draft' }:null, newValue: i%2===0?{ status:'approved' }:null,
      createdAt: new Date(Date.now() - i*3600000*8) });
  }
  console.log('📋 Audit logs created');

  // Notifications
  await Notification.insertMany([
    { userId:emp._id,   title:'Goal Approved ✅',           message:'Your goal "Deliver 5 Major Product Features" has been approved and locked.', type:'success',  isRead:false },
    { userId:emp._id,   title:'Q2 Check-in Due 📋',         message:'Please update your Q2 check-in by October 31, 2025.',                        type:'reminder', isRead:false },
    { userId:emp._id,   title:'Goal Returned for Rework ↩️', message:'"API Response Time <200ms" needs revision. Check manager comments.',        type:'warning',  isRead:true  },
    { userId:mgr1._id,  title:'3 Goals Pending Approval ⏳', message:'Rahul, Anjali, and Rohit have submitted goals awaiting your review.',        type:'info',     isRead:false },
    { userId:mgr1._id,  title:'Team Alert ⚠️',              message:'Rohit Kumar has not submitted a Q2 check-in. Deadline: Oct 31.',             type:'warning',  isRead:false },
    { userId:admin._id, title:'Submission Deadline ⏰',      message:'FY 2025-26 goal submission deadline: May 31, 2025.',                         type:'reminder', isRead:false },
    { userId:admin._id, title:'Escalation Alert 🚨',        message:'3 employees have not submitted goals 15+ days after cycle open.',            type:'error',    isRead:false },
  ]);
  console.log('🔔 Notifications created');

  console.log('\n✅ Seed complete!');
  console.log('──────────────────────────────────────');
  console.log('  👤 Admin:    admin@demo.com    / password123');
  console.log('  👔 Manager:  manager@demo.com  / password123');
  console.log('  🧑 Employee: employee@demo.com / password123');
  console.log('──────────────────────────────────────\n');
  process.exit(0);
}

seed().catch(e => { console.error('❌', e); process.exit(1); });
