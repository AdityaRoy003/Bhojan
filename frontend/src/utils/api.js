import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Global response interceptor:
// If ANY API call returns 503 with maintenance:true, fire a custom event so
// App.jsx can re-check the status and show the MaintenancePage overlay.
//
// We use a custom event instead of window.location.reload() to avoid an
// infinite reload loop when an authenticated Admin gets a 503 on a
// non-admin route (e.g. /order/delivery/available during maintenance).
// App.jsx listens for this event and calls checkMaintenance() which will see
// the admin is logged in and set maintenanceMode = false — no reload needed.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 503 &&
            error.response?.data?.maintenance === true
        ) {
            // Dispatch a lightweight event — App.jsx will re-check /api/status
            window.dispatchEvent(new CustomEvent('bhojan:maintenance-detected'));
        }
        return Promise.reject(error);
    }
);

export default api;
