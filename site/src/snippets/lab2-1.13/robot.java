@Override
public void robotPeriodic() {
  CommandScheduler.getInstance().run();
}

@Override
public void disabledInit() {}

@Override
public void disabledPeriodic() {}

@Override
public void disabledExit() {}

@Override
public void autonomousInit() {
  m_autonomousCommand = m_robotContainer.getAutonomousCommand();

  if (m_autonomousCommand != null) {
    CommandScheduler.getInstance().schedule(m_autonomousCommand);
  }
}
