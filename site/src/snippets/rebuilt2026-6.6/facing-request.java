public final SwerveRequest.FieldCentricFacingAngle facingAngleRequest =
        new SwerveRequest.FieldCentricFacingAngle()
                .withDriveRequestType(DriveRequestType.OpenLoopVoltage)
                .withHeadingPID(7.0, 0.0, 0.0)
                .withCenterOfRotation(TurretConstants.ROBOT_TO_TURRET_CENTER.getTranslation());

public final Trigger swerveAtTargetHeading = new Trigger(
        () -> facingAngleRequest.HeadingController.atSetpoint());
