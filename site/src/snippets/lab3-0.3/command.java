public class SetFlywheelVoltageCommand extends Command {
  private final FlywheelSubsystem flywheelSubsystem;
  private final double voltage;

  public SetFlywheelVoltageCommand(FlywheelSubsystem flywheelSubsystem, double voltage) {
    this.flywheelSubsystem = flywheelSubsystem;
    this.voltage = voltage;
    addRequirements(flywheelSubsystem);
  }

  @Override
  public void initialize() {}

  @Override
  public void execute() {
    flywheelSubsystem.setFlywheelVoltage(voltage);
  }
