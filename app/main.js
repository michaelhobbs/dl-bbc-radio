var port = null;

function appendMessage(text) {
    document.getElementById('response').innerHTML += '<p>' + text + '</p>';
}

function updateUiState() {
    if (port) {
        document.getElementById('connect-button').style.display = 'none';
        document.getElementById('input-text').style.display = 'block';
        document.getElementById('send-message-button').style.display = 'block';
    } else {
        document.getElementById('connect-button').style.display = 'block';
        document.getElementById('input-text').style.display = 'none';
        document.getElementById('send-message-button').style.display = 'none';
    }
}

function sendNativeMessage() {
    message = { pid: document.getElementById('input-text').value };
    port.postMessage(message);
    appendMessage('Sent message: <b>' + JSON.stringify(message) + '</b>');
}

function onNativeMessage(message) {
    appendMessage('Received message: <b>' + JSON.stringify(message) + '</b>');
}

function onDisconnected() {
    appendMessage('Failed to connect: ' + chrome.runtime.lastError.message);
    port = null;
    updateUiState();
}

function connect() {
    var hostName = 'dl.bbc.radio';
    appendMessage(
        'Connecting to native messaging host <b>' + hostName + '</b>'
    );
    port = chrome.runtime.connectNative(hostName);
    port.onMessage.addListener(onNativeMessage);
    port.onDisconnect.addListener(onDisconnected);
    updateUiState();
}

document.addEventListener('DOMContentLoaded', function () {
    document
        .getElementById('connect-button')
        .addEventListener('click', connect);
    document
        .getElementById('send-message-button')
        .addEventListener('click', sendNativeMessage);
    updateUiState();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (port) {
        port.postMessage(request);
    } else {
        connect();
        port.postMessage(request);
    }
});
