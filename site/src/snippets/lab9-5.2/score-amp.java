return Commands.parallel(
        new SetElevatorHeightCommand(
            elevatorSubsystem, SuperstructureConstants.SCORE_AMP_ELEVATOR_HEIGHT_METERS),
        new SetArmAngleCommand(
            armSubsystem, SuperstructureConstants.SCORE_AMP_ARM_ANGLE_DEGREES),
        Commands.waitUntil(
                elevatorSubsystem.elevatorAtScoreAmp.and(armSubsystem.armAtScoreAmp)
            )
            .andThen(
                new SetFlywheelVelocityCommand(
                    flywheelSubsystem,
                    SuperstructureConstants.SCORE_AMP_FLYWHEEL_VELOCITY_RPS)))
    .withName("Score Amp");
