public static final double MAX_DRIVE_TRANSLATIONAL_SPEED = TunerConstants.kSpeedAt12Volts.in(MetersPerSecond);
public static final double MAX_DRIVE_ANGULAR_SPEED = RotationsPerSecond.of(1.0).in(RadiansPerSecond);

public static final double DEADBAND_AS_DECIMAL = 0.01;
public static final double CURVE_EXPONENT = 1.25;

public static final double AUTO_AIM_TOLERANCE_DEGREES = 3;

private static final SwerveRequest.FieldCentric teleopFieldCentricDriveRequest = new SwerveRequest.FieldCentric()
        .withDriveRequestType(DriveRequestType.OpenLoopVoltage);
