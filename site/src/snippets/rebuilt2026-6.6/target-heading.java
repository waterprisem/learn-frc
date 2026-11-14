Translation2d turretTranslation = robotState.getTurretOdomPose().getTranslation();
Rotation2d compensatedHeading = PhotonUtils.getYawToPose(
        new Pose2d(turretTranslation, new Rotation2d()),
        new Pose2d(compensatedGoalTranslation, new Rotation2d()));

Translation2d driveInput = DriveCommands.modifyJoystickCurve(
        -controller.getLeftY(), -controller.getLeftX());
drivetrain.setControl(
        drivetrain.facingAngleRequest
                .withVelocityX(driveInput.getX() * DriveCommands.MAX_DRIVE_TRANSLATIONAL_SPEED * TRANSLATIONAL_SCALAR)
                .withVelocityY(driveInput.getY() * DriveCommands.MAX_DRIVE_TRANSLATIONAL_SPEED * TRANSLATIONAL_SCALAR)
                .withTargetDirection(compensatedHeading));
