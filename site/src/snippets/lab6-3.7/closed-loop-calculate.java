public double closedLoopCalculate(double targetHeightMeters) {
  double clampedTarget =
      MathUtil.clamp(
          targetHeightMeters,
          ElevatorConstants.MIN_HEIGHT_METERS,
          ElevatorConstants.MAX_HEIGHT_METERS);
  double pidOutput = elevatorPID.calculate(getElevatorHeightMeters(), clampedTarget);
  double feedforwardOutput = elevatorFF.calculate(elevatorPID.getSetpoint().velocity);
  return pidOutput + feedforwardOutput;
}

public void resetProfiledPIDController() {
  elevatorPID.reset(getElevatorHeightMeters(), getElevatorVelocityMetersPerSecond());
}
