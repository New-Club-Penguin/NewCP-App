const RPC = require('discord-rpc');
const rpcClient = new RPC.Client({ transport: 'ipc' });
const APPLICATION_ID = '793878460157788220';
RPC.register(APPLICATION_ID);

let isConnected = false;

function onRpcReady() {
    rpcClient.setActivity({
        state: "Waddling",
        details: "New Club Penguin",
        startTimestamp: Date.now(),
        largeImageKey: "ncpapp",
        instance: true,
    });
}

const initDiscordRichPresence = async () => {
    rpcClient.on('ready', onRpcReady);
    try {
        await rpcClient.login({
            clientId: APPLICATION_ID
        });
    } catch (error) {
        console.error('Error connecting to Discord RPC:', error);
        return;
    }
    isConnected = true;
}

async function cleanupDiscord() {
    if (isConnected && rpcClient) {
        try {
            await rpcClient.clearActivity();
            await rpcClient.destroy();
        } catch (error) {
            console.error('Error cleaning up Discord RPC:', error);
        }
    }
}

module.exports = { initDiscordRichPresence, cleanupDiscord }