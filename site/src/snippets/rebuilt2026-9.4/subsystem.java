public double closedLoopCalculate(double target) {
    return flywheelPIDController.calculate(getFlywheelSpeed(), target)
            + flywheelFFController.calculate(target);
}

public void grabConstantsFromNetworkTables() {
    this.pidLogger.updateConstants();
}

public void setFlywheelSpeed(double speed) {
    flywheelMotor.set(speed);
}

public void setFlywheelVoltage(double voltage) {
    flywheelMotor.setVoltage(voltage);
}
