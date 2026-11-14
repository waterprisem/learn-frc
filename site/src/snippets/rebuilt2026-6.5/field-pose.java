/* Telemeterize the pose to a Field2d */
fieldTypePub.set("Field2d");

m_poseArray[0] = state.Pose.getX();
m_poseArray[1] = state.Pose.getY();
m_poseArray[2] = state.Pose.getRotation().getDegrees();
fieldPub.set(m_poseArray);
