function sendMessage(pid) {
    message = {cmd: 'record', 'pid': pid};
    chrome.storage.local.get(['tasks'], function(result) {
        console.log('Value currently is ', result);

        let taskList = result.tasks ?? [];
        taskList.push({pid});
        chrome.storage.local.set({'tasks': taskList}, function() {
            console.log('Value is set');
        });
        chrome.storage.local.set({[pid]: {status: 'queued', isTask: true}}, function() {
            console.log('Value is set');
        });
    });
    chrome.runtime.sendMessage(message);
}

function createDlButton(pid) {
    const dlButton = document.createElement('button');
    dlButton.innerText = 'dl';
    dlButton.style.color = 'black';
    dlButton.style.backgroundColor = 'red';
    dlButton.style.top = 0;
    dlButton.style.right = 0;
    dlButton.style.zIndex = 100000;
    dlButton.style.fontSize = 'xxx-large';
    dlButton.style.position = 'absolute';
    dlButton.style.cursor = 'pointer';
    dlButton.classList.add("dl-button");

    dlButton.setAttribute('dl-bbc-pid', pid)

    dlButton.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        const thisPid = this.getAttribute('dl-bbc-pid');
        this.setAttribute('disabled', true);
        console.log('click dl for pid: ', thisPid);
        sendMessage(thisPid);
        return false;
    }, false);

    return dlButton;
}

const getDlButtonContainer = (linkTag) => linkTag.querySelector('.sc-o-island')?.parentElement || linkTag.querySelector('.sc-o-island') || linkTag;
  
const programLinks = document.querySelectorAll('a[href^="/sounds/play/"][data-bbc-result]');
const extendProgramLink = (programLink) => {
    const linkTag = programLink;
    const pid = linkTag.getAttribute('data-bbc-result');

    const dlButton = createDlButton(pid);

    const targetDlButtonContainer = getDlButtonContainer(linkTag);
    targetDlButtonContainer.prepend(dlButton);
    targetDlButtonContainer.style.position = 'relative';
};
for (var i = 0; i < programLinks.length; i++) {
    extendProgramLink(programLinks[i]);

    // MutationObserver to regenerate the download button on slow page load (un-cached first access or slow network).
    // The page source is replacing the program link DOM content after an async resource load has completed.
    var x = new MutationObserver(function (e) {
        if (e[0].removedNodes) {
            extendProgramLink(e[0].target.closest('a[href^="/sounds/play/"][data-bbc-result]'));
        }
        this.disconnect(); // disconnect MutationObsever after first trigger
    });
    const targetDlButtonContainer = getDlButtonContainer(programLinks[i]);
    x.observe(targetDlButtonContainer, { childList: true });
}

const programUrlRegExp = RegExp('/sounds/play/[a-zA-Z0-9]{8}');
if (programUrlRegExp.test(window.location.pathname)) {
    const pid = window.location.pathname.replace('/sounds/play/', '');

    const dlButton = createDlButton(pid);

    const playerContainerTag = document.querySelector('.play-c-herospace-container');
    playerContainerTag?.prepend(dlButton);
    playerContainerTag.style.position = 'relative';

    // TODO: refactor MutationObserver
    // MutationObserver to regenerate the download button on slow page load (un-cached first access or slow network).
    // The page source is replacing the program link DOM content after an async resource load has completed.
    var x = new MutationObserver(function (e) {
        if (e[0].removedNodes) {
            
        const pid = window.location.pathname.replace('/sounds/play/', '');

        const dlButton = createDlButton(pid);

        const playerContainerTag = document.querySelector('.play-c-herospace-container');
        playerContainerTag?.prepend(dlButton);
        playerContainerTag.style.position = 'relative';
        }
        this.disconnect(); // disconnect MutationObsever after first trigger
    });
    const targetDlButtonContainer = playerContainerTag;
    x.observe(targetDlButtonContainer, { childList: true });
}
