var config = RobotConfig.fromGUISettings();
AutoBuilder.configure(
    () -> getState().Pose,   // Supplier of current robot pose
    this::resetPose,         // Consumer for seeding pose against auto
    () -> getState().Speeds, // Supplier of current robot speeds
    // Consumer of ChassisSpeeds and feedforwards to drive the robot
    (speeds, feedforwards) -> setControl(
        m_pathPlannerApplyRobotSpeeds.withSpeeds(ChassisSpeeds.discretize(speeds, 0.020))
            .withWheelForceFeedforwardsX(feedforwards.robotRelativeForcesXNewtons())
            .withWheelForceFeedforwardsY(feedforwards.robotRelativeForcesYNewtons())
    ),
