private final AprilTagFieldLayout aprilTagFieldLayout;

private final PhotonCamera photonCamera;
private final PhotonPoseEstimator photonPoseEstimator;
private final Transform3d robotToCamera;

private List<PhotonPipelineResult> currentUnreadResults;

StructPublisher<Pose2d> photonPose;
StructPublisher<Transform3d> robotToCameraOffset;
StructPublisher<Pose3d> robotPoseTransformedByCameraOffset;
private Matrix<N3, N1> curStdDevs;
private Matrix<N3, N1> kSingleTagStdDevs = VecBuilder.fill(2, 2, 2);
private Matrix<N3, N1> kMultiTagStdDevs = VecBuilder.fill(0.5, 0.5, 1);
private double AMBIGUITY_CUTOFF_THRESHOLD = 0.2;
