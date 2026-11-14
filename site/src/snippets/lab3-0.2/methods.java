public void setFlywheelVoltage(double volts) {
  flywheelMotor.setControl(new VoltageOut(volts));
}

public double getFlywheelVelocityRPS() {
  return flywheelMotor.getVelocity().refresh().getValueAsDouble();
}
