 int senRead=0;                 //Readings from sensor to analog pin 0  
 void setup()    
 {  
  Serial.begin(9600);          //setting serial monitor at a default baund rate of 9600  
 }  
 void loop()  
 {  
  int sum =0;
  for(int i=1;i<=4;i++){
     int val=analogRead(senRead);  //variable to store values from the photodiode
     sum = sum + val;
     delay(50);
    }
    sum = sum<<2; 
  Serial.println(sum);          // prints the values from the sensor in serial monitor  
   delay(100);  
  }  
