MotorOutputConfigs motorOutputConfigs =
    new MotorOutputConfigs()
        .withInverted(
            FlywheelConstants.FLYWHEEL_MOTOR_INVERTED
                ? InvertedValue.Clockwise_Positive
                : InvertedValue.CounterClockwise_Positive)
        .withNeutralMode(NeutralModeValue.Coast);

CurrentLimitsConfigs currentLimitsConfigs =
    new CurrentLimitsConfigs()
        .withStatorCurrentLimit(FlywheelConstants.FLYWHEEL_STATOR_CURRENT_LIMIT_AMPS)
        .withStatorCurrentLimitEnable(true)
        .withSupplyCurrentLimit(FlywheelConstants.FLYWHEEL_SUPPLY_CURRENT_LIMIT_AMPS)
        .withSupplyCurrentLimitEnable(true);

flywheelMotor.getConfigurator().apply(motorOutputConfigs);
flywheelMotor.getConfigurator().apply(currentLimitsConfigs);
