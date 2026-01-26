# DrunkSophey API Guide 🍸

Complete API reference for the DrunkSophey Node.js client library.

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Authentication Methods](#authentication-methods)
4. [Tunnel Management](#tunnel-management)
5. [User Management](#user-management)
6. [System Information](#system-information)
7. [Admin Interface](#admin-interface)
8. [Complete Examples](#complete-examples)

---

## Overview

DrunkSophey is the official Node.js client for Sophey.vodka, a secure SSH tunneling service. It allows you to expose your local ports to the public internet through secure SSH tunnels.

### Key Features

- **Secure SSH Tunneling**: All traffic encrypted via SSH
- **Guest Mode**: Quick temporary tunnels (24-hour sessions)
- **User Accounts**: Persistent subdomains for registered users
- **Port Range**: Servers assign ports in the range **29999-39999** (starting at 30000)
- **Nginx Integration**: Traffic routed through nginx from `https://subdomain.sophey.vodka/stream` to your local port

---

## Installation & Setup

### Installation

```bash
npm install drunksophey
```

### Basic Configuration

```javascript
const DrunkSophey = require('drunksophey');

// Initialize with default base URL (https://sophey.vodka)
const client = new DrunkSophey();

// Or specify a custom base URL
const client = new DrunkSophey({
    baseUrl: 'https://sophey.vodka'
});
```

**Constructor Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `options.baseUrl` | `string` | No | `'https://sophey.vodka'` | The API base URL |

---

## Authentication Methods

### `register(username, email, password)`

Creates a new user account with a persistent subdomain.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | Yes | Desired username (3-30 characters, alphanumeric with underscores/hyphens) |
| `email` | `string` | Yes | User email address (must be valid format) |
| `password` | `string` | Yes | User password |

**Returns:** `Promise<Object>` - User data object

**Response Structure:**
```javascript
{
    token: string,           // JWT authentication token
    user: {
        id: number,
        username: string,
        subdomain: string
    },
    needsEmailVerification: true,
    message: string          // "Registration successful! Please check your email..."
}
```

**Example:**
```javascript
try {
    const result = await client.register('myusername', 'email@example.com', 'strongpassword');
    console.log(`Account created! Subdomain: ${result.user.subdomain}`);
    console.log(`Token: ${result.token.substring(0, 20)}...`);
    console.log(result.message); // Email verification required
} catch (err) {
    console.error('Registration failed:', err.message);
    // Common errors:
    // - "Username already taken"
    // - "Email already registered"
    // - "Invalid username format"
}
```

**Notes:**
- User is automatically logged in after successful registration
- Email verification is required before the account can be used
- Registration is rate-limited to 3 attempts per hour per IP

---

### `login(username, password)`

Authenticates as a registered user.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | Yes | Registered username |
| `password` | `string` | Yes | Account password |

**Returns:** `Promise<Object>` - User data object

**Response Structure:**
```javascript
{
    token: string,              // JWT authentication token
    id: number,
    username: string,
    subdomain: string,
    assigned_port: number,      // Port in range 29999-39999
    stream_url: string,         // e.g., "https://subdomain.sophey.vodka/stream"
    isVerified: boolean,        // Email verification status
    isAdmin: boolean,           // Admin privileges flag
    email_verified: boolean,
    role: string                // 'user' or 'admin'
}
```

**Example:**
```javascript
try {
    const user = await client.login('myusername', 'mypassword');
    console.log(`Welcome back, ${user.subdomain}!`);
    console.log(`Assigned Port: ${user.assigned_port}`);
    console.log(`Stream URL: ${user.stream_url}`);
    console.log(`Admin: ${user.isAdmin}`);
} catch (err) {
    console.error('Login failed:', err.message);
    // Common errors:
    // - "Please verify your email before logging in..."
    // - "Account temporarily locked due to multiple failed login attempts. Try again in X minutes."
    // - "Invalid credentials."
}
```

**Error Handling:**
- **Email Not Verified**: New accounts must verify email before login
- **Account Lockout**: After 5 failed attempts, account is locked for 15 minutes
- **Invalid Credentials**: Wrong username or password

---

### `guestLogin(wordlistType?)`

Creates a temporary guest account (ephemeral session, expires after 24 hours).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wordlistType` | `string` | No | `'3dxchat'` | Word list for subdomain generation: `'normal'` or `'3dxchat'` |

**Returns:** `Promise<Object>` - Guest user data object

**Response Structure:**
```javascript
{
    token: string,              // JWT authentication token
    subdomain: string,          // Random subdomain (e.g., "vodka-whiskey-rum-tequila")
    assigned_port: number,      // Port in range 29999-39999
    stream_url: string,         // e.g., "https://subdomain.sophey.vodka/stream"
    expires_at: string          // ISO timestamp (24 hours from creation)
}
```

**Example:**
```javascript
try {
    // Default word list (3dxchat)
    const guest = await client.guestLogin();
    console.log(`Guest subdomain: ${guest.subdomain}`);
    
    // Using 'normal' word list (alcoholic beverages)
    const guestNormal = await client.guestLogin('normal');
    console.log(`Normal subdomain: ${guestNormal.subdomain}`);
    
    // Explicit 3dxchat word list
    const guest3dx = await client.guestLogin('3dxchat');
    console.log(`3DXChat subdomain: ${guest3dx.subdomain}`);
} catch (err) {
    console.error('Guest login failed:', err.message);
}
```

**Notes:**
- Guest sessions expire after 24 hours
- Each guest receives a unique random subdomain
- Perfect for quick, temporary tunnels without registration

---

## Tunnel Management

### `startTunnel(localPort)`

Establishes an SSH tunnel from the server to your local port.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `localPort` | `number` | Yes | The local port where your application/stream is running (e.g., 8080, 3000) |

**Returns:** `Promise<string>` - The public stream URL

**Response:**
- Returns the `stream_url` string (e.g., `"https://subdomain.sophey.vodka/stream"`)

**Example:**
```javascript
try {
    // First, authenticate (register, login, or guestLogin)
    const user = await client.guestLogin();
    
    // Start tunneling local port 8080
    const streamUrl = await client.startTunnel(8080);
    console.log(`Tunnel active at: ${streamUrl}`);
    console.log(`Traffic from ${streamUrl} → localhost:8080`);
} catch (err) {
    console.error('Tunnel failed:', err.message);
    // Common errors:
    // - "You must be logged in to start the tunnel."
    // - SSH connection errors
}
```

**How It Works:**
1. Retrieves SSH tunnel configuration from the server
2. Establishes SSH connection to the server
3. Sets up remote port forwarding via SSH
4. Nginx routes traffic from `https://subdomain.sophey.vodka/stream` to `http://127.0.0.1:$assigned_port`
5. SSH tunnel forwards from server port to your local port

**Port Assignment:**
- Servers assign ports in the range **29999-39999** (starting at 30000)
- Each user receives a unique port automatically
- Ports are mapped in nginx configuration (`nginx_map.conf`)
- Your `assigned_port` is used internally by the server and nginx

---

### `disconnect()`

Closes the tunnel connection and cleans up guest sessions.

**Parameters:** None

**Returns:** `Promise<void>`

**Example:**
```javascript
try {
    await client.disconnect();
    console.log('Tunnel closed and session cleaned up');
} catch (err) {
    console.error('Disconnect error:', err.message);
}
```

**Notes:**
- Closes the SSH tunnel connection
- For guest sessions, removes the guest account from the server
- Clears the stored token and user data
- Safe to call even if not connected

---

## User Management

### `changePassword(currentPassword, newPassword)`

Changes the password for the currently logged-in user.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currentPassword` | `string` | Yes | Current account password |
| `newPassword` | `string` | Yes | New password to set |

**Returns:** `Promise<Object>` - Success response

**Response Structure:**
```javascript
{
    message: string  // e.g., "Password changed successfully"
}
```

**Example:**
```javascript
try {
    // Must be logged in first
    await client.login('myusername', 'oldpassword');
    
    const result = await client.changePassword('oldpassword', 'newpassword');
    console.log(result.message);
} catch (err) {
    console.error('Password change failed:', err.message);
    // Common errors:
    // - "Not logged in"
    // - "Current password is incorrect"
}
```

**Requirements:**
- User must be logged in (not available for guest sessions)

---

### `forgotPassword(email)`

Requests a password reset link to be sent via email.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | `string` | Yes | Email address of the account |

**Returns:** `Promise<Object>` - Response object

**Response Structure:**
```javascript
{
    message: string  // e.g., "If an account exists, a reset link has been sent"
}
```

**Example:**
```javascript
try {
    const result = await client.forgotPassword('user@example.com');
    console.log(result.message);
    // Response is always successful (security: doesn't reveal if email exists)
} catch (err) {
    console.error('Password reset request failed:', err.message);
}
```

**Notes:**
- Response does not reveal whether the email exists (security best practice)
- Reset tokens expire after 1 hour
- Check email for the reset link

---

### `resetPassword(token, newPassword)`

Resets the password using a token from the password reset email.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | `string` | Yes | Password reset token from email |
| `newPassword` | `string` | Yes | New password to set |

**Returns:** `Promise<Object>` - Success response

**Response Structure:**
```javascript
{
    message: string  // e.g., "Password reset successful"
}
```

**Example:**
```javascript
try {
    // Token is extracted from the reset link sent via email
    // e.g., from: https://sophey.vodka/reset-password?token=abc123...
    const resetToken = 'token-from-email';
    
    const result = await client.resetPassword(resetToken, 'newpassword');
    console.log(result.message);
} catch (err) {
    console.error('Password reset failed:', err.message);
    // Common errors:
    // - "Invalid or expired reset token"
}
```

**Notes:**
- Token is valid for 1 hour
- After successful reset, login with the new password

---

## System Information

### `getSystemStatus()`

Retrieves the current system status (no authentication required).

**Parameters:** None

**Returns:** `Promise<Object>` - System status object

**Response Structure:**
```javascript
{
    status: string,    // e.g., "online", "maintenance"
    message: string,   // Status message
    timestamp: string  // ISO timestamp
}
```

**Example:**
```javascript
try {
    const status = await client.getSystemStatus();
    console.log(`System Status: ${status.status}`);
    console.log(`Message: ${status.message}`);
} catch (err) {
    console.error('Status check failed:', err.message);
}
```

**Use Cases:**
- Health checks
- Monitoring
- Pre-flight checks before connecting

---

### `getAnnouncements()`

Retrieves active global announcements (no authentication required).

**Parameters:** None

**Returns:** `Promise<Array>` - Array of announcement objects

**Response Structure:**
```javascript
[
    {
        id: number,
        title: string,
        message: string,
        type: string,        // e.g., "info", "warning", "maintenance"
        start_date: string,  // ISO timestamp
        end_date: string,    // ISO timestamp
        created_at: string   // ISO timestamp
    }
]
```

**Example:**
```javascript
try {
    const announcements = await client.getAnnouncements();
    announcements.forEach(announcement => {
        console.log(`[${announcement.type}] ${announcement.title}`);
        console.log(announcement.message);
    });
} catch (err) {
    console.error('Failed to fetch announcements:', err.message);
}
```

---

## Admin Interface

All admin methods require authentication and admin privileges. Access via `client.admin.*`.

**Checking Admin Status:**
```javascript
const user = await client.login('admin', 'password');
if (user.isAdmin) {
    // Access admin methods
    const stats = await client.admin.getStats();
}
```

---

### `admin.getStats()`

Retrieves system statistics (admin only).

**Parameters:** None

**Returns:** `Promise<Object>` - Statistics object

**Response Structure:**
```javascript
{
    totalUsers: number,
    activeUsers: number,
    totalTunnels: number,
    activeTunnels: number,
    totalBytesTransferred: number,
    // ... additional stats
}
```

**Example:**
```javascript
try {
    const stats = await client.admin.getStats();
    console.log(`Total Users: ${stats.totalUsers}`);
    console.log(`Active Tunnels: ${stats.activeTunnels}`);
} catch (err) {
    console.error('Failed to fetch stats:', err.message);
    // Common errors:
    // - "Not logged in"
    // - "Insufficient permissions" (not admin)
}
```

---

### `admin.getLeaderboard()`

Retrieves the user leaderboard (admin only).

**Parameters:** None

**Returns:** `Promise<Array>` - Leaderboard entries

**Response Structure:**
```javascript
[
    {
        username: string,
        subdomain: string,
        totalBytesTransferred: number,
        totalUptimeSeconds: number,
        rank: number
    }
]
```

**Example:**
```javascript
try {
    const leaderboard = await client.admin.getLeaderboard();
    leaderboard.forEach((entry, index) => {
        console.log(`${entry.rank}. ${entry.username} - ${entry.totalBytesTransferred} bytes`);
    });
} catch (err) {
    console.error('Failed to fetch leaderboard:', err.message);
}
```

---

### `admin.getSecurityLogs(page?, limit?)`

Retrieves security event logs (admin only).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | `number` | No | `1` | Page number (pagination) |
| `limit` | `number` | No | `50` | Results per page |

**Returns:** `Promise<Object>` - Paginated security logs

**Response Structure:**
```javascript
{
    logs: [
        {
            id: number,
            event_type: string,      // e.g., "FAILED_LOGIN", "XSS_ATTEMPT"
            ip_address: string,
            user_agent: string,
            username: string,
            created_at: string       // ISO timestamp
        }
    ],
    total: number,
    page: number,
    limit: number,
    totalPages: number
}
```

**Example:**
```javascript
try {
    const logs = await client.admin.getSecurityLogs(1, 100);
    console.log(`Total security events: ${logs.total}`);
    logs.logs.forEach(log => {
        console.log(`[${log.event_type}] ${log.ip_address} - ${log.created_at}`);
    });
} catch (err) {
    console.error('Failed to fetch security logs:', err.message);
}
```

---

### `admin.getUsers(page?, limit?)`

Retrieves a paginated list of all users (admin only).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | `number` | No | `1` | Page number (pagination) |
| `limit` | `number` | No | `20` | Results per page |

**Returns:** `Promise<Object>` - Paginated user list

**Response Structure:**
```javascript
{
    users: [
        {
            id: number,
            username: string,
            email: string,
            subdomain: string,
            assigned_port: number,
            role: string,              // 'user' or 'admin'
            is_active: boolean,
            is_banned: boolean,
            is_guest: boolean,
            created_at: string,        // ISO timestamp
            last_seen: string,         // ISO timestamp
            isOnline: boolean          // Current connection status
        }
    ],
    total: number,
    page: number,
    limit: number,
    totalPages: number
}
```

**Example:**
```javascript
try {
    const result = await client.admin.getUsers(1, 50);
    console.log(`Total users: ${result.total}`);
    result.users.forEach(user => {
        const status = user.isOnline ? '🟢 Online' : '🔴 Offline';
        console.log(`${user.username} (${user.subdomain}) - ${status}`);
    });
} catch (err) {
    console.error('Failed to fetch users:', err.message);
}
```

---

### `admin.banUser(userId, reason)`

Bans a user account (admin only).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `number` | Yes | ID of the user to ban |
| `reason` | `string` | Yes | Reason for the ban |

**Returns:** `Promise<Object>` - Success response

**Response Structure:**
```javascript
{
    message: string,  // e.g., "User banned successfully"
    user: {
        id: number,
        username: string,
        is_banned: boolean,
        ban_reason: string
    }
}
```

**Example:**
```javascript
try {
    const result = await client.admin.banUser(123, 'Violation of terms of service');
    console.log(result.message);
    console.log(`Banned user: ${result.user.username}`);
} catch (err) {
    console.error('Failed to ban user:', err.message);
    // Common errors:
    // - "User not found"
    // - "User is already banned"
}
```

---

### `admin.unbanUser(userId)`

Unbans a user account (admin only).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `number` | Yes | ID of the user to unban |

**Returns:** `Promise<Object>` - Success response

**Response Structure:**
```javascript
{
    message: string,  // e.g., "User unbanned successfully"
    user: {
        id: number,
        username: string,
        is_banned: false
    }
}
```

**Example:**
```javascript
try {
    const result = await client.admin.unbanUser(123);
    console.log(result.message);
    console.log(`Unbanned user: ${result.user.username}`);
} catch (err) {
    console.error('Failed to unban user:', err.message);
}
```

---

## Complete Examples

### Example 1: Quick Guest Tunnel

Perfect for testing or temporary sharing:

```javascript
const DrunkSophey = require('drunksophey');

async function quickTunnel() {
    const client = new DrunkSophey();
    
    try {
        // Create guest account
        const guest = await client.guestLogin();
        console.log(`Guest subdomain: ${guest.subdomain}`);
        
        // Start tunnel on local port 8080
        const streamUrl = await client.startTunnel(8080);
        console.log(`Tunnel active: ${streamUrl}`);
        
        // Your local app on port 8080 is now accessible at streamUrl
        
        // When done, disconnect
        // await client.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

quickTunnel();
```

### Example 2: Registered User Workflow

Full lifecycle with error handling:

```javascript
const DrunkSophey = require('drunksophey');

async function registeredUserFlow() {
    const client = new DrunkSophey();
    
    try {
        // 1. Register new account
        console.log('Registering account...');
        const registration = await client.register(
            'myusername',
            'email@example.com',
            'securepassword123'
        );
        console.log(`Account created: ${registration.user.subdomain}`);
        console.log(`Please check your email to verify.`);
        
        // Note: In real usage, wait for email verification before proceeding
        
        // 2. Login (after email verification)
        console.log('\nLogging in...');
        const user = await client.login('myusername', 'securepassword123');
        console.log(`Logged in as: ${user.subdomain}`);
        console.log(`Assigned Port: ${user.assigned_port}`);
        
        // 3. Start tunnel
        console.log('\nStarting tunnel...');
        const streamUrl = await client.startTunnel(3000);
        console.log(`Tunnel active: ${streamUrl}`);
        
        // 4. Your app on localhost:3000 is now accessible via streamUrl
        
    } catch (err) {
        if (err.message.includes('verify your email')) {
            console.error('Email verification required. Check your inbox.');
        } else if (err.message.includes('locked')) {
            console.error('Account locked. Please wait and try again.');
        } else {
            console.error('Error:', err.message);
        }
    }
}

registeredUserFlow();
```

### Example 3: Password Reset Flow

Complete password reset workflow:

```javascript
const DrunkSophey = require('drunksophey');

async function passwordResetFlow() {
    const client = new DrunkSophey();
    
    try {
        // 1. Request password reset
        console.log('Requesting password reset...');
        const result = await client.forgotPassword('user@example.com');
        console.log(result.message);
        console.log('Check your email for the reset link.');
        
        // 2. Extract token from email link
        // In real usage, user clicks link in email which contains token
        const resetToken = 'token-from-email-link';
        
        // 3. Reset password
        console.log('\nResetting password...');
        const resetResult = await client.resetPassword(resetToken, 'newpassword123');
        console.log(resetResult.message);
        
        // 4. Login with new password
        console.log('\nLogging in with new password...');
        const user = await client.login('myusername', 'newpassword123');
        console.log('Login successful!');
        
    } catch (err) {
        console.error('Error:', err.message);
    }
}

passwordResetFlow();
```

### Example 4: Admin Monitoring Dashboard

Example of admin operations:

```javascript
const DrunkSophey = require('drunksophey');

async function adminDashboard() {
    const client = new DrunkSophey();
    
    try {
        // Login as admin
        const admin = await client.login('admin', 'adminpassword');
        if (!admin.isAdmin) {
            throw new Error('User does not have admin privileges');
        }
        
        // Get system stats
        console.log('=== System Statistics ===');
        const stats = await client.admin.getStats();
        console.log(`Total Users: ${stats.totalUsers}`);
        console.log(`Active Tunnels: ${stats.activeTunnels}`);
        
        // Get leaderboard
        console.log('\n=== Leaderboard ===');
        const leaderboard = await client.admin.getLeaderboard();
        leaderboard.slice(0, 10).forEach(entry => {
            console.log(`${entry.rank}. ${entry.username} - ${entry.totalBytesTransferred} bytes`);
        });
        
        // Get recent security logs
        console.log('\n=== Recent Security Events ===');
        const logs = await client.admin.getSecurityLogs(1, 20);
        logs.logs.forEach(log => {
            console.log(`[${log.event_type}] ${log.ip_address} - ${new Date(log.created_at).toLocaleString()}`);
        });
        
        // Get user list
        console.log('\n=== Users (Page 1) ===');
        const users = await client.admin.getUsers(1, 20);
        users.users.forEach(user => {
            const status = user.isOnline ? '🟢' : '🔴';
            const banned = user.is_banned ? ' [BANNED]' : '';
            console.log(`${status} ${user.username} (${user.subdomain})${banned}`);
        });
        
    } catch (err) {
        console.error('Admin operation failed:', err.message);
    }
}

adminDashboard();
```

### Example 5: Error Handling Best Practices

Comprehensive error handling:

```javascript
const DrunkSophey = require('drunksophey');

async function robustErrorHandling() {
    const client = new DrunkSophey();
    
    try {
        // Check system status first
        const status = await client.getSystemStatus();
        if (status.status !== 'online') {
            console.warn(`System status: ${status.status}`);
            return;
        }
        
        // Attempt guest login with retry logic
        let guest;
        let retries = 3;
        while (retries > 0) {
            try {
                guest = await client.guestLogin();
                break;
            } catch (err) {
                retries--;
                if (retries === 0) throw err;
                console.log(`Retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log(`Guest account: ${guest.subdomain}`);
        
        // Start tunnel with error handling
        try {
            const streamUrl = await client.startTunnel(8080);
            console.log(`Tunnel established: ${streamUrl}`);
        } catch (err) {
            if (err.message.includes('must be logged in')) {
                console.error('Authentication required');
            } else if (err.message.includes('SSH')) {
                console.error('SSH connection failed:', err.message);
            } else {
                console.error('Tunnel error:', err.message);
            }
            throw err;
        }
        
    } catch (err) {
        // Centralized error handling
        console.error('Operation failed:', err.message);
        
        // Cleanup on error
        try {
            await client.disconnect();
        } catch (disconnectErr) {
            // Ignore cleanup errors
        }
    }
}

robustErrorHandling();
```

---

## Port Range & Architecture

### Port Assignment

The DrunkSophey service assigns ports automatically from the range **29999-39999**:

- **Default Start Port**: 30000
- **Port Range**: 29999-39999 (10,000 available ports)
- **Assignment**: Sequential, starting from 30000
- **Uniqueness**: Each user receives a unique port

### How Traffic Flows

```
User's Browser
    ↓
https://subdomain.sophey.vodka/stream
    ↓ (nginx proxy)
http://127.0.0.1:$assigned_port (on server)
    ↓ (SSH tunnel)
Your Local Machine: localhost:$localPort
```

### Technical Details

- **Nginx Configuration**: Ports are mapped in `nginx_map.conf`
- **SSH Tunneling**: Remote port forwarding via SSH2 protocol
- **Server Location**: Germany (EU), compliant with data protection standards
- **Encryption**: All traffic encrypted via SSH (AES-256)

### Checking Your Assigned Port

After login, check the `assigned_port` property:

```javascript
const user = await client.login('username', 'password');
console.log(`Your assigned port: ${user.assigned_port}`);
// Example output: 30042
```

This port is used internally by nginx to route traffic. You don't need to configure anything - it's handled automatically by the service.

---

## Error Reference

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `"You must be logged in to start the tunnel."` | Called `startTunnel()` without authentication | Call `login()`, `register()`, or `guestLogin()` first |
| `"Not logged in"` | Admin/authenticated method called without token | Ensure user is logged in |
| `"Please verify your email before logging in..."` | Account created but email not verified | Check email and click verification link |
| `"Account temporarily locked..."` | 5 failed login attempts | Wait 15 minutes before retrying |
| `"Username already taken"` | Registration with existing username | Choose a different username |
| `"Invalid credentials."` | Wrong username/password | Verify credentials |
| `"Insufficient permissions"` | Non-admin user called admin method | Admin access required |
| `"Invalid or expired reset token"` | Password reset token invalid/expired | Request a new reset link |

---

## Best Practices

1. **Always handle errors**: Wrap API calls in try/catch blocks
2. **Check system status**: Use `getSystemStatus()` before critical operations
3. **Clean up resources**: Call `disconnect()` when done, especially for guest sessions
4. **Retry logic**: Implement retries for network operations
5. **Email verification**: Wait for email verification after registration
6. **Security**: Never log or expose authentication tokens
7. **Rate limiting**: Respect rate limits (registration: 3/hour/IP)
8. **Guest sessions**: Remember guest sessions expire after 24 hours

---

## License

ISC (I Sip Cocktails)

---

**Version**: 1.3.0  
**Last Updated**: 2025  
**API Base URL**: https://sophey.vodka
