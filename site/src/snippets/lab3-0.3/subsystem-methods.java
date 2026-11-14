public void setFlywheelVoltage(double volts) {
  flywheelMotor.setControl(new VoltageOut(volts));
}

public double getFlywheelVelocityRPS() {
  return flywheelMotor.getVelocity().refresh().getValueAsDouble();
}

public double getFlywheelPositionRotations() {
  return flywheelMotor.getPosition().refresh().getValueAsDouble();
}

@Override
public void periodic() {
  velocityPublisher.accept(getFlywheelVelocityRPS());
  positionPublisher.accept(getFlywheelPositionRotations());
}
