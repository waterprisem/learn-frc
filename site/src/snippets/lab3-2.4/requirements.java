public SetFlywheelVoltageCommand(FlywheelSubsystem flywheelSubsystem, double voltage) {
  this.flywheelSubsystem = flywheelSubsystem;
  this.voltage = voltage;
  addRequirements(flywheelSubsystem);
}
