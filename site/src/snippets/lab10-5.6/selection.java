return Commands.either(
        armFirst,
        Commands.either(
            elevatorFirst,
            parallelSafe,
            () -> isArmOutsideSafeRange(armAngleDegrees)),
        this::isCurrentArmOutsideSafeRange)
    .withTimeout(SuperstructureConstants.SUPERSTRUCTURE_COMMAND_TIMEOUT_SECONDS)
    .withName("Safe Go To " + levelName);
