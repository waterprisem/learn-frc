return Commands.sequence(
        Commands.deadline(
            Commands.waitUntil(elevatorSubsystem.elevatorAtScoreSpeaker),
            new SetElevatorHeightCommand(
                elevatorSubsystem,
                SuperstructureConstants.SCORE_SPEAKER_ELEVATOR_HEIGHT_METERS)),
        Commands.deadline(
            Commands.waitUntil(armSubsystem.armAtScoreSpeaker),
            new SetElevatorHeightCommand(
                elevatorSubsystem,
                SuperstructureConstants.SCORE_SPEAKER_ELEVATOR_HEIGHT_METERS),
            new SetArmAngleCommand(
                armSubsystem, SuperstructureConstants.SCORE_SPEAKER_ARM_ANGLE_DEGREES)),
        Commands.parallel(
            new SetElevatorHeightCommand(
                elevatorSubsystem,
                SuperstructureConstants.SCORE_SPEAKER_ELEVATOR_HEIGHT_METERS),
            new SetArmAngleCommand(
                armSubsystem, SuperstructureConstants.SCORE_SPEAKER_ARM_ANGLE_DEGREES),
            new SetFlywheelVelocityCommand(
                flywheelSubsystem,
                SuperstructureConstants.SCORE_SPEAKER_FLYWHEEL_VELOCITY_RPS)))
    .withName("Score Speaker");
