/** Applies gain edits made through NetworkTables without requiring a redeploy. */
public void grabConstantsFromNetworkTables() {
  flywheelPID.setPID(kPSubscriber.get(), kISubscriber.get(), kDSubscriber.get());
  flywheelFF.setKs(kSSubscriber.get());
  flywheelFF.setKv(kVSubscriber.get());
}

@Override
public void periodic() {
  grabConstantsFromNetworkTables();
