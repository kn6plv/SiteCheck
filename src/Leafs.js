
const Log = require("debug")("leafs");
const fetch = require("node-fetch");
const AbortController = require("abort-controller").AbortController;

class Leafs {

    constructor(config) {
        this.root = config.root;
        this.timeout = 10 * 1000;
    }

    async find() {
        const leafs = [];

        Log("find:");
        const root = await this.getNodeInfo(this.root);
        if (this.validNode(root)) {
            for (let mac in root.link_info) {
                const link = root.link_info[mac];
                if (link.linkType === "DTD" && link.hostname) {
                    const dtdinfo = await this.getNodeInfo(link.hostname);
                    if (this.validNode(dtdinfo)) {
                        leafs.push(link.hostname);
                    }
                }
            }
        }

        Log("leafs:", leafs);
        return leafs;
    }

    async getNodeInfo(name) {
        const ac = new AbortController();
        const timeout = new setTimeout(() => ac.abort(), this.timeout);
        try {
            const url = `http://${name}.local.mesh:8080/cgi-bin/sysinfo.json?link_info=1`;
            Log(`url: ${url}`);
            const response = await fetch(url, { signal: ac.signal });
            const json = await response.json();
            clearTimeout(timeout);
            return json;
        }
        catch (e) {
            Log("failed:", e);
        }
        return null;
    }

    validNode(info) {
        if (!info) {
            return false;
        }
        const ver = info.node_details.firmware_version;
        // Recent enough production
        if (ver === "3.22.6.0") {
            return true;
        }
        // Recent enough nightly
        if (parseInt(ver.split("-")[0]) >= 1301) {
            return true;
        }
        return false;
    }
}

module.exports = Leafs;
