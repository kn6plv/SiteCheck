
const Log = require("debug")("test:iperf3");
const fetch = require("node-fetch");
const AbortController = require("abort-controller").AbortController;

class IPerf3 {

    constructor(config) {
        this.client = config.client;
        this.server = config.server;
        this.protocol = config.protocol || "tcp";
        this.timeout = config.timeout || (20 * 1000);
    }

    async run() {
        Log(`run: client ${this.client} <- server ${this.server} (${this.protocol})`);
        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), this.timeout);
        let iperf = null;
        try {
            const url = `http://${this.client}.local.mesh:8080/cgi-bin/iperf?server=${this.server}.local.mesh&protocol=${this.protocol}`;
            Log(`url: ${url}`);
            const response = await fetch(url, { signal: ac.signal });
            const text = await response.text();
            clearTimeout(timeout);
            const patt = [
                { p: /([\d\.]+)\sMbits\/sec.+\(([\d\.]+)%.*receiver/g,  e: m => { return { bandwidth: parseFloat(m[1]) } } },
                { p: /([\d\.]+)\sKbits\/sec.+\(([\d\.]+)%.*receiver/g,  e: m => { return { bandwidth: parseFloat(m[1]) / 1000 } } },
                { p: /([\d\.]+)\sMbits\/sec.*receiver/g,                e: m => { return { bandwidth: parseFloat(m[1]) } } },
                { p: /([\d\.]+)\sKbits\/sec.*receiver/g,                e: m => { return { bandwidth: parseFloat(m[1]) / 1000 } } }
            ];
            const lines = text.split("\n");
            for (let l = 0; l < lines.length && !iperf; l++) {
                const line = lines[l];
                for (let i = 0; i < patt.length && !iperf; i++) {
                    const m = patt[i].p.exec(line);
                    if (m) {
                        iperf = patt[i].e(m);
                    }
                }
            }   
        }
        catch (e) {
            Log("failed:", e);
            clearTimeout(timeout);
        }
        return iperf;
    }

}

module.exports = IPerf3;
