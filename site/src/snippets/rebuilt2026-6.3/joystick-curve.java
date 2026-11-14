public static Translation2d modifyJoystickCurve(double inputX, double inputY) {
    Translation2d inputVector = new Translation2d(inputX, inputY);
    double inputMagnitude = inputVector.getNorm();
    Rotation2d inputAngle = inputVector.getAngle();

    double outputMagnitude = 0.0;
    if (inputMagnitude > DEADBAND_AS_DECIMAL)
        outputMagnitude = Math.pow(inputMagnitude - DEADBAND_AS_DECIMAL, CURVE_EXPONENT) /
                Math.pow(1.0 - DEADBAND_AS_DECIMAL, CURVE_EXPONENT);

    return new Translation2d(outputMagnitude, inputAngle);
}
