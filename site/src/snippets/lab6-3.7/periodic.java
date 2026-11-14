@Override
public void periodic() {
  elevatorAtHeight = elevatorPID.atGoal();

  heightPublisher.accept(getElevatorHeightMeters());
  targetPublisher.accept(elevatorPID.getGoal().position);
  profiledPositionPublisher.accept(elevatorPID.getSetpoint().position);
  profiledVelocityPublisher.accept(elevatorPID.getSetpoint().velocity);
  errorPublisher.accept(elevatorPID.getPositionError());
  outputVoltagePublisher.accept(commandedVoltage);
  atTargetPublisher.accept(elevatorAtHeight);
}
