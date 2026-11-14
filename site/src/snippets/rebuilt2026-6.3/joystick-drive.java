return drivetrain.applyRequest(
        () -> {
            Translation2d modifiedDriveInput = modifyJoystickCurve(
                    -controller.getLeftY(),
                    -controller.getLeftX());
            Translation2d modifiedTurnInput = modifyJoystickCurve(
                    -controller.getRightX(),
                    0.0);

            return teleopFieldCentricDriveRequest
                    .withCenterOfRotation(new Translation2d())
                    .withVelocityX(
                            modifiedDriveInput.getX() * MAX_DRIVE_TRANSLATIONAL_SPEED * translationalScalar)
                    .withVelocityY(
                            modifiedDriveInput.getY() * MAX_DRIVE_TRANSLATIONAL_SPEED * translationalScalar)
                    .withRotationalRate(
                            modifiedTurnInput.getX() * MAX_DRIVE_ANGULAR_SPEED * angularScalar);
        });
