const axios = require('axios');

class API {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async login(username, password) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/login`, { username, password });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async register(username, email, password) {
        try {
            const res = await axios.post(`${this.baseUrl}/api/register`, { username, email, password });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || err.message);
        }
    }

    async guestLogin() {
        try {
            const res = await axios.post(`${this.baseUrl}/api/guest`);
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
}

module.exports = API;
