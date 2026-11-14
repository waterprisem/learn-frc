public OrbitCamera(Transform3d robotToCamera, String cameraName) {
  aprilTagFieldLayout = AprilTagFieldLayout.loadField(AprilTagFields.k2026RebuiltWelded);

  this.robotToCamera = robotToCamera;
  this.photonCamera = new PhotonCamera(cameraName);
  photonPoseEstimator = new PhotonPoseEstimator(aprilTagFieldLayout, robotToCamera);

  photonPose =
      NetworkTableInstance.getDefault()
          .getStructTopic("Photon Cameras/" + cameraName + "/Photon_Pose", Pose2d.struct)
          .publish();
