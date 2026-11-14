private final DoublePublisher kPPublisher = loggingTable.getDoubleTopic("Tuning/kP").publish();
private final DoublePublisher kIPublisher = loggingTable.getDoubleTopic("Tuning/kI").publish();
private final DoublePublisher kDPublisher = loggingTable.getDoubleTopic("Tuning/kD").publish();
private final DoublePublisher kSPublisher = loggingTable.getDoubleTopic("Tuning/kS Volts").publish();
private final DoublePublisher kVPublisher =
    loggingTable.getDoubleTopic("Tuning/kV Volts per RPS").publish();
private final DoubleSubscriber kPSubscriber =
    loggingTable.getDoubleTopic("Tuning/kP").subscribe(FlywheelConstants.PID_KP);
