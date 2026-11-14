public double closedLoopCalculate(double targetAngleDegrees) {
  double clampedTarget =
      MathUtil.clamp(
          targetAngleDegrees,
          ArmConstants.MIN_ANGLE_DEGREES,
          ArmConstants.MAX_ANGLE_DEGREES);
  double pidOutput = armPID.calculate(getCurrentAngleDegrees(), clampedTarget);
  TrapezoidProfile.State setpoint = armPID.getSetpoint();
  double feedforwardOutput =
      armFF.calculate(
          Math.toRadians(setpoint.position),
          Math.toRadians(setpoint.velocity));
  return pidOutput + feedforwardOutput;
}
