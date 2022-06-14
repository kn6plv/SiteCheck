#! /usr/bin/env nodejs

const Log = require("debug")("main");
const Leafs = require("./Leafs");
const IPerf3 = require("./tests/Iperf3");

(async function() {
    Log("running:");

    const root = process.argv[2] || "localnode";

    console.log(`Root: ${root}`);

    const leafs = new Leafs({ root: root });
    const leaf = await leafs.find();

    console.log(`Leafs: ${leaf.join(" ")}`);

    for (let i = 0; i < leaf.length; i++) {
        const test = new IPerf3({
            client: root,
            server: leaf[i]
        });
        const result = await test.run();
        if (result) {
            console.log(`${test.client} <- ${test.server}: ${result.bandwidth} Mbps`);
        }
        else {
            console.log(`${test.client} <- ${test.server}: failed`);
        }
    }

})();
