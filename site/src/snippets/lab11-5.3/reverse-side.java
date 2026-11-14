public Command reverseIntakeDirection() {
  return Commands.defer(
          () -> {
            isFrontIntake = !isFrontIntake;
            String side = isFrontIntake ? "FRONT (RIGHT)" : "BACK (LEFT)";
            intakeDirectionPublisher.accept(side);
            if (isFrontIntake) {
              return SuperstructureCommands.intakeFront(
                  elevatorSubsystem, armSubsystem, flywheelSubsystem);
            } else {
              return SuperstructureCommands.intakeBack(
                  elevatorSubsystem, armSubsystem, flywheelSubsystem);
            }
          },
          Set.of(elevatorSubsystem, armSubsystem, flywheelSubsystem))
      .withName("Reverse Intake Direction");
}
