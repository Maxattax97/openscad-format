include <cornucopia/util/math.scad>
include <cornucopia/util/measures/imperial.scad>
use <cornucopia/util/vector.scad>

include <cornucopia/util/constants.scad>

use <cornucopia/util/constants.scad>


module
testUnitTest()
{
    include <cornucopia/util/measures/standard.scad>
    include <cornucopia/util/util.scad>
    echo(TST_equal("Equality", [ 1, 2, 4, 8 ], [ 1, 2, 4, 8 ]));
    echo(TST_notEqual("Non-equality", [ 1, 2, 4, 8 ], [ 0, 1, 1, 2 ]));
    echo(TST_true("Truthiness", 1 + 1 == 2));
    echo(TST_false("Falseness", 1 + 1 == 3));
    echo(TST_in("Presence", 4, [ 1, 2, 4, 8 ]));
    echo(TST_notIn("Absence", 16, [ 1, 2, 4, 8 ]));
    echo(TST_approximately("Approximately Equal", 15 + (EPSILON / 2), 15));
}
