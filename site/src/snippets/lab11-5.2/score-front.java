return Commands.sequence(
        // Elevate carriage above clearance height before arm extends
        new SetElevatorHeightCommand(
                elevatorSubsystem,
                SuperstructureConstants.SCORE_FRONT_ELEVATOR_HEIGHT_METERS)
            .until(
                () ->
                    elevatorSubsystem.getElevatorHeightMeters()
                        >= SuperstructureConstants.SAFE_ELEVATOR_CLEARANCE_HEIGHT_METERS),
        // Move arm to front scoring position and spin up flywheel
        Commands.parallel(
            new SetElevatorHeightCommand(
                elevatorSubsystem,
                SuperstructureConstants.SCORE_FRONT_ELEVATOR_HEIGHT_METERS),
            new SetArmAngleCommand(
                armSubsystem, SuperstructureConstants.SCORE_FRONT_ARM_ANGLE_DEGREES),
            new SetFlywheelVelocityCommand(
                flywheelSubsystem,
                SuperstructureConstants.SCORE_FRONT_FLYWHEEL_VELOCITY_RPS)))
    .withTimeout(SuperstructureConstants.SUPERSTRUCTURE_COMMAND_TIMEOUT_SECONDS)
    .withName("Score Front");
