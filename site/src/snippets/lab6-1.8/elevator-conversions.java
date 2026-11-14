public static double heightMetersToMotorRotations(double heightMeters) {
  return heightMeters
      / (2.0 * Math.PI * ElevatorConstants.DRUM_RADIUS_METERS)
      * ElevatorConstants.GEAR_RATIO;
}

public static double motorRotationsToHeightMeters(double motorRotations) {
  return motorRotations
      / ElevatorConstants.GEAR_RATIO
      * (2.0 * Math.PI * ElevatorConstants.DRUM_RADIUS_METERS);
}
