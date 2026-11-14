private void configureBindings() {
  driverController
      .a()
      .whileTrue(
          new SetFlywheelVoltageCommand(
              flywheelSubsystem, FlywheelConstants.FORWARD_VOLTAGE));
  driverController
      .b()
      .whileTrue(
          new SetFlywheelVoltageCommand(
              flywheelSubsystem, FlywheelConstants.REVERSE_VOLTAGE));

  flywheelSubsystem.setDefaultCommand(
      new SetFlywheelVoltageCommand(flywheelSubsystem, 0.0));
}
