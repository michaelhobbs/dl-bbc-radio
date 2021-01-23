'''
Gerneric validation handler. Checks:
- new native message is a known command type
- the required args are present and match the regex
'''

import utils.messages as msg
from utils.config import COMMAND_MAP
import re

def _validate_args(message, command):
    '''
    Verifies for a given command that all its required args are present and are in the correct format.
    Pattern matching is also critical to prevent illegitimate calls from a compromised JS-side of the extension from running arbitrary commands.  
    '''
    if 'args' not in command:
        return True
    else:
        args_valid = True
        for arg in command['args']:
            args_valid = args_valid and arg in message and re.match(command['args'][arg], str(message[arg]))
        return args_valid

# Validate message matches application's interface
def validate_message(message):
    isValid = 'cmd' in message and message['cmd'] in COMMAND_MAP and _validate_args(message, COMMAND_MAP[message['cmd']])
    if not isValid:    
        msg.send_message({'msgType': 'log', 'msg': "Error: invalid command"})
        msg.send_message({'msgType': 'result', 'success': False})
    return isValid