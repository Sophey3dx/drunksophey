const { Client } = require('ssh2');

class Tunnel {
    constructor() {
        this.conn = null;
    }

    connect(config, localPort, callback) {
        this.conn = new Client();

        this.conn.on('ready', () => {
            console.log('[DrunkSophey] SSH Connected. Hiccup!');

            this.conn.forwardIn('', config.assigned_port, (err) => {
                if (err) {
                    console.error('[DrunkSophey] Forwarding Error:', err);
                    if (callback) callback(err);
                    return;
                }
                console.log(`[DrunkSophey] Tunnel Open: Remote:${config.assigned_port} -> Local:${localPort}`);
                if (callback) callback(null);
            });
        });

        this.conn.on('tcp connection', (info, accept, reject) => {
            console.log('[DrunkSophey] Incoming connection from', info.srcIP);
            const remote = accept();
            const net = require('net');
            const local = net.connect(localPort, 'localhost');

            remote.pipe(local).pipe(remote);

            local.on('error', (err) => {
                console.error('[DrunkSophey] Local connection error:', err.message);
                remote.end();
            });

            remote.on('error', (err) => {
                console.error('[DrunkSophey] Remote connection error:', err.message);
            });
        });

        this.conn.on('error', (err) => {
            console.error('[DrunkSophey] SSH Error:', err.message);
        });

        this.conn.on('end', () => {
            console.log('[DrunkSophey] SSH Connection Ended.');
        });

        this.conn.connect({
            host: config.ssh_host,
            port: config.ssh_port,
            username: config.ssh_username,
            password: config.ssh_password,
            keepaliveInterval: 10000,
            keepaliveCountMax: 3
        });
    }

    close() {
        if (this.conn) {
            this.conn.end();
            this.conn = null;
        }
    }
}

module.exports = Tunnel;
