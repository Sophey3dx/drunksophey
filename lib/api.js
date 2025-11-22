const axios = require('axios');

class API {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async login(username, password) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/login`, { username, password });
            return {
                ...res.data,
                // For easier access in client apps
                isVerified: res.data.email_verified || false,
                isAdmin: res.data.role === 'admin'
            };
        } catch (err) {
            const error = err.response?.data;

            // Handle email verification requirement
            if (error?.emailNotVerified) {
                throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
            }

            // Handle account lockout
            if (error?.lockedOut) {
                const minutes = error.remainingMinutes || 15;
                throw new Error(`Account temporarily locked due to multiple failed login attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
            }

            throw new Error(error?.error || err.message);
        }
    }

    async register(username, email, password) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/register`, { username, email, password });
            return {
                ...res.data,
                needsEmailVerification: true,
                message: res.data.message || 'Registration successful! Please check your email to verify your account.'
            };
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async guestLogin(wordlistType = '3dxchat') {
        try {
            const res = await axios.post(`${this.baseUrl}/api/guest?wordlist=${wordlistType}`);
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async getWordLists() {
        try {
            const res = await axios.get(`${this.baseUrl}/api/wordlists`);
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async disconnectGuest(token) {
        try {
            await axios.post(`${this.baseUrl}/api/guest/disconnect`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            // Ignore cleanup errors
            console.warn('Cleanup warning:', err.message);
        }
    }

    async getTunnelConfig(token) {
        try {
            const res = await axios.get(`${this.baseUrl}/api/tunnel/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async changePassword(token, currentPassword, newPassword) {
        try {
            const res = await axios.put(`${this.baseUrl}/api/user/me/password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async forgotPassword(email) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/auth/forgot-password`, { email });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/auth/reset-password`, { token, newPassword });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async getSystemStatus() {
        try {
            const res = await axios.get(`${this.baseUrl}/api/system/status`);
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }
    // --- Admin Methods ---

    async getAdminStats(token) {
        try {
            const res = await axios.get(`${this.baseUrl}/api/admin/tunnel-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async getLeaderboard(token) {
        try {
            const res = await axios.get(`${this.baseUrl}/api/admin/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async getSecurityLogs(token, page = 1, limit = 50) {
        try {
            const res = await axios.get(`${this.baseUrl}/api/admin/security-logs`, {
                params: { page, limit },
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async getUsers(token, page = 1, limit = 20) {
        try {
            const res = await axios.get(`${this.baseUrl}/api/admin/users`, {
                params: { page, limit },
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async banUser(token, userId, reason) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/admin/users/${userId}/ban`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async unbanUser(token, userId) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/admin/users/${userId}/unban`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }
}

module.exports = API;
