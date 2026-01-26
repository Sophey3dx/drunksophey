const API = require('./lib/api');
const Tunnel = require('./lib/tunnel');

class DrunkSophey {
    /**
     * @param {Object} options
     * @param {string} [options.baseUrl='https://sophey.vodka'] - The API base URL
     */
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://sophey.vodka';
        this.api = new API(this.baseUrl);
        this.tunnel = new Tunnel();
        this.token = null;
        this.user = null;
    }

    /**
     * Register a new user account
     * @param {string} username - Desired username
     * @param {string} email - User email address
     * @param {string} password - User password
     * @returns {Promise<Object>} User data with token and subdomain
     */
    async register(username, email, password) {
        const data = await this.api.register(username, email, password);
        this.token = data.token;
        this.user = {
            ...data
        };
        return this.user;
    }

    /**
     * Login as a registered user
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        const data = await this.api.login(username, password);
        this.token = data.token;
        this.user = {
            ...data
        };
        return this.user;
    }

    /**
     * Login as a guest (Ephemeral Session)
     */
    async guestLogin() {
        const data = await this.api.guestLogin();
        this.token = data.token;
        this.user = {
            ...data
        };
        return this.user;
    }

    /**
     * Disconnect guest session and cleanup
     */
    async disconnect() {
        if (this.token) {
            await this.api.disconnectGuest(this.token);
            this.token = null;
            this.user = null;
        }
        this.tunnel.close();
    }

    /**
     * Start the tunnel
     * @param {number} localPort - The local port where your stream is running (e.g., 8081)
     */
    async startTunnel(localPort) {
        if (!this.token || !this.user) {
            throw new Error('You must be logged in to start the tunnel.');
        }

        const config = await this.api.getTunnelConfig(this.token);

        return new Promise((resolve, reject) => {
            this.tunnel.connect(config, localPort, (err) => {
                if (err) return reject(err);
                resolve(this.user.stream_url);
            });
        });
    }

    /**
     * Change current user's password
     */
    async changePassword(currentPassword, newPassword) {
        if (!this.token) throw new Error('Not logged in');
        return this.api.changePassword(this.token, currentPassword, newPassword);
    }

    /**
     * Request password reset (Forgot Password)
     */
    async forgotPassword(email) {
        return this.api.forgotPassword(email);
    }

    /**
     * Reset password using token
     */
    async resetPassword(token, newPassword) {
        return this.api.resetPassword(token, newPassword);
    }

    /**
     * Check system status
     */
    async getSystemStatus() {
        return this.api.getSystemStatus();
    }

    /**
     * Get active global announcements
     * @returns {Promise<Array>} Array of active announcements
     */
    async getAnnouncements() {
        return this.api.getAnnouncements();
    }

    /**
     * Admin Interface
     * Access admin features if the logged-in user has admin privileges.
     */
    get admin() {
        return {
            getStats: () => {
                if (!this.token) throw new Error('Not logged in');
                return this.api.getAdminStats(this.token);
            },
            getLeaderboard: () => {
                if (!this.token) throw new Error('Not logged in');
                return this.api.getLeaderboard(this.token);
            },
            getSecurityLogs: (page, limit) => {
                if (!this.token) throw new Error('Not logged in');
                return this.api.getSecurityLogs(this.token, page, limit);
            },
            getUsers: (page, limit) => {
                if (!this.token) throw new Error('Not logged in');
                return this.api.getUsers(this.token, page, limit);
            },
            banUser: (userId, reason) => {
                if (!this.token) throw new Error('Not logged in');
                return this.api.banUser(this.token, userId, reason);
            },
            unbanUser: (userId) => {
                if (!this.token) throw new Error('Not logged in');
                return this.api.unbanUser(this.token, userId);
            }
        };
    }
}

module.exports = DrunkSophey;

