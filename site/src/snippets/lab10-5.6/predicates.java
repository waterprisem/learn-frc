private boolean isCurrentArmOutsideSafeRange() {
  return isArmOutsideSafeRange(armSubsystem.getCurrentAngleDegrees());
}

private boolean isElevatorAtOrAboveSafeHeight() {
  return elevatorSubsystem.getElevatorHeightMeters()
      >= SuperstructureConstants.SAFE_ARM_MOVEMENT_HEIGHT_METERS;
}

private boolean isArmOutsideSafeRange(double angleDegrees) {
  return angleDegrees < SuperstructureConstants.SAFE_ARM_MOVEMENT_MIN_ANGLE_DEGREES
      || angleDegrees > SuperstructureConstants.SAFE_ARM_MOVEMENT_MAX_ANGLE_DEGREES;
}
