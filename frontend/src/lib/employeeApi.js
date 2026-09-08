import api from './axios';

export const getMyAttendance = (page = 0, size = 10) =>
  api.get(`/api/attendance/my?page=${page}&size=${size}`);

export const checkIn = (remarks = '') =>
  api.post('/api/attendance/check-in', { remarks });

export const checkOut = (remarks = '') =>
  api.post('/api/attendance/check-out', { remarks });

export const deleteMyAttendance = (id) =>
  api.delete(`/api/attendance/${id}`);

export const clearAllMyAttendance = () =>
  api.delete('/api/attendance/my/clear-all');

export const getMyLeaves = (page = 0, size = 10) =>
  api.get(`/api/leaves/my?page=${page}&size=${size}`);

export const getLeaveBalance = () =>
  api.get('/api/leaves/balance');

export const getMyPayslips = (page = 0, size = 10) =>
  api.get(`/api/payslips/my?page=${page}&size=${size}`);

// Downloads the payslip PDF as a blob (binary), not JSON.
export const downloadPayslipPdf = (payslipNumber) =>
  api.get(`/api/payslips/${payslipNumber}/download`, {
    responseType: 'blob',
  });
// ── Breaks ──
export const startBreak = (breakType = 'GENERAL') =>
  api.post('/api/attendance/break-start', { breakType });

export const endBreak = () =>
  api.post('/api/attendance/break-end', {});
export const getMyNotifications = (page = 0, size = 20) =>
  api.get(`/api/notifications?page=${page}&size=${size}`);

export const getUnreadCount = () =>
  api.get('/api/notifications/unread-count');

export const markNotificationRead = (id) =>
  api.put(`/api/notifications/${id}/read`);

export const getMyPerformance = () =>
  api.get('/api/performance/my');

export const getMyTrainings = () =>
  api.get('/api/trainings/my');
// Onboarding
export const getMyOnboarding = () =>
  api.get(`/api/onboarding/my?_t=${Date.now()}`);

export const getMyDocuments = (onboardingId) =>
  api.get(`/api/onboarding/documents/${onboardingId}?_t=${Date.now()}`);

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadOnboardingDocument = (onboardingId, documentKey, { fileUrl, fileName }) =>
  api.post(`/api/onboarding/documents/${onboardingId}/${documentKey}/upload`, { fileUrl, fileName });

export const deleteNotification = (id) =>
  api.delete(`/api/notifications/${id}`);

export const clearAllNotifications = () =>
  api.delete('/api/notifications/clear-all');

//recruitment notifications
//export const getJobById = (id) =>
  //api.get(`/api/recruitment/jobs/${id}`);
 
//export const getAllOpenJobs = (page = 0, size = 10) =>
  //api.get(`/api/recruitment/jobs?page=${page}&size=${size}`);
