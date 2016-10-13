from tornado import websocket, web, ioloop
import json
import serial, threading
import csv
import serial

ser = serial.Serial('COM6')  # open serial port
print(ser.name)         # check which port was really used

stopped = False


try :
    with open('values.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=';', quotechar='|')
        line = reader.next()

    ser.write(chr(111))#enter receive mode
    for n in line:
        print int(n), chr(int(n))
        ser.write(chr(int(n)))

    ser.write(chr(113))#start receive mode
except Exception as e:
    print e

cl = []
commands = {'c': {'command':'countdown'}, 's': {'command':'start'}, 'x': {'command':'stop'}, 'l':{'command':'lap', 'player':'human'}, 'r':{'command':'lap', 'player':'bot'}}


class IndexHandler(web.RequestHandler):
    def get(self):
        self.render("index.html")

class StopHandler(web.RequestHandler):
    def get(self):
        stopped = True
        exit()

class SocketHandler(websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        if self not in cl:
            cl.append(self)

    def on_close(self):
        if self in cl:
            cl.remove(self)


app = web.Application([
    (r'/', IndexHandler),
    (r'/stop', StopHandler),
    (r'/ws', SocketHandler),
    (r'/(.*)', web.StaticFileHandler, {'path': './'}),
])



def slot_track_communicator():
    global stopped
    try:

        while not stopped:
            line = ser.readline()
            print 'read from slot_track: '+line
            parts = line.split(',')
            
            # process command
            command = commands[parts[0]]
            command['time'] = int(parts[1][:-1])

            # send to client(s)
            for client in cl:
                client.write_message(json.dumps(command))

            print 'sent to clients: ' + str(command)

    except Exception as e:
        print 'Exception: ', e
    finally:
        if ser:
            ser.close()
            print 'serial port close'


if __name__ == '__main__':
    # start communicator with arduino
    slot_track_communicator_thread = threading.Thread(target=slot_track_communicator)
    slot_track_communicator_thread.start()

    app.listen(8891)
    ioloop.IOLoop.instance().start()

