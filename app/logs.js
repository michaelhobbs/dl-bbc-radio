function appendMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.innerText = text;
  document.getElementById('logs').appendChild(messageDiv);
}

var port = chrome.runtime.connect({name: "logsPort"});
port.onMessage.addListener(function(msg) {
    appendMessage(msg);
});

const clearLogs = () => {
  document.getElementById('logs').innerText = '';
};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('clear-logs-button').addEventListener('click', clearLogs);
});