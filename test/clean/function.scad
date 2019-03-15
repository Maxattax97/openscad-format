

/**
 * Computes the exponent of a base and a power.
 *
 * @param base The number to be multiplied power times.
 * @param power The number of times to multiply the base together.
 * @return The base risen the the power.
 */
function MTH_power(base, power) = pow(base, power); // exp(ln(base) * power);

/**
 * Measures the distance between two 3D vectors.
 *
 * @param vector_a The first 3D vector to compare.
 * @param vector_b The second 3D vector to compare.
 * @return The distance between vector_a and vector_b.
 */
function MTH_distance3D(vector_a, vector_b) =
    sqrt((vector_a[0] - vector_b[0]) * (vector_a[0] - vector_b[0]) +
         (vector_a[1] - vector_b[1]) * (vector_a[1] - vector_b[1]) +
         (vector_a[2] - vector_b[2]) * (vector_a[2] - vector_b[2]));

/**
 * Measures the distance between two 2D vectors.
 *
 * @param vector_a The first 2D vector to compare.
 * @param vector_b The second 2D vector to compare.
 * @return The distance between vector_a and vector_b.
 */
function MTH_distance2D(vector_a, vector_b) =
    sqrt((vector_a[0] - vector_b[0]) * (vector_a[0] - vector_b[0]) +
         (vector_a[1] - vector_b[1]) * (vector_a[1] - vector_b[1]));

function MTH_distance1D(vector_a, vector_b) = abs(vector_a - vector_b);
function MTH_normalize(vector) =
    norm(vector); // vector / (max(MTH_distance3D(ORIGIN, vector), EPSILON));
function MTH_normalVectorAngle(vector) = [
    0,
    -1 * atan2(vector[2], MTH_distance1D([ vector[0], vector[1] ])),
    atan2(vector[1], vector[0])
];
