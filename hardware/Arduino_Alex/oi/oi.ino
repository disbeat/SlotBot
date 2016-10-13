
const byte LAP_interrupt_pin = 3;
const byte OoT_interrupt_pin = 7;

void setup() {
    // initialize serial:
  Serial.begin(9600);
   while (!Serial) ;
  pinMode(LAP_interrupt_pin, INPUT_PULLUP);
  pinMode(OoT_interrupt_pin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(LAP_interrupt_pin), LAP_interrupt, FALLING);
  attachInterrupt(digitalPinToInterrupt(OoT_interrupt_pin), OoT_interrupt, FALLING);
}

void loop() {
 
}

void LAP_interrupt() {
   Serial.write('l');
}

void OoT_interrupt() {
  Serial.write('o');
}
