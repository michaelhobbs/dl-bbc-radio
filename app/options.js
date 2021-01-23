var port = null;

const showSuccess = () => {
  document.getElementById("success").style.display = "block";
  setTimeout(
    () => (document.getElementById("success").style.display = "none"),
    1000
  );
};
const showFail = () => {
  document.getElementById("fail").style.display = "block";
  setTimeout(
    () => (document.getElementById("fail").style.display = "none"),
    1000
  );
};

const handleConfMessage = (message) => {
  try {
    if (typeof message == "object" && message.msgType === "result") {
      message.success ? showSuccess() : showFail();
    }
    if (typeof message == "object" && message.msgType === "log") {
      const patterns = {
        output: "output = ",
        subdir: "subdir = ",
        subdirFormat: "subdirformat = ",
      };
      const msg = message.msg;
      if (msg.indexOf(patterns.output) >= 0) {
        const outputResponse = msg.substring(
          msg.indexOf(patterns.output) + patterns.output.length
        );
        document.getElementById("output").value = outputResponse;
      }
      if (msg.indexOf(patterns.subdir) >= 0) {
        const outputResponse = msg.substring(
          msg.indexOf(patterns.subdir) + patterns.subdir.length
        );
        document.getElementById("subdir").checked = outputResponse === "1";
      }
      if (msg.indexOf(patterns.subdirFormat) >= 0) {
        const outputResponse = msg.substring(
          msg.indexOf(patterns.subdirFormat) + patterns.subdirFormat.length
        );
        document.getElementById("subdir-format").value = outputResponse;
      }
    }
  } catch (error) {
    console.log("background message not an object", error);
  }
};

function appendMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.innerText = text;
  document.getElementById("response").appendChild(messageDiv);
}

function sendNativeMessage(message) {
  port.postMessage(message);
}

function onNativeMessage(message) {
  console.log("Received message: " + JSON.stringify(message));
  appendMessage(message.msg ?? '');
  handleConfMessage(message);
}

function onDisconnected() {
  appendMessage("Failed to connect: " + chrome.runtime.lastError.message);
  port = null;
}

function connect() {
  var hostName = "dl.bbc.radio";
  port = chrome.runtime.connectNative(hostName);
  port.onMessage.addListener(onNativeMessage);
  port.onDisconnect.addListener(onDisconnected);
}

const getConfig = () => {
  document.getElementById("response").innerHTML = "";
  document.getElementById("output").value = "";
  document.getElementById("subdir").checked = false;
  document.getElementById("subdir-format").value = "";
  if (!port) {
    console.log("connecting.... empty port");
    connect();
  }
  const nativeMessage = { cmd: "getConf" };
  sendNativeMessage(nativeMessage);
};

const setConfig = () => {
  if (!port) {
    console.log("connecting.... empty port");
    connect();
  }
  const output = document.getElementById("output").value;
  const subdir = document.getElementById("subdir").checked;
  const subdirFormat = document.getElementById("subdir-format").value;
  const nativeMessage = { cmd: "setConf", output, subdir, subdirFormat };
  console.log("sending native message: ", nativeMessage);
  sendNativeMessage(nativeMessage);
};

const toggleLogs = () => {
  const button = document.getElementById("toggle-logs-button");
  const response = document.getElementById("response");
  const preStateHidden = button.getAttribute("data-visibility") !== "visible";
  if (preStateHidden) {
    response.style.display = "block";
    button.innerText = "Hide logs";
    button.setAttribute("data-visibility", "visible");
  } else {
    response.style.display = "none";
    button.innerText = "Show logs";
    button.setAttribute("data-visibility", "hidden");
  }
};
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("get-config-button")
    .addEventListener("click", getConfig);
  document
    .getElementById("save-config-button")
    .addEventListener("click", setConfig);
  document
    .getElementById("toggle-logs-button")
    .addEventListener("click", toggleLogs);
  getConfig();
});
