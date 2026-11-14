public class RobotContainer {
  // SESSION 2 ANNOTATION: This value is defined in Constants.OperatorConstants.
  private final CommandXboxController driverController =
      new CommandXboxController(OperatorConstants.DRIVER_CONTROLLER_PORT);
  private final DiagnosticsSubsystem diagnosticsSubsystem = new DiagnosticsSubsystem();

  public RobotContainer() {
    configureBindings();
  }

  private void configureBindings() {
    driverController.a().whileTrue(new RunSelfCheckCommand(diagnosticsSubsystem));

    // SESSION 2 ANNOTATION: The subsystem's default command is set on the next line.
    diagnosticsSubsystem.setDefaultCommand(
        Commands.run(diagnosticsSubsystem::reportIdle, diagnosticsSubsystem)
            .withName("Report Diagnostics Idle"));
  }
