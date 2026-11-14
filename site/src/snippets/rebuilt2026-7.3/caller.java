private void updatePose() {
    for (OrbitCamera orbitCamera : swerveCameras) {
        orbitCamera.updatePipelineResults();
        Optional<EstimatedRobotPose> visionEst = Optional.empty();
        for (var result : orbitCamera.getPipelineResults()) {
            visionEst = orbitCamera.getPhotonPoseEstimator().estimateCoprocMultiTagPose(result);
            if (visionEst.isEmpty()) {
                visionEst = orbitCamera.getPhotonPoseEstimator().estimateLowestAmbiguityPose(result);
            }
            orbitCamera.updateEstimationStdDevs(visionEst, result.getTargets());

            visionEst.ifPresent(
                    est -> {
                        this.addVisionMeasurement(
                            est.estimatedPose.toPose2d(),
                            est.timestampSeconds,
                            orbitCamera.getEstimationStdDevs()
                        );
                        orbitCamera.updateStructPublisher(est.estimatedPose.toPose2d());
                    });
        }
    }
}
