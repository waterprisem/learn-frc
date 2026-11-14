Command backdriveShooter = new SetFlywheelVelocityCommand(m_flywheelSubsystem, -30.0)
        .alongWith(new SetIndexSpeedsCommand(m_indexSubsystem, -0.4, -1.0));
backdriveShooterInput.whileTrue(backdriveShooter);
