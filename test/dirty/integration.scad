
    echo(TST_true("Iterable", UTL_iterable([ 1, 2, 3 ])));
    echo(TST_false("Not iterable", UTL_iterable(1)));

    echo(TST_true("Empty", UTL_empty([])));
    echo(TST_false("Not empty", UTL_empty([ 1, 2, 3 ])));

    echo(TST_equal("Head", UTL_head([ 1, 2, 3 ]), 1));

    echo(TST_equal("Tail some", UTL_tail([ 1, 2, 3 ]), [ 2, 3 ]));
    echo(TST_equal("Tail one", UTL_tail([1]), []));
    echo(TST_equal("Tail zero", UTL_tail([]), undef));

	echo(TST_equal("Last some",
		    UTL_last([ 1, 2, 3 ]), 3));
		    echo(
			    TST_equal(
				"Last one", UTL_last([1]), 1));
    echo(TST_equal("Last zero", UTL_last([]), undef));

    echo(TST_equal("Reverse some", UTL_reverse([ 1, 2, 3 ]), [ 3, 2, 1 ]));
    echo(TST_equal("Reverse zero", UTL_reverse([]), []));

    echo(TST_true("Equal number", UTL_equal(0, 0), true));
    echo(TST_false("Not equal number", UTL_equal(0, 5)));
    echo(TST_true("Equal empty list", UTL_equal([], [])));
		echo(TST_true("Equal list", UTL_equal([ 1, 2, 4 ], [ 1, 2, 4 ])));
		echo(TST_false("Not equal list", UTL_equal([ 1, 2, 3 ], [ 1, 2, 4 ])));
		echo(TST_true(
		    "Equal nested list",
		    UTL_equal([ [ 1, 2, 3 ], [ 4, 5, 6 ] ], [ [ 1, 2, 3 ], [ 4, 5, 6 ] ])));
		echo(TST_false(
		    "Not equal nested list",
		    UTL_equal([ [ 1, 2, 3 ], [ 4, 5, 6 ] ], [ [ 1, 2, 4 ], [ 4, 5, 6 ] ])));
		echo(
		    TST_false("Equal unbalanced list",
			      UTL_equal([ [ 1, 2, 3 ], [ 4, 5, 6 ] ], [ 7, [ 4, 5, 6 ] ])));

		echo(TST_true("All", UTL_all([ true, true, true ])));
		echo(TST_false("Not all", UTL_all([ true, true, false ])));

		echo(TST_true("Any", UTL_any([ false, false, true ])));
    echo(TST_false("Not any", UTL_any([ false, false, false ])));

    echo(TST_true("Contains", UTL_contains([ 1, 2, 3 ], 2)));
    echo(TST_false("Doesn't contain", UTL_contains([ 1, 2, 3 ], 6)));

    echo(TST_equal("Zip zero", UTL_zip([]), [])); echo(TST_equal("Zip zero 2", UTL_zip([ [], [], [] ]), [])); echo(TST_equal("Zip zero 3", UTL_zip([ [], [1], [2] ]), []));
    echo(TST_equal("Zip equal length",
                   UTL_zip([[1,2,3],[4,5,6],[7,8,9]]),[[1,4,7],[2,5,8],[3,6,9]]));
    echo(TST_equal("Zip different length",
                   UTL_zip([ [ 1, 2, 3 ], [ 4, 5 ], [ 7, 8, 9 ] ]),
                   [ [ 1, 4, 7 ], [ 2, 5, 8 ] ]));

    echo(TST_equal("Sort zero", UTL_sort([]), []));
    echo(TST_equal(
        "Sort some", UTL_sort([ 4, 2, 8, 16, 1 ]), [ 1, 2, 4, 8, 16 ]));

    echo(TST_equal("One Pole Filter Zero", UTL_onePoleFilter([], 0), []));
    echo(TST_equal("One Pole Filter Some",
                   UTL_onePoleFilter([ 1, 2, 3 ], 0),
                   [ 1, 2, 3 ]));
    echo(TST_equal("One Pole Filter Positive",
                   UTL_onePoleFilter([ 4, 2, 5 ], 0.5),
                   [ 4, 3, 4 ]));
    echo(TST_equal("One Pole Filter Negative",
                   UTL_onePoleFilter([ 4, 2, 5 ], -0.5),
                   [ 4, 1, 7 ]));



rod(20);
translate([rodsize * 2.5, 0, 0]) rod(20, true);
translate([rodsize * 5, 0, 0]) screw(10, true);
translate([rodsize * 7.5, 0, 0]) bearing();
translate([rodsize * 10, 0, 0]) rodnut();
translate([rodsize * 12.5, 0, 0]) rodwasher();
translate([rodsize * 15, 0, 0]) nut();
translate([rodsize * 17.5, 0, 0]) washer();



//examples
linearBearing(model="LM8UU");
translate([20,0,0]) linearBearing(model="LM10UU");


module metric_ruler(millimeters)
{
	difference()
	{
		// Body of ruler
		color("Beige")
		cube(size = [length_mm(millimeters), length_cm(3), length_mm(1)]);
		// Centimeter markings
		for (i = [0:length_cm(1):length_mm(millimeters) + epsilon])
		{
			translate([i,length_cm(2.5),length_mm(0.75)])
			color("Red")
			cube(size = [length_mm(0.5), length_cm(1) + epsilon, length_mm(0.5) + epsilon], center = true);
		}
		// Half centimeter markings
		for (i = [length_cm(0.5):length_cm(1):length_mm(millimeters) + epsilon])
		{
			translate([i,length_cm(2.7),length_mm(0.875)])
			color("Red")
			cube(size = [length_mm(0.5), length_cm(0.6) + epsilon, length_mm(0.25) + epsilon], center = true);
		}
		// Millimeter markings
		for (i = [length_mm(1):length_mm(1):length_mm(millimeters) + epsilon])
		{
			translate([i,length_cm(2.85),length_mm(0.9375)])
			color("Red")
			cube(size = [length_mm(0.5), length_cm(0.3) + epsilon, length_mm(0.125) + epsilon], center = true);
		}
	}
}

metric_ruler(100);




include <MCAD/shapes/polyhole.scad>

module polyhole_demo(){
difference() {
	cube(size = [100,27,3]);
    union() {
    	for(i = [1:10]) {
            translate([(i * i + i)/2 + 3 * i , 8,-1])
                mcad_polyhole(h = 5, d = i);

            assign(d = i + 0.5)
                translate([(d * d + d)/2 + 3 * d, 19,-1])
                    mcad_polyhole(h = 5, d = d);
    	}
    }
}
}

polyhole_demo();




include <MCAD/gears/rack_and_pinion.scad>;

// examples of usage
// include this in your code:
// use <rack_and_pinion.scad>
// then:
// a simple rack
rack(4,20,10,1);//CP (mm/tooth), width (mm), thickness(of base) (mm), # teeth
// a simple pinion and translation / rotation to make it mesh the rack
translate([0,-8.5,0])rotate([0,0,360/10/2]) pinion(4,10,10,5);
