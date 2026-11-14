/** Becomes true whenever the arm is within tolerance of the requested goal. */
public final Trigger armAtTarget = new Trigger(() -> armAtAngle);
public final Trigger armAtScoreSpeaker =
    new Trigger(
        () ->
            armPID.getGoal().position
                    == SuperstructureConstants.SCORE_SPEAKER_ARM_ANGLE_DEGREES
                && armAtAngle);
public final Trigger armAtScoreAmp =
    new Trigger(
        () ->
            armPID.getGoal().position == SuperstructureConstants.SCORE_AMP_ARM_ANGLE_DEGREES
                && armAtAngle);
