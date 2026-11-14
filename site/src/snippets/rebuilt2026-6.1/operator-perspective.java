if (!m_hasAppliedOperatorPerspective || DriverStation.isDisabled()) {
    DriverStation.getAlliance().ifPresent(allianceColor -> {
        setOperatorPerspectiveForward(
            allianceColor == Alliance.Red
                ? kRedAlliancePerspectiveRotation
                : kBlueAlliancePerspectiveRotation
        );
        m_hasAppliedOperatorPerspective = true;
    });
}
