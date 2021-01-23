'''
Configuration of available commands.

Each command has a name, command handler function, optional list of args with optional regex validation rules.
'''

from utils.commands import *

COMMAND_MAP = {
    'record': {'func': record_pid, 'args': {'pid': r'[a-zA-Z0-9]{8}'}},
    'getConf': {'func': get_conf},
    'setConf': {'func': set_conf, 'args': {'output': r'.*', 'subdir': r'.*', 'subdirFormat': r'.*'}}, # TODO: validation of args
    'systemCheck': {'func': system_check}
}