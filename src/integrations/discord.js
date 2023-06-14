const RPC = require('discord-rpc');
const rpcClient = new RPC.Client({ transport: 'ipc' });
const APPLICATION_ID = '793878460157788220';
RPC.register(APPLICATION_ID);

function onRpcReady() {
    rpcClient.setActivity({
        state: "Waddling",
        details: "New Club Penguin",
        startTimestamp: Date.now(),
        largeImageKey: "ncpapp",
        instance: true,
    });
}

function initDiscordRichPresence() {
    rpcClient.on('ready', onRpcReady);
    rpcClient.login({
        clientId: APPLICATION_ID
    }).catch(console.error);
}

module.exports = { initDiscordRichPresence }