@Override
public void periodic() {
  velocityPublisher.accept(getFlywheelVelocityRPS());
  positionPublisher.accept(getFlywheelPositionRotations());
}

@Override
public void simulationPeriodic() {
  if (flywheelSimulation != null) {
    flywheelSimulation.update();
  }
}
