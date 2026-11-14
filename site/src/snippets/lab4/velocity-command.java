@Override
public void initialize() {
  flywheelSubsystem.resetPIDController();
}

@Override
public void execute() {
  flywheelSubsystem.setFlywheelVoltage(
      flywheelSubsystem.closedLoopCalculate(targetVelocityRPS));
}

@Override
public void end(boolean interrupted) {
  flywheelSubsystem.setFlywheelVoltage(0.0);
}

@Override
public boolean isFinished() {
  return false;
}
