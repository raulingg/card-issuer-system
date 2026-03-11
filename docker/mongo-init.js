// MongoDB initialization script
// Runs on first container start to create service databases and users

db = db.getSiblingDB('user_service_db');
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });

db = db.getSiblingDB('notification_service_db');
db.createCollection('notifications');
db.notifications.createIndex({ recipientId: 1 });
db.notifications.createIndex({ status: 1 });

print('✅ MongoDB initialized: user_service_db, notification_service_db');
