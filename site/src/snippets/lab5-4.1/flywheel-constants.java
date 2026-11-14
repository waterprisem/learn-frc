public static final class FlywheelConstants {
  public static final int FLYWHEEL_MOTOR_CAN_ID = 1;
  public static final boolean FLYWHEEL_MOTOR_INVERTED = false;
  public static final double FLYWHEEL_STATOR_CURRENT_LIMIT_AMPS = 80.0;
  public static final double FLYWHEEL_SUPPLY_CURRENT_LIMIT_AMPS = 40.0;

  public static final double PID_KP = 0.08;
  public static final double PID_KI = 0.0;
  public static final double PID_KD = 0.0;
  public static final double FEEDFORWARD_KS_VOLTS = 0.20;
  public static final double FEEDFORWARD_KV_VOLTS_PER_RPS = 0.12;
  public static final double VELOCITY_TOLERANCE_RPS = 2.0;

  public static final double LOW_VELOCITY_RPS = 20.0;
  public static final double MEDIUM_VELOCITY_RPS = 40.0;
  public static final double HIGH_VELOCITY_RPS = 70.0;

  public static final String LOGGING_TABLE = "Subsystems/FlywheelSubsystem";
