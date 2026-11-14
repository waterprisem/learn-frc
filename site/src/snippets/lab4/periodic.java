@Override
public void periodic() {
  double velocityRPS = getFlywheelVelocityRPS();
  flywheelAtVelocity = flywheelPID.atSetpoint();

  velocityPublisher.accept(velocityRPS);
  targetPublisher.accept(flywheelPID.getSetpoint());
  errorPublisher.accept(flywheelPID.getError());
  outputVoltagePublisher.accept(commandedVoltage);
  atTargetPublisher.accept(flywheelAtVelocity);
}
