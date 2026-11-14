driverController
    .a()
    .whileTrue(
        new SetFlywheelVoltageCommand(
            flywheelSubsystem, FlywheelConstants.FORWARD_VOLTAGE));
