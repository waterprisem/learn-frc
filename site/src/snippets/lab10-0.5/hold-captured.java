private Command holdElevatorAtCapturedHeight(double[] targetHeightMeters) {
  return Commands.runEnd(
          () ->
              elevatorSubsystem.setElevatorVoltage(
                  elevatorSubsystem.closedLoopCalculate(targetHeightMeters[0])),
          () -> elevatorSubsystem.setElevatorVoltage(0.0),
          elevatorSubsystem)
      .withName("Hold Elevator At Starting Height");
}
