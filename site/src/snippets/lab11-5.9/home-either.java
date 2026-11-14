public static Command home(
    ElevatorSubsystem elevatorSubsystem,
    ArmSubsystem armSubsystem,
    FlywheelSubsystem flywheelSubsystem,
    BooleanSupplier isFrontSideSupplier) {
  return Commands.either(
          homeFront(elevatorSubsystem, armSubsystem, flywheelSubsystem),
          homeBack(elevatorSubsystem, armSubsystem, flywheelSubsystem),
          isFrontSideSupplier)
      .withName("Home (Active Side)");
}
