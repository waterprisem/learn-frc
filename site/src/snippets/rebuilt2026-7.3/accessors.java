public Matrix<N3, N1> getEstimationStdDevs() {
  return curStdDevs;
}

public PhotonCamera getPhotonCamera() {
  return this.photonCamera;
}

public PhotonPoseEstimator getPhotonPoseEstimator() {
  return this.photonPoseEstimator;
}

public void updateStructPublisher(Pose2d cameraEstimatedPose) {
  photonPose.accept(cameraEstimatedPose);
  robotPoseTransformedByCameraOffset.accept(new Pose3d(RobotState.getInstance().getRobotOdomPose()).transformBy(this.robotToCamera));
}

// Functions for updating and retreiving pipeling results
public void updatePipelineResults() {
  currentUnreadResults = this.photonCamera.getAllUnreadResults();
}

public List<PhotonPipelineResult> getPipelineResults() {
  return currentUnreadResults;
}
