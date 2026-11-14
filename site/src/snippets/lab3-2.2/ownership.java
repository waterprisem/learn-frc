/** Owns the flywheel motor, its configuration, and its encoder telemetry. */
public class FlywheelSubsystem extends SubsystemBase {
  private final TalonFX flywheelMotor =
      new TalonFX(FlywheelConstants.FLYWHEEL_MOTOR_CAN_ID);

  private final NetworkTable loggingTable =
      NetworkTableInstance.getDefault().getTable(FlywheelConstants.LOGGING_TABLE);
  private final DoublePublisher velocityPublisher =
      loggingTable.getDoubleTopic("Velocity RPS").publish();
  private final DoublePublisher positionPublisher =
      loggingTable.getDoubleTopic("Position Rotations").publish();
