private final NetworkTable loggingTable =
    NetworkTableInstance.getDefault().getTable(FlywheelConstants.LOGGING_TABLE);
private final DoublePublisher velocityPublisher =
    loggingTable.getDoubleTopic("Velocity RPS").publish();
private final DoublePublisher targetPublisher =
    loggingTable.getDoubleTopic("Target RPS").publish();
private final DoublePublisher errorPublisher =
    loggingTable.getDoubleTopic("Error RPS").publish();
private final DoublePublisher outputVoltagePublisher =
    loggingTable.getDoubleTopic("Output Voltage").publish();
private final BooleanPublisher atTargetPublisher =
    loggingTable.getBooleanTopic("At Target").publish();
