const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/middleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

const authCtrl = require('../controllers/authController');
const userCtrl = require('../controllers/userController');
const taskCtrl = require('../controllers/taskController');
const attCtrl = require('../controllers/attendanceController');
const leaveCtrl = require('../controllers/leaveController');
const payrollCtrl = require('../controllers/payrollController');
const annCtrl = require('../controllers/announcementController');
const adCtrl = require('../controllers/advertisementController');
const rateCtrl = require('../controllers/rateController');
const workforceCtrl = require('../controllers/workforceController');
const departmentCtrl = require('../controllers/departmentController');

// Auth
router.post('/auth/super-admin', uploadAvatar, authCtrl.createSuperAdmin);
router.post('/auth/login', authCtrl.login);
router.post('/auth/send-otp', authCtrl.sendOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);

// Users
router.post('/users/employees', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), uploadAvatar, userCtrl.createEmployee);
router.get('/users', authenticate, userCtrl.getUsers);
router.get('/users/:id', authenticate, userCtrl.getUserById);
router.put('/users/:id', authenticate, userCtrl.updateUser);
router.delete('/users/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), userCtrl.deactivateUser);

// Tasks
router.post('/tasks', authenticate, taskCtrl.createTask);
router.get('/tasks', authenticate, taskCtrl.getTasks);
router.get('/tasks/:id', authenticate, taskCtrl.getTaskById);
router.put('/tasks/:id', authenticate, taskCtrl.updateTask);
router.delete('/tasks/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), taskCtrl.deleteTask);

// Attendance
router.post('/attendance/clock-in', authenticate, attCtrl.clockIn);
router.post('/attendance/clock-out', authenticate, attCtrl.clockOut);
router.post('/attendance/break/start', authenticate, attCtrl.startBreak);
router.post('/attendance/break/end', authenticate, attCtrl.endBreak);
router.get('/attendance', authenticate, attCtrl.getAttendance);

// Leaves
router.post('/leaves', authenticate, leaveCtrl.createLeave);
router.get('/leaves', authenticate, leaveCtrl.getLeaves);
router.get('/leaves/:id', authenticate, leaveCtrl.getLeaveById);
router.put('/leaves/:id', authenticate, leaveCtrl.updateLeave);

// Payroll
router.post('/payroll', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), payrollCtrl.createPayroll);
router.get('/payroll', authenticate, payrollCtrl.getPayroll);
router.get('/payroll/:id', authenticate, payrollCtrl.getPayrollById);
router.put('/payroll/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), payrollCtrl.updatePayroll);
router.delete('/payroll/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), payrollCtrl.deletePayroll);

// Announcements
router.post('/announcements', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), annCtrl.createAnnouncement);
router.get('/announcements', authenticate, annCtrl.getAnnouncements);
router.get('/announcements/:id', authenticate, annCtrl.getAnnouncementById);
router.put('/announcements/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), annCtrl.updateAnnouncement);
router.delete('/announcements/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), annCtrl.deleteAnnouncement);

// Advertisements
router.post('/advertisements', authenticate, authorize('SUPER_ADMIN'), adCtrl.createAd);
router.get('/advertisements', authenticate, adCtrl.getAds);
router.get('/advertisements/:id', authenticate, adCtrl.getAdById);
router.put('/advertisements/:id', authenticate, authorize('SUPER_ADMIN'), adCtrl.updateAd);
router.delete('/advertisements/:id', authenticate, authorize('SUPER_ADMIN'), adCtrl.deleteAd);

// Workforce Directory
router.get('/workforce', authenticate, authorize('SUPER_ADMIN'), workforceCtrl.getWorkforce);
router.get('/workforce/:id', authenticate, authorize('SUPER_ADMIN'), workforceCtrl.getWorkforceUser);
router.post('/workforce', authenticate, authorize('SUPER_ADMIN'), uploadAvatar, workforceCtrl.createWorkforceUser);
router.put('/workforce/:id', authenticate, authorize('SUPER_ADMIN'), uploadAvatar, workforceCtrl.updateWorkforceUser);
router.patch('/workforce/:id/status', authenticate, authorize('SUPER_ADMIN'), workforceCtrl.updateWorkforceStatus);
router.delete('/workforce/:id', authenticate, authorize('SUPER_ADMIN'), workforceCtrl.deleteWorkforceUser);

// Departments
router.get('/departments', authenticate, departmentCtrl.getDepartments);
router.post('/departments', authenticate, authorize('SUPER_ADMIN'), departmentCtrl.createDepartment);
router.put('/departments/:id', authenticate, authorize('SUPER_ADMIN'), departmentCtrl.updateDepartment);
router.patch('/departments/:id/status', authenticate, authorize('SUPER_ADMIN'), departmentCtrl.updateDepartmentStatus);
router.delete('/departments/:id', authenticate, authorize('SUPER_ADMIN'), departmentCtrl.deleteDepartment);

// Rates
router.get('/rates', authenticate, rateCtrl.getRates);
router.put('/rates', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), rateCtrl.updateRates);

module.exports = router;
