'''
Interface between native messages and get_iplayer and other system commands
'''
import subprocess
import utils.messages as msg

DL_BBC_RADIO_PRESET = 'dl-bbc-radio'

class RecordingMessageHandler:
    '''
    Converts output from the get_iplayer recording command to a status update object for the frontend.
    '''

    def __init__(self, pid):
        self.pid = pid
 
    def handleMessage(self, output):
        if 'INFO: Using user options preset \'dl-bbc-radio\'' in output:
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'starting'})
        if 'INFO: Downloading radio:' in output:
            pidIdx = output.find('(' + str(self.pid) + ')')
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'downloadStarting', 'pName': output[26:pidIdx], 'progress': 0})
        if '% of ~' in output:
            progress = output.split('%')[0]
            eta = output.split('ETA: ')[1].split(' (')[0]
            size = output.split('~')[1].split(' MB')[0]
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'downloading', 'progress': progress, 'size': size, 'eta': eta})
        if 'INFO: Downloaded:' in output:
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'downloaded'})
        if 'INFO: Converting' in output:
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'converting'})
        if 'INFO: Tagging' in output:
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'tagging'})
        if 'dl-bbc-radio SUCCESS' in output:
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'success'})
        if 'dl-bbc-radio FAIL' in output:
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'fail'})
        if ' use --force to override' in output:
            msg.send_message({'msgType': 'recordingStatus', 'pid': self.pid, 'status': 'alreadyInHistory'})



def _send_process_messages(process, handleMessage = None):
    '''
    Sends process's stdout to extension
    '''
    while True:
        output = process.stdout.readline().strip()
        msg.send_message({'msgType': 'log', 'msg': output})
        if handleMessage:
            handleMessage(output)

        return_code = process.poll()
        if return_code is not None:
            for output in process.stdout.readlines():
                msg.send_message({'msgType': 'log', 'msg': output.strip()})
                if handleMessage:
                    handleMessage(output.strip())
            if handleMessage:
                handleMessage('dl-bbc-radio ' + ('FAIL', 'SUCCESS')[return_code == 0])
            msg.send_message({'msgType': 'result', 'success': return_code == 0})
            break

def record_pid(message):
    '''
    Triggers a recording for a given pid.
    '''
    pid = message['pid']
    msgHandler = RecordingMessageHandler(pid)
    _send_process_messages(subprocess.Popen(['get_iplayer', '--preset=' + DL_BBC_RADIO_PRESET, '--pid=' + pid, '--logprogress'],
        bufsize=1,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True),
        msgHandler.handleMessage)

def get_conf(message):
    '''
    get_iplayer --preset=my_preset --prefs-show
    '''
    _send_process_messages(subprocess.Popen(['get_iplayer', '--preset=' + DL_BBC_RADIO_PRESET, '--prefs-show'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True))

def _addConf(conf):
    '''
    input:
        conf: formatted args string

    Passes messsage to:
        get_iplayer --preset=my_preset --prefs-add ...
    '''
    addCmd = ['get_iplayer', '--preset=' + DL_BBC_RADIO_PRESET, '--prefs-add']
    addCmd.extend(conf)
    _send_process_messages(subprocess.Popen(addCmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True))

def _delConf(conf):
    '''
    input:
        conf: formatted args string

    Passes formatted args string to:
        get_iplayer --preset=my_preset --prefs-del ...
    '''
    delCmd = ['get_iplayer', '--preset=' + DL_BBC_RADIO_PRESET, '--prefs-del']
    delCmd.extend(conf)
    _send_process_messages(subprocess.Popen(delCmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True))
    
def set_conf(message):
    '''
    Splits args to conf to be deleted or to be added/updated.

    Available args:
        - output
        - subdir
        - subdir-format
    Calls _addConf and _delConf.
    '''
    output = message['output']
    subdir = message['subdir']
    subdirFormat = message['subdirFormat']
    addMessage = []
    delMessage = []
    if output == '':
        delMessage.append('--output=X')
    else:
        addMessage.append('--output=' + output)
    if subdir == False:
        delMessage.append('--subdir')
    else:
        addMessage.append('--subdir')
    if subdirFormat == '':
        delMessage.append('--subdir-format=X')
    else:
        addMessage.append('--subdir-format=' + subdirFormat)
    _addConf(addMessage)
    _delConf(delMessage)

def system_check(message):
    '''
    Verify system has required commands installed:
        - get_iplayer in installed on the system
        - browser is not installed as a snap (snap app confinement means we cannot call get_iplayer)
    '''
    # TODO: ffmpeg, AtomicParsley
    hasGetIplayer = subprocess.run(["get_iplayer", "-V"])
    isSnap = subprocess.run(["pwd"], stdout=subprocess.PIPE) # TODO: windows variant? conditionally run if OS is linux?
    systemStatus = {'msgType': 'systemCheck', 'hasGetIplayer': hasGetIplayer.returncode == 0, 'isSnap': '/snap/' in str(isSnap.stdout)}
    msg.send_message(systemStatus)
