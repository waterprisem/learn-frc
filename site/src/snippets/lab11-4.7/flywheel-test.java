@Test
void flywheelSpinsUpAndTracksVelocity() throws InterruptedException {
  FlywheelSubsystem flywheel = new FlywheelSubsystem();
  double targetRPS = SuperstructureConstants.SCORE_FRONT_FLYWHEEL_VELOCITY_RPS;

  double bestError = Double.POSITIVE_INFINITY;
  for (int i = 0; i < 150; i++) {
    Unmanaged.feedEnable(100);
    flywheel.periodic();
    flywheel.setFlywheelVoltage(flywheel.closedLoopCalculate(targetRPS));
    flywheel.simulationPeriodic();
    Thread.sleep(5);
    bestError = Math.min(bestError, Math.abs(flywheel.getFlywheelVelocityRPS() - targetRPS));
  }

  assertTrue(
      bestError < 4.0,
      "Flywheel should reach target velocity within tolerance. Best error: " + bestError);
}
