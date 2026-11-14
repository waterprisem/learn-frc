    new PPHolonomicDriveController(
        // PID constants for translation
        new PIDConstants(12, 0, 0),
        // PID constants for rotation
        new PIDConstants(7, 0, 0)
    ),
    config,
    // Assume the path needs to be flipped for Red vs Blue, this is normally the case
    () -> DriverStation.getAlliance().orElse(Alliance.Blue) == Alliance.Red,
    this // Subsystem for requirements
);
