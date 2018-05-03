from bottle import route, run, template, response
import Queue
import os
import json
import requests

nodejsServerIp = None
ipQ = Queue.Queue() # FIFO queue to store the receiver IP addresses
qForShutoff = Queue.Queue()

@route('/')
def index():
	response.body = "<h1>Nothing to see here</h1>"
	response.status = 404
	return response

@route('/receiver/post/<ip>')
# sets the IP of the receiver
def setReceiverIp(ip):
    global ipQ
    ipQ.put(ip)
    qForShutoff.put(ip)
    response.body = "IP Added"
    response.status = 200
    return response

@route('/receiver/get')
# returns the IP of the Node.js server
def getIpForReceiver():
	global nodejsServerIp
	if nodejsServerIp is not None:
		response.body = nodejsServerIp
		response.status = 200
		return nodejsServerIp
	else:
		response.body = "IP not there"
		response.status = 406 # HTTP Code "Not Acceptable"
		return response

@route('/server/post/<ip>')
# set the server IP
def setServerIp(ip):
	global nodejsServerIp
	nodejsServerIp = ip
	response.body = "IP set"
	response.status = 200
	return response

@route('/server/clear')
def clearIp():
	global nodejsServerIp
	nodejsServerIp = None # clear the IP

	# send a stop event to each receiver
	while not ipQ.empty(): # empty the queue once the receiver IPs have been requested
		elem = qForShutoff.get()
		requests.post('http://'+elem, data={'event': 'stop'})

	response.body = "Server IP cleared"
	response.status = 200
	return response
	
@route('/server/get')
# get the next receiver IP
def getReceiverIp():
	global ipQ
	if not ipQ.empty():
		listOfIps = list(ipQ.queue)
		jsonList = json.dumps(listOfIps)
		response.body = jsonList # Node.js server uses list of receiver IPs as JSON
		response.status = 200

		while not ipQ.empty(): # empty the queue once the receiver IPs have been requested
			ipQ.get()

		return response
	else:
		response.body = "IP list empty - no receivers"
		response.status = 406 # HTTP Code "Not Acceptable"
		return response

if os.environ.get('APP_LOCATION') == 'heroku':
    run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
else:
    run(host='localhost', port=8080, debug=True)