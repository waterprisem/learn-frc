public static double angleDegreesToMechanismRotations(double angleDegrees) {
  return angleDegrees / 360.0;
}

public static double mechanismRotationsToAngleDegrees(double mechanismRotations) {
  return mechanismRotations * 360.0;
}

public static double angleDegreesToMotorRotations(double angleDegrees) {
  return angleDegreesToMechanismRotations(angleDegrees) * ArmConstants.GEAR_RATIO;
}

public static double motorRotationsToAngleDegrees(double motorRotations) {
  return mechanismRotationsToAngleDegrees(motorRotations / ArmConstants.GEAR_RATIO);
}
