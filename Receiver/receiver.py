import json
import soundcloud
import vlc
import time
import pika
import netifaces
import sys
import platform
import requests
import socket
import time
import json
import os

ip = None
machineIp = None # local network machine IP address

class AudioPlayer:
    instance = vlc.Instance()
    player = instance.media_player_new()
    trackData = None
    soundcloud_client_id = os.environ['SOUNDCLOUD-CLIENT-ID']
    source = None
    newUrl = None # stores the currently playing URL
    previewUrl = None


    def __init__(self):
        # just in case
        return

    def play(self, event, trackData, previewUrl, source):
        self.trackData = trackData
        self.source = source
        self.previewUrl = previewUrl

        if event == 'RESTART': # if restart event, call restart functionality
            self.__restart()
            return

        self.__play() # if not a restart, call play functionality

    def pause(self, event, trackData, previewUrl, source):
        self.trackData = trackData
        self.source = source
        self.previewUrl = previewUrl
        self.__pause()

    def restart():
        self.trackData = trackData
        self.source = source
        self.previewUrl = previewUrl
        self.__restart();

    def stop(self, event, trackData, previewUrl, source): # stops VLC media player
        self.player.stop()

    def __restart(self):
        if self.source == 'soundcloud':
            client = soundcloud.Client(client_id=self.soundcloud_client_id)
            track = client.get(self.trackData)
            urlLinkNew = track.stream_url
            stream_url_general = client.get(track.stream_url, allow_redirects=False)
            urlLink = stream_url_general.location
        elif self.source == 'spotify':
            if self.previewUrl == None:
                return
            urlLinkNew = self.trackData
            urlLink = self.previewUrl
        else:
            print "Invalid source"
            return

        media = self.instance.media_new(urlLink)
        self.player.set_media(media)
        self.newUrl = urlLinkNew
        self.player.play()

    def __play(self):
        if (self.trackData == ''): # do not play anything
            self.stop()
            return

        urlLinkNew = None # for comparison against currently playing audio during play/pause events
        urlLink = None # actual link to play song
        if self.source == 'soundcloud':
            client = soundcloud.Client(client_id=self.soundcloud_client_id)
            track = client.get(self.trackData)
            urlLinkNew = track.stream_url
            stream_url_general = client.get(track.stream_url, allow_redirects=False)
            urlLink = stream_url_general.location
        elif self.source == 'spotify':
            if self.previewUrl == None:
                return
            urlLinkNew = self.trackData
            urlLink = self.previewUrl
        else:
            print "Invalid source"
            return

        if self.newUrl == None or self.newUrl != urlLinkNew: # if this is a new track, then insert media instance
            media = self.instance.media_new(urlLink)
            self.player.set_media(media)
            self.newUrl = urlLinkNew
        self.player.play()

    def __pause(self):
        self.player.set_pause(1) # pauses if non-zero

class Receiver:
    player = None
    trackData = None
    previewUrl = None
    event = None
    source = None

    def __init__(self):
        self.__getAudioPlayerInstance()
        return

    def __getAudioPlayerInstance():
        if self.player == None:
            self.player = AudioPlayer()    

    def activate_receiver(self, host=os.environ['DEFAULT-HOST']):
        # do additional setup here
        self.__waitForEvent(host);

    def __waitForEvent(self, host):
        global machineIp

        if machineIp == host:
            print "Setting to localhost"
            host = 'localhost'

        connection = pika.BlockingConnection(pika.ConnectionParameters(host=host, credentials=pika.credentials.PlainCredentials(os.environ['PIKA-USER'], os.environ['PIKA-PASS'], erase_on_connect=False)))
        channel = connection.channel()

        channel.exchange_declare(exchange='event_stream', # events from various clients for this receiver
                                 exchange_type='direct')

        result = channel.queue_declare(exclusive=True)
        queue_name = result.method.queue

        channel.queue_bind(exchange='event_stream',
                           queue=queue_name,
                           routing_key=str(machineIp)) # only for this room number, send to this receiver from the exchange

        print(' [*] Waiting for logs. To exit press CTRL+C')

        channel.basic_consume(self.__callback,
                              queue=queue_name,
                              no_ack=True)

        channel.start_consuming() # NOTE: TTL (time-to-live) = 120 seconds - if no request in that time, will shutdown automatically

    def __callback(self, ch, method, properties, body):
        jsonData = json.loads(self.__getJsonData(body))
        print(" [x] %r:%r" % (method.routing_key, body))
        self.__startAudioProcess(jsonData)   

    def __getJsonData(self, str):
        stringCopy = str
        splitArray = stringCopy.split(' ')

        secondString = splitArray[len(splitArray)-1]
        anotherSplit = secondString.split('\n')
        return anotherSplit[len(anotherSplit)-1]

    def __startAudioProcess(self, content):
        if 'track_id' in content.keys():
            self.trackData = content['track_id'] # track ID is the track to be played
        else:
            self.trackData = '' # pause event - empty track data

        if 'preview_url' in content.keys():
            self.previewUrl = content['preview_url']

        if 'event' in content.keys():
            self.event = content['event'] # event can be PLAY, PAUSE, SEEK, VOLUME_ADJUST etc.
        else:
            return "Event not provided!"

        if 'source' in content.keys():
            self.source = content['source'] # source can be SoundCloud, spotify, etc.
        else:
            self.source = ''    

        localEvent = self.event.upper()
        if localEvent == 'PLAY' or localEvent == 'RESTART':
            self.player.play(localEvent, self.trackData, self.previewUrl, self.source)
        elif localEvent == 'PAUSE':
            self.player.pause(localEvent, self.trackData, self.previewUrl, self.source)
        elif localEvent == 'STOP':
            self.player.stop(localEvent, self.trackData, self.previewUrl, self.source)

# ===============================================================
# returns IP address
# OS independent
def getIp():
    currMachineIp = ''
    os = platform.system().lower()

    if (os == "linux"):
        addresses = netifaces.ifaddresses('wlp2s0') # provides the IP information we need
        currMachineIp = addresses[netifaces.AF_INET][0]['addr'] # gives our local network IP address of the current machine
    elif (os == "darwin"):
        addresses = netifaces.ifaddresses('en0')
        currMachineIp = addresses[netifaces.AF_INET][0]['addr']
    elif (os == "windows"):
        return str(socket.gethostbyname(socket.gethostname()))
    else:
        print("OS %s network interface not supported yet!", os)

    return currMachineIp

def startup(machineIp):
    global ip
    serviceUrl = os.environ['HEROKU-SERVICE'] # python server deployed to communicate IP addresses

    while True: # poll for a server IP to be entered
        result = requests.get(serviceUrl)
        code = result.status_code
        if code != 200:
            time.sleep(1)
        else:
            ip = result.text
            break

    print "Acquired Node.js Server IP: "+ip
    print "Sending Receiver IP " + machineIp + " to Node.js server"
    serverAddress = "http://"+ip+":"+os.environ['SERVER-PORT']+"/"+os.environ['SERVER-ENDPOINT']
    data = [("address", machineIp)] # change IP address to variable
    result = requests.post(serverAddress, data=data)
    print result.text

# ===============================================================
print ("Starting Audio Receiver")
machineIp = getIp()
startup(machineIp) # retrieves Node.js server IP address

if len(sys.argv) > 2:
    ip = sys.argv[2]

s = Receiver()  # construct server object
s.activate_receiver(ip) # aquire the socket