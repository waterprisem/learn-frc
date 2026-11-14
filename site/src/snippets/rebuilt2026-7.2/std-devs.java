// Decrease std devs if multiple targets are visible
if (numTags > 1) estStdDevs = kMultiTagStdDevs;
// Increase std devs based on (average) distance
if ((numTags == 1 && avgDist > 4) || (isPoseAmbiguous))
  estStdDevs = VecBuilder.fill(Double.MAX_VALUE, Double.MAX_VALUE, Double.MAX_VALUE);
else {
    estStdDevs = estStdDevs.times(1 + (avgDist * avgDist / 30));
}
curStdDevs = estStdDevs;
