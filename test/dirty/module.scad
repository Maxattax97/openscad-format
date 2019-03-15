module gear(number_of_teeth,
		circular_pitch=false, diametral_pitch=false,
		pressure_angle=20, clearance = 0,
		verbose=false)
{
	if(verbose) {
		echo("gear arguments:");
		echo(str("  number_of_teeth: ", number_of_teeth));
		echo(str("  circular_pitch: ", circular_pitch));
		echo(str("  diametral_pitch: ", diametral_pitch));
		echo(str("  pressure_angle: ", pressure_angle));
		echo(str("  clearance: ", clearance));
	}
	if (circular_pitch==false && diametral_pitch==false) echo("MCAD ERROR: gear module needs either a diametral_pitch or circular_pitch");
	if(verbose) echo("gear calculations:");

	//Convert diametrial pitch to our native circular pitch
	circular_pitch = (circular_pitch!=false?circular_pitch:180/diametral_pitch);

	// Pitch diameter: Diameter of pitch circle.
	pitch_diameter  =  pitch_circular2diameter(number_of_teeth,circular_pitch);
	if(verbose) echo (str("  pitch_diameter: ", pitch_diameter));
	pitch_radius = pitch_diameter/2;

	// Base Circle
	base_diameter = pitch_diameter*cos(pressure_angle);
	if(verbose) echo (str("  base_diameter: ", base_diameter));
	base_radius = base_diameter/2;

	// Diametrial pitch: Number of teeth per unit length.
	pitch_diametrial = number_of_teeth / pitch_diameter;
	if(verbose) echo (str("  pitch_diametrial: ", pitch_diametrial));

	// Addendum: Radial distance from pitch circle to outside circle.
	addendum = 1/pitch_diametrial;
	if(verbose) echo (str("  addendum: ", addendum));

	//Outer Circle
	outer_radius = pitch_radius+addendum;
	outer_diameter = outer_radius*2;
	if(verbose) echo (str("  outer_diameter: ", outer_diameter));

	// Dedendum: Radial distance from pitch circle to root diameter
	dedendum = addendum + clearance;
	if(verbose) echo (str("  dedendum: ", dedendum));

	// Root diameter: Diameter of bottom of tooth spaces.
	root_radius = pitch_radius-dedendum;
	root_diameter = root_radius * 2;
	if(verbose) echo (str("  root_diameter: ", root_diameter));

	half_thick_angle = 360 / (4 * number_of_teeth);
	if(verbose) echo (str("  half_thick_angle: ", half_thick_angle));

	union()
	{
		rotate(half_thick_angle) circle($fn=number_of_teeth*2, r=root_radius*1.001);

		for (i= [1:number_of_teeth])
		//for (i = [0])
		{
			rotate([0,0,i*360/number_of_teeth])
			{
				involute_gear_tooth(
					pitch_radius = pitch_radius,
					root_radius = root_radius,
					base_radius = base_radius,
					outer_radius = outer_radius,
					half_thick_angle = half_thick_angle);
			}
		}
	}
}


module involute_gear_tooth(
					pitch_radius,
					root_radius,
					base_radius,
					outer_radius,
					half_thick_angle
					)
{
	pitch_to_base_angle  = involute_intersect_angle( base_radius, pitch_radius );

	outer_to_base_angle = involute_intersect_angle( base_radius, outer_radius );

	base1 = 0 - pitch_to_base_angle - half_thick_angle;
	pitch1 = 0 - half_thick_angle;
	outer1 = outer_to_base_angle - pitch_to_base_angle - half_thick_angle;

	b1 = polar_to_cartesian([ base1, base_radius ]);
	p1 = polar_to_cartesian([ pitch1, pitch_radius ]);
	o1 = polar_to_cartesian([ outer1, outer_radius ]);

	b2 = polar_to_cartesian([ -base1, base_radius ]);
	p2 = polar_to_cartesian([ -pitch1, pitch_radius ]);
	o2 = polar_to_cartesian([ -outer1, outer_radius ]);

	// ( root_radius > base_radius variables )
		pitch_to_root_angle = pitch_to_base_angle - involute_intersect_angle(base_radius, root_radius );
		root1 = pitch1 - pitch_to_root_angle;
		root2 = -pitch1 + pitch_to_root_angle;
		r1_t =  polar_to_cartesian([ root1, root_radius ]);
		r2_t =  polar_to_cartesian([ -root1, root_radius ]);

	// ( else )
		r1_f =  polar_to_cartesian([ base1, root_radius ]);
		r2_f =  polar_to_cartesian([ -base1, root_radius ]);

	if (root_radius > base_radius)
	{
		//echo("true");
		polygon( points = [
			r1_t,p1,o1,o2,p2,r2_t
		], convexity = 3);
	}
	else
	{
		polygon( points = [
			r1_f, b1,p1,o1,o2,p2,b2,r2_f
		], convexity = 3);
	}

}


module test_gears()
{
	gear(number_of_teeth=51,circular_pitch=200);
	translate([0, 50])gear(number_of_teeth=17,circular_pitch=200);
	translate([-50,0]) gear(number_of_teeth=17,diametral_pitch=1);
}

module demo_3d_gears()
{
	//double helical gear
	// (helics don't line up perfectly - for display purposes only ;)
	translate([50,0])
	{
	linear_extrude(height = 10, center = true, convexity = 10, twist = -45)
	 gear(number_of_teeth=17,diametral_pitch=1);
	translate([0,0,10]) linear_extrude(height = 10, center = true, convexity = 10, twist = 45)
	 gear(number_of_teeth=17,diametral_pitch=1);
	}

	//spur gear
	translate([0,-50]) linear_extrude(height = 10, center = true, convexity = 10, twist = 0)
	 gear(number_of_teeth=17,diametral_pitch=1);

}

module test_involute_curve()
{
	for (i=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
	{
		translate(polar_to_cartesian([involute_intersect_angle( 0.1,i) , i ])) circle($fn=15, r=0.5);
	}
}


module mcad_test_nuts_and_bolts_1 ()
{
	$fn = 360;

	translate ([0, 15])
		mcad_nut_hole (3, proj = -1);

	mcad_bolt_hole (3, length = 30,tolerance =10, proj = -1);

}
//mcad_test_nuts_and_bolts_1 ();

module mcad_test_nuts_and_bolts_2 ()
{
	$fn = 360;

	difference(){
		cube(size = [10, 20, 10], center = true);
		union(){
			translate ([0, 15])
				mcad_nut_hole (3, proj = 2);

			linear_extrude (height = 20, center = true, convexity = 10,
			                twist = 0)
			mcad_bolt_hole (3, length = 30, proj = 2);
		}
	}
}
//mcad_test_nuts_and_bolts_2 ();

module mcad_test_nuts_and_bolts_3 ()
{
	$fn = 360;

	mcad_bolt_hole_with_nut (
		size = 3,
		length = 10
	);
}
