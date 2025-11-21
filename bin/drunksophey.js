#!/usr/bin/env node

const DrunkSophey = require('../index');
const args = process.argv.slice(2);

function printHelp() {
    console.log(`
DrunkSophey CLI 🍸
Usage: npx drunksophey [options]

Options:
  --port <number>    Local port to tunnel (Required)
  --host <url>       Custom API URL (Optional)
  --help             Show this help message

Example:
  npx drunksophey --port 8080
`);
}

async function main() {
    let port = null;
    let host = 'https://sophey.vodka';

    // Parse args manually to avoid dependencies
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--port') {
            port = parseInt(args[i + 1]);
            i++;
        } else if (args[i] === '--host') {
            host = args[i + 1];
            i++;
        } else if (args[i] === '--help') {
            printHelp();
            process.exit(0);
        }
    }

    if (!port) {
        console.error('Error: --port is required');
        printHelp();
        process.exit(1);
    }

    console.log('🍸 Initializing DrunkSophey...');
    const client = new DrunkSophey({ baseUrl: host });

    try {
        console.log('🔑 Logging in as guest...');
        const user = await client.guestLogin();
        console.log(`✅ Logged in! Subdomain: ${user.subdomain}`);

        console.log(`🚀 Starting tunnel for local port ${port}...`);
        const url = await client.startTunnel(port);

        console.log('\n' + '='.repeat(50));
        console.log(`✨ Tunnel Live: ${url}`);
        console.log('='.repeat(50) + '\n');

        console.log('Press Ctrl+C to stop.');

        // Keep process alive
        process.stdin.resume();

        process.on('SIGINT', async () => {
            console.log('\n🛑 Closing tunnel...');
            await client.disconnect();
            process.exit(0);
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

main();
