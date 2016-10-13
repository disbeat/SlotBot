import csv
import serial
ser = serial.Serial('COM6')  # open serial port
print(ser.name)         # check which port was really used
#ser.write(b'hello')     # write a string
#ser.close()             # close port

try :
    
        
    with open('values.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=';', quotechar='|')

        line = reader.next()
        print line
        

    ser.write(chr(111))#enter receive mode
    for n in line:
        print int(n), chr(int(n))
        ser.write(chr(int(n)))

    #ser.write(chr(111))#stop receive mode
    ser.write(chr(113))#start receive mode



    while True:
        print ser.readline().strip()
except Exception as e:
    print e
finally:
    ser.close()             # close port
    print "closed"
   

