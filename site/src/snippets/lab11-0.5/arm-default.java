// Arm default command holds whichever side is currently active
armSubsystem.setDefaultCommand(
    Commands.run(
        () -> {
          double targetAngle =
              isFrontIntake
                  ? SuperstructureConstants.INTAKE_FRONT_ARM_ANGLE_DEGREES
                  : SuperstructureConstants.INTAKE_BACK_ARM_ANGLE_DEGREES;
          armSubsystem.setArmVoltage(armSubsystem.closedLoopCalculate(targetAngle));
        },
        armSubsystem));
