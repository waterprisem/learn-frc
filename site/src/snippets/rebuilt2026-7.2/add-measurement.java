visionEst.ifPresent(
        est -> {
            this.addVisionMeasurement(
                est.estimatedPose.toPose2d(),
                est.timestampSeconds,
                orbitCamera.getEstimationStdDevs()
            );
            orbitCamera.updateStructPublisher(est.estimatedPose.toPose2d());
        });
