public SetFlywheelVoltageCommand(FlywheelSubsystem flywheelSubsystem, double voltage) {
  this.flywheelSubsystem = flywheelSubsystem;
  this.voltage = voltage;
  addRequirements(flywheelSubsystem);
}

@Override
public void initialize() {}

@Override
public void execute() {
  flywheelSubsystem.setFlywheelVoltage(voltage);
}

@Override
public void end(boolean interrupted) {
  flywheelSubsystem.setFlywheelVoltage(0.0);
}

@Override
public boolean isFinished() {
  return false;
}
