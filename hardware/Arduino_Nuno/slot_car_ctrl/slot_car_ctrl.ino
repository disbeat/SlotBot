// SLOT CAR controller

// pins for the cars. (PWM)
const int mitsubishiPIN = 5;
const int subaruPIN = 6;
// pins for the lap counters (INT) // Micro, Leonardo, other 32u4-based  0, 1, 2, 3, 7
const int LAP_INT_PIN_1 = 3;
const int LAP_INT_PIN_2 = 7;
const int LAP_START_BOOST = 2;
 
// start button
const int START_PIN = 4;
int readout=0;
short speeds[2][400];//animation array
volatile long time_track_R = 0;
volatile long time_track_L = 0;

short start_stop = 0; // if 1 enable race if 0 stop race
short buff=-1;
short detach_int1=0;
short detach_int2=0;
short detach_cycle1 = 0;
short detach_cycle2 = 0;
short aux=0;
short idx=0;
short inc = 0;

short first_lap = 1;

byte mode = 0;//0-RACE
              //1-accept animation for car 1
              //2-accept animation for car 2
unsigned long tim_now;
unsigned long tim_prev;
unsigned long tim_now_track1;
unsigned long tim_prev_track1;
unsigned long tim_now_deb2;
unsigned long tim_prev_deb2;

void setup() {
  // initialize serial:
  Serial.begin(9600);
  pinMode(mitsubishiPIN, OUTPUT);
  pinMode(subaruPIN, OUTPUT);
  pinMode(LAP_INT_PIN_1, INPUT_PULLUP);
  pinMode(LAP_INT_PIN_2, INPUT_PULLUP);
  pinMode(START_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(LAP_INT_PIN_1), LAP1_interrupt, FALLING);
  attachInterrupt(digitalPinToInterrupt(LAP_INT_PIN_2), LAP2_interrupt, FALLING);
  tim_prev = millis();
}

void loop() { 
  //an_rd();
  // if there's any serial available, read it:
  if(digitalRead(START_PIN)==0){
    if(start_stop == 0){
      start_stop= 1;
      Serial.print("c,");
      long start_time = millis();
      Serial.print(start_time,DEC);
      Serial.print("\n"); 
      delay(3000);
      start_time = millis();
      Serial.print("s,");
      Serial.print(start_time,DEC);
      Serial.print("\n");
      idx=0; 
      first_lap = 1;
      } 
    else if(start_stop == 1){ 
     start_stop = 0;
     idx=0;
     analogWrite(mitsubishiPIN, 0);
    Serial.print("x,");
    long stop_time = millis();
    Serial.print(stop_time,DEC);
    Serial.print("\n"); 
    delay(3000);  
    }}
  while (Serial.available() > 0) {
    //Serial.print("IN serial");
    buff = Serial.read(); 
    if (mode > 0) { // In mode 1 or 2 Reads serial buffer; if value is between 0 and 100 it is wrote in the table of the selected car
      StoreInTable(); 
    }
    // change mode 
        if (buff == 111){  //go into accept mode for car 1
          mode=1;
          //Serial.print("Mode 1: Data to car 1\n");
          ChangedMode();
        }else if (buff == 112){//go into accept mode for car 2
          //Serial.print("Mode 2: Data to car 2\n");
          mode=2;
          ChangedMode();
        }else if (buff == 113){
          //Serial.print("Mode 0:Race Mode\n");
          mode = 0;
          ChangedMode();
         }
    }

    

    if (mode == 0){ // RACE time!
      if ( start_stop==1){
        race();
      }
      }
    
  }
  
void StoreInTable(){
  //Serial.print("OK \n");
      if (inc>=400) buff=114;
      if (buff<=100) {
         aux = (254*buff)/100;   //0-100 to 0-255 (255 FORBIDDEN! ) 
        if (aux>255) aux=255 ;//255 means STOP!
        speeds[mode-1][inc] = aux;
        inc++;      
      }
      if (buff > 110 ){//go into  mode for car x
        if (mode > 0) {//storage operation done for either car, go into RACE mode
          //Serial.print("Done accepting values RACE\n");
          if (mode == 1){
              speeds[0][inc]=255;//stop signal
            }else if (mode == 2){
              speeds[1][inc]=255;//stop signal
            }
            mode=0;//back to rae mode
            
      } 

  }
        return;
}
void ChangedMode(){
  inc = 0;
  return;
  }

void race(){//race here
       tim_now = millis();
      
       if ((tim_now-tim_prev)> 100){
        //Serial.print("aqui");
        tim_prev = tim_now;
        if (detach_int1 >=1){
          if (detach_cycle1< 50){
            detach_cycle1++;
            }
            else{detach_cycle1=0;
            detach_int1 = 0;
            attachInterrupt(digitalPinToInterrupt(LAP_INT_PIN_1), LAP1_interrupt, FALLING);
              }
          }
          if (detach_int2 >=1){
          if (detach_cycle2< 50){
            detach_cycle2++;
            }
            else{detach_cycle2=0;
               Serial.write("r,");
     Serial.print(time_track_R,DEC);
   Serial.print("\n");
   detachInterrupt(digitalPinToInterrupt(LAP_INT_PIN_2));
            detach_int2 = 0;
            attachInterrupt(digitalPinToInterrupt(LAP_INT_PIN_2), LAP2_interrupt, FALLING);
              }
          }
        //Serial.print(speeds[0][idx],DEC);
        //Serial.print(",");
        //Serial.print(idx,DEC);
        //Serial.print("\n");
        if(speeds[0][idx]>=255){
          idx=0;
          mode=0; 
          return;
        }

        if (first_lap == 1){
          if (idx < LAP_START_BOOST){
            analogWrite(mitsubishiPIN, 254);
          } else {
            analogWrite(mitsubishiPIN, speeds[0][idx]);
            first_lap = 0;
          }
         
            
        } else {
          analogWrite(mitsubishiPIN, speeds[0][idx]);
        }
        
        idx++;
     }
     return;
  }

void LAP1_interrupt(){

   Serial.write("l,");
   time_track_L = millis();
   Serial.print(time_track_L,DEC);
   Serial.print("\n"); 
   detachInterrupt(digitalPinToInterrupt(LAP_INT_PIN_1));
   detach_int1 = 1;
}

void LAP2_interrupt(){
   idx = 0;
   detach_int2 = 1;
   time_track_R = millis();
}

//void an_rd(void){
//    delay(100);
//    readout=analogRead(ootPIN);
//    Serial.write(byte(readout >> 8));
//    Serial.write(byte(readout & 0xFF));
//    Serial.write('\n');
//  }
                      

