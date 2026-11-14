elevatorSubsystem.setDefaultCommand(
    new SetElevatorHeightCommand(
        elevatorSubsystem, SuperstructureConstants.HOME_ELEVATOR_HEIGHT_METERS));
armSubsystem.setDefaultCommand(
    new SetArmAngleCommand(armSubsystem, SuperstructureConstants.HOME_ARM_ANGLE_DEGREES));
flywheelSubsystem.setDefaultCommand(
    new SetFlywheelVelocityCommand(
        flywheelSubsystem, SuperstructureConstants.HOME_FLYWHEEL_VELOCITY_RPS));
