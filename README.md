# DrunkSophey 🍸

**The Official Client for Sophey.vodka**

`drunksophey` is the only Node.js client that promises to tunnel your traffic while seeing double. It connects your local ports to the public internet via `sophey.vodka`, and it does it with style (and maybe a slight slur).

## Installation

Grab a cold one and run:

```bash
npm install drunksophey
```

## CLI Usage

The easiest way to use DrunkSophey is via the command line. No installation required if you use `npx`.

```bash
npx drunksophey --port 8080
```

This will:
1.  Create a temporary guest account (The "One-Night Stand").
2.  Assign you a random subdomain (e.g., `https://whiskey-tango-foxtrot.sophey.vodka`).
3.  Tunnel your local port `8080` to the public internet.

## Library Usage

### Initialization (The Pre-Game)

```javascript
const DrunkSophey = require('drunksophey');

// Initialize the client (it's 5 o'clock somewhere)
const client = new DrunkSophey({
    baseUrl: 'https://sophey.vodka'
});
```

### Guest Login (The One-Night Stand)

Perfect for quick, temporary tunnels. Sessions expire after 24 hours (just like a bad hangover).

```javascript
try {
    const user = await client.guestLogin();
    console.log(`Subdomain: ${user.subdomain} (don't get attached)`);
    
    // Start Tunneling local port 8080
    // "I swear officer, I'm just tunneling traffic!"
    const streamUrl = await client.startTunnel(8080);
    console.log(`Tunnel Live: ${streamUrl}`);
} catch (err) {
    console.error('Guest login failed (maybe you had too much?):', err);
}
```

### Register New Account (First Timer's Special)

Create a permanent account with your own subdomain. The best kind of commitment.

```javascript
try {
    const user = await client.register('myusername', 'email@example.com', 'strongpassword');
    console.log(`Account created! Your subdomain: ${user.subdomain}`);
    
    // You're automatically logged in after registration
    const streamUrl = await client.startTunnel(8080);
    console.log(`Tunnel Live: ${streamUrl}`);
} catch (err) {
    console.error('Registration failed (username taken?):', err);
}
```

### Registered User Login (The Regular)

For when everybody knows your name.

```javascript
try {
    const user = await client.login('myusername', 'mypassword');
    console.log(`Welcome back, ${user.subdomain}! The usual?`);
    
    const streamUrl = await client.startTunnel(3000);
    console.log(`Stream flowing at: ${streamUrl}`);
} catch (err) {
    console.error('Login failed. Bouncer said no:', err);
    // Error messages include:
    // - "Please verify your email before logging in..." (new accounts)
    // - "Account temporarily locked..." (after 5 failed attempts)
}
```

### Error Handling 🚨

The client now provides detailed error messages for common issues:

- **Email Verification Required**: New accounts must verify their email before logging in
- **Account Lockout**: After 5 failed login attempts, accounts are locked for 15 minutes
- **Rate Limiting**: Registration is limited to 3 attempts per hour per IP

**Registration Flow:**
```javascript
const result = await client.register('username', 'email@example.com', 'password');
console.log(result.message); // "Registration successful! Please check your email..."
console.log(result.needsEmailVerification); // true
```

## Security & Privacy 🔒

We take security seriously, even if our branding is playful. (We code sober, we promise).

*   **Encryption**: All traffic is tunneled via **SSH (Secure Shell)** using standard cryptographic protocols. Your data is encrypted between your machine and our server.
*   **Server Location**: Our tunnel servers are located in **Germany (EU)**, adhering to strict data protection standards.
*   **No Logging**: We do not inspect or log the contents of your tunneled traffic. We only track connection metadata (bytes transferred) for analytics.
*   **Isolation**: Each user is isolated on their own assigned port and subdomain.

## Features

*   **Easy Tunneling**: Expose local ports faster than you can take a shot.
*   **Guest Mode**: Instant access with random subdomains.
*   **User Accounts**: Persistent subdomains for the designated drivers.
*   **Secure**: Built on industry-standard SSH tunneling (safe sex for your data).

## License

ISC (I Sip Cocktails)
