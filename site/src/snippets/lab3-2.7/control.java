public void setFlywheelVoltage(double volts) {
  flywheelMotor.setControl(new VoltageOut(volts));
}
