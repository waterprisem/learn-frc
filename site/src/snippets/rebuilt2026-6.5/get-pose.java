robotState.setAllSuppliers(
        () -> drivetrain.getState().Pose,
        () -> drivetrain.getState().Speeds,
        () -> m_TurretSubsystem.getCurrentRobotRelativeRotation());
