visionEst = orbitCamera.getPhotonPoseEstimator().estimateCoprocMultiTagPose(result);
if (visionEst.isEmpty()) {
    visionEst = orbitCamera.getPhotonPoseEstimator().estimateLowestAmbiguityPose(result);
}
orbitCamera.updateEstimationStdDevs(visionEst, result.getTargets());
