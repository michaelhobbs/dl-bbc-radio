var port = null;
let logsPort = null;
let sysStatus = null;

function onDisconnected() {
    port = null;
    chrome.browserAction.setBadgeText({ text: 'off' });
}

const handleRecordingStatusUpdate = (message) => {
    const pid = message.pid;

    chrome.storage.local.get([pid], function (result) {
        const task = result[pid];
        const status = message.status;
        task.status = status;
        if (status === 'downloadStarting') {
            task.pName = message.pName;
            task.progress = message.progress;
        }
        if (status === 'downloading') {
            task.progress = message.progress;
            task.size = message.size;
            task.eta = message.eta;
        }
        if (status === 'downloaded') {
            task.progress = '99.99';
        }
        if (status === 'success') {
            task.progress = '100';
        }
        chrome.storage.local.set({ [pid]: task });
    });
};

function onNativeMessage(message) {
    console.log('background native message: ', message);
    if (logsPort && typeof message == 'object' && message.msgType === 'log') {
        logsPort.postMessage(message.msg);
    }
    try {
        if (message.msgType === 'systemCheck') {
            const hasGetIplayer = message.hasGetIplayer;
            const isSnap = message.isSnap;
            sysStatus = { hasGetIplayer, isSnap };
            // TODO: store system status in local storage and check it when opening any page of the extension and display warning if system not compatible with extension
            // TODO: contentScript shouldn't enhance BBC sounds pages if system not compatible
            // !hasGetIplayer && alert('get_iplayer was not detected on your system. dl-bbc-radio requires it in order to function. Get it from: https://github.com/get-iplayer/get_iplayer/wiki/installation');
            // isSnap && alert('A snap based browser was detected. dl-bbc-radio does not support browsers installed as snaps. This is due to snap app confinement. See more info at: https://forum.snapcraft.io/t/chrome-gnome-shell-does-not-work-with-chromium-snap/3377/2 and https://bugs.launchpad.net/ubuntu/+source/chromium-browser/+bug/1741074');
            // port.disconnect();
            // onDisconnected();
        }
        if (message.msgType === 'recordingStatus') {
            handleRecordingStatusUpdate(message);
        }
    } catch (error) {
        console.log('background message not an object', error);
    }
}

function connect() {
    var hostName = 'dl.bbc.radio';
    port = chrome.runtime.connectNative(hostName);
    port.onDisconnect.addListener(onDisconnected);
    port.onMessage.addListener(onNativeMessage);
    chrome.browserAction.setBadgeText({ text: 'on' });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!port) {
        console.log('connecting.... empty port');
        connect();
    }
    console.log('requesting dl for....', request);
    port.postMessage(request);
});

// Logs
chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name == 'logsPort');
    logsPort = port;
    logsPort.onDisconnect.addListener(() => {
        logsPort = null;
    });
});

// System check on installtion
chrome.runtime.onInstalled.addListener(function () {
    if (!port) {
        console.log('connecting.... empty port');
        connect();
    }
    console.log('system check starting....');
    port.postMessage({ cmd: 'systemCheck' });
    chrome.storage.local.clear(function () {
        console.log('cleared storage');
    });
});
chrome.runtime.onStartup.addListener(() => {
    console.log('chrome started');
    chrome.storage.local.clear(function () {
        console.log('cleared storage');
    });
});
chrome.runtime.onSuspend.addListener(() => {
    console.log('chrome stopped');
    chrome.storage.local.clear(function () {
        console.log('cleared storage');
    });
});
