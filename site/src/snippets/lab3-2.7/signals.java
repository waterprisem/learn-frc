public double getFlywheelVelocityRPS() {
  return flywheelMotor.getVelocity().refresh().getValueAsDouble();
}

public double getFlywheelPositionRotations() {
  return flywheelMotor.getPosition().refresh().getValueAsDouble();
}
