const addTask = (task, pid) => {
    console.log('generating html for result: ', task);
    const taskElem = document.createElement('div');
    taskElem.setAttribute('id', 'task-container-' + pid);

    const pidElem = document.createElement('div');
    pidElem.setAttribute('id', 'pid-' + pid);
    pidElem.innerText = pid + ': ' + task.status;

    const pNameElem = document.createElement('div');
    pNameElem.innerText = task.pName ?? '';
    pNameElem.setAttribute('id', 'pName-' + pid);

    const progressElem = document.createElement('div');
    progressElem.setAttribute('id', 'progress-' + pid);
    progressElem.innerText = (task.progress ?? 0) + '%';
    progressElem.style.textAlign = 'end';

    const progressBar = document.createElement('div');
    progressBar.setAttribute('id', 'progressGraph-' + pid);
    progressBar.style.height = '5px';
    progressBar.style.border = '1px solid black';
    const progressBarInner = document.createElement('div');
    progressBarInner.setAttribute('id', 'progressBar-' + pid);
    progressBarInner.style.height = '5px';
    progressBarInner.style.width = (task.progress ?? 0) + '%';
    progressBarInner.style.backgroundColor = 'black';
	progressBarInner.style.transition = 'width 0.5s';
    progressBar.appendChild(progressBarInner);

    taskElem.appendChild(pNameElem);
    taskElem.appendChild(pidElem);
    taskElem.appendChild(progressElem);
    taskElem.appendChild(progressBar);
    document.getElementById('tasks').appendChild(taskElem);
    const taskSeparator = document.createElement('hr');
    document.getElementById('tasks').appendChild(taskSeparator);
};

chrome.storage.local.get(['tasks'], function(result) {
    console.log('Value currently is ', result.tasks);
    const taskList = result.tasks ?? [];
    if (taskList.length === 0) {
        console.log('taskList is empty');
        document.getElementById('empty').style.display = 'block';
        return;
    }

    document.getElementById('empty').style.display = 'none';
    for (const taskIdx in taskList) {
        const task = taskList[taskIdx];
        console.log('generating html for task: ', task);
        chrome.storage.local.get([task.pid], function(result) {
            const taskData = result[task.pid];
            addTask(taskData, task.pid);
        });
    }
});

const updateTask = (oldValue, newValue, pid) => {
    console.log('updating task: ', {oldValue, newValue});
    if (!oldValue.pName && newValue.pName) {
        document.getElementById('pName-' + pid).innerText = newValue.pName;;
    }
    if (oldValue.progress && newValue.progress && oldValue.progress !== newValue.progress) {
        console.log('getting elem with id: progress-' + pid);
        document.getElementById('progress-' + pid).innerText = newValue.progress + '%';
        document.getElementById('progressBar-' + pid).style.width = newValue.progress + '%';
    }
    if (oldValue.status && newValue.status && oldValue.status !== newValue.status) {
        document.getElementById('pid-' + pid).innerText = pid + ': ' + newValue.status;
    }
};

const updateTaskList = (oldValue, newValue) => {
    console.log('updating task list: ', {oldValue, newValue});
    if (oldValue.length < newValue.length) {
        chrome.storage.local.get([newValue[newValue.length-1].pid], function(result) {
            const taskData = result[newValue[newValue.length-1].pid];
            addTask(taskData, newValue[newValue.length-1].pid);
        });
    }
    if (oldValue.length > newValue.length) {
        // TODO: find deleted task and remove its elem
    }
    if (newValue.length === 0) {
        document.getElementById('empty').style.display = 'block';
    }
};

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== 'local') {
        return;
    }
    for (var key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ', key, namespace);
        console.log('old: ', storageChange.oldValue);
        console.log('new: ', storageChange.newValue);
        if (storageChange.oldValue?.isTask) {
            updateTask(storageChange.oldValue, storageChange.newValue, key);
        }
        if (key === 'tasks') {
            updateTaskList(storageChange.oldValue, storageChange.newValue);
        }
    }
});