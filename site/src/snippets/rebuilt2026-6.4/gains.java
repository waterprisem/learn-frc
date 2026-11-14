private static final Slot0Configs steerGains = new Slot0Configs()
    .withKP(100).withKI(0).withKD(0.5)
    .withKS(0.1).withKV(3.10).withKA(0)
    .withStaticFeedforwardSign(StaticFeedforwardSignValue.UseClosedLoopSign);
// When using closed-loop control, the drive motor uses the control
// output type specified by SwerveModuleConstants.DriveMotorClosedLoopOutput
private static final Slot0Configs driveGains = new Slot0Configs()
    .withKP(0.1).withKI(0).withKD(0)
    .withKS(0).withKV(0.124);
