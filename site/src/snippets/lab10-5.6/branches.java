Command armFirst =
    Commands.sequence(
        Commands.runOnce(
            () -> publishTransition(levelName, "ARM_FIRST: fold arm before elevator")),
        moveArmTo(SuperstructureConstants.HOME_ARM_ANGLE_DEGREES),
        moveElevatorTo(elevatorHeightMeters),
        moveArmTo(armAngleDegrees));

Command elevatorFirst =
    Commands.sequence(
        Commands.runOnce(
            () -> publishTransition(levelName, "ELEVATOR_FIRST: carriage moves while arm is folded")),
        moveElevatorTo(elevatorHeightMeters),
        moveArmTo(armAngleDegrees));
