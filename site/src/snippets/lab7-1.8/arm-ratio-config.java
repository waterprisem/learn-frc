FeedbackConfigs feedbackConfigs =
    new FeedbackConfigs().withSensorToMechanismRatio(ArmConstants.GEAR_RATIO);

armMotor.getConfigurator().apply(motorOutputConfigs);
armMotor.getConfigurator().apply(currentLimitsConfigs);
armMotor.getConfigurator().apply(feedbackConfigs);
armMotor.setPosition(angleDegreesToMechanismRotations(ArmConstants.STARTUP_ANGLE_DEGREES));
