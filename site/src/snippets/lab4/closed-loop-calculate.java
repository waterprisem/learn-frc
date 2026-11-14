public double closedLoopCalculate(double targetRPS) {
  return flywheelPID.calculate(getFlywheelVelocityRPS(), targetRPS)
      + flywheelFF.calculate(targetRPS);
}
