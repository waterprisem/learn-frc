/** Becomes true whenever velocity is within the configured tolerance of the setpoint. */
public final Trigger flywheelAtTarget = new Trigger(() -> flywheelAtVelocity);
