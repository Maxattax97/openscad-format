/**
 *
 * Some header comment
 *
 */

include <MCAD/gears/rack_and_pinion.scad>
include <MCAD/shapes/polyhole.scad>

module
polyhole_demo()
{
    difference()
    {
        cube(size = [ 100, 27, 3 ]);
        union()
        {
            for (i = [1:10]) {
                translate([ (i * i + i) / 2 + 3 * i, 8, -1 ])
                    mcad_polyhole(h = 5, d = i);

                assign(d = i + 0.5)
                    translate([ (d * d + d) / 2 + 3 * d, 19, -1 ])
                        mcad_polyhole(h = 5, d = d);
            }
        }
    }
}

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

polyhole_demo();

// examples of usage
// include this in your code:
// use <rack_and_pinion.scad>
// then:
// a simple rack
rack(4,
     20,
     10,
     1); // CP (mm/tooth), width (mm), thickness(of base) (mm), # teeth
// a simple pinion and translation / rotation to make it mesh the rack
translate([ 0, -8.5, 0 ]) rotate([ 0, 0, 360 / 10 / 2 ])
    pinion(MTH_distance3D([ 1, 2, 3 ], [ 4, 5, 6 ]), 10, 10, 5);
