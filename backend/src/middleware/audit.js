const { AuditLog } = require('../models/index');

const createAuditLog = async (userId, action, entity, entityId, oldValue, newValue, description) => {
  try {
    await AuditLog.create({ userId, action, entity, entityId, oldValue, newValue, description });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
