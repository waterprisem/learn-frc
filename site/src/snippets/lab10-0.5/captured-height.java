private Command downwardIntake() {
  double[] startingElevatorHeightMeters = new double[1];
  return Commands.either(
          Commands.sequence(
              Commands.runOnce(
                  () -> {
                    startingElevatorHeightMeters[0] = elevatorSubsystem.getElevatorHeightMeters();
                    publishTransition(
                        "FAUX INTAKE", "ELEVATOR_ALREADY_ABOVE_SAFE_HEIGHT");
                  }),
              Commands.runOnce(
                  () -> publishTransition("FAUX INTAKE", "ARM_RELEASED_AFTER_SAFE_HEIGHT")),
