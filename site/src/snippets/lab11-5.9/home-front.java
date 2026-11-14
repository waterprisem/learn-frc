public static Command homeFront(
    ElevatorSubsystem elevatorSubsystem,
    ArmSubsystem armSubsystem,
    FlywheelSubsystem flywheelSubsystem) {
  return Commands.parallel(
          new SetElevatorHeightCommand(
              elevatorSubsystem, SuperstructureConstants.HOME_ELEVATOR_HEIGHT_METERS),
          new SetArmAngleCommand(
              armSubsystem, SuperstructureConstants.HOME_FRONT_ARM_ANGLE_DEGREES),
          new SetFlywheelVelocityCommand(
              flywheelSubsystem, SuperstructureConstants.HOME_FLYWHEEL_VELOCITY_RPS))
      .withName("Home Front");
}
