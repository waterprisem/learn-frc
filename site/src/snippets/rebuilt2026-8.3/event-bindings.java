leftSideTurretedAuto1.event("DEPLOY_INTAKE_RUN_ROLLERS").onTrue(
        new DeployIntakeCommand(m_intakeSubsystem, () -> true));
leftSideTurretedAuto1.event("DEPLOY_INTAKE_STOP_ROLLERS").onTrue(
        new DeployIntakeCommand(m_intakeSubsystem, () -> false));
leftSideTurretedAuto1.event("PREPARE_TO_SHOOT").onTrue(prepareLeftSideTurretedShot);
leftSideTurretedAuto1.event("PREPARE_TO_SHOOT_WITH_TURRET").onTrue(prepareTurretedShot);
leftSideTurretedAuto1.event("EXECUTE_TURRETED_SHOOTING").onTrue(executeTurretedShot);
