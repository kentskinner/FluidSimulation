// Ported from C code written by Jos Stam, described in the 
// paper "Real-Time Fluid Dynamics for Games"
// http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf

var Solver = (function() {

	function dens_step(N,x,x0,u,v,diff,dt) {
		// //add_source(N,x,x0,dt);
		x[30][1] += dt * 10.0;
		// // x0 = clone(x); diffuse(N,0,x,x0,diff,dt);
		x0 = clone(x); advect(N,0,x,x0,u,v,dt);
	}
	
	function diffuse(N, b, x, x0, diff, dt) {
		var a = dt * diff * N * N;
		for(var k = 0; k < 20; k++) {
			for(var i=1; i <= N; i++) {
				for(var j=1; j <= N; j++) {
					x[i][j] = (x0[i][j] + a * (x[i-1][j]+x[i+1][j]+x[i][j-1]+x[i][j+1]))/(1+4*a);
				}
			}
			set_bnd(N, b, x);
		}
	}
	
	function set_bnd(N, b, x) {	
		for(var i=1;i <= N; i++) {
			x[0][i] 	= b == 1 ? -x[1][i] : x[1][i];
			x[N+1][i] 	= b == 1 ? -x[N][i] : x[N][i];
			x[i][0] 	= b == 2 ? -x[i][1] : x[i][1];
			x[i][N+1] 	= b == 2 ? -x[i][N] : x[i][N];
		}
		x[0][0] 	   = 0.5 * (x[1][0] 	 + x[0][1]);
		x[0][N+1]   = 0.5 * (x[1][N+1] + x[0][N]);
		x[N+1][0]   = 0.5 * (x[N][0] 	 + x[N+1][1]);
		x[N+1][N+1] = 0.5 * (x[N][N+1] + x[N+1][N]);		
		
		for(var i=x1; i <= x2; i++) {
			x[i][y1] = b == 2 ? -x[i][y1-1] : x[i][y1-1];
			x[i][y2] = b == 2 ? -x[i][y2+1] : x[i][y2+1];
		}
		for(var j=y1; j <= y2; j++) {
			x[x1][j] = b == 1 ? -x[x1-1][j] : x[x1-1][j];
			x[x2][j] = b == 1 ? -x[x2+1][j] : x[x2+1][j];
		}
		x[x1][y1] = 0.5 *  ( (b == 1 ? -x[x1-1][y1] : x[x1-1][y1]) + 
							 (b == 2 ? -x[x1][y1-1] : x[x1][y1-1]) );
		x[x1][y2] = 0.5 *  ( (b == 1 ? -x[x1-1][y2] : x[x1-1][y2]) + 
							 (b == 2 ? -x[x1][y2+1] : x[x1][y2+1]) );
	}

	function advect(N, b, d, d0, u, v, dt) {
		var dt0 = dt * N;
		for(var i=1; i <= N; i++) {
			for(var j=1; j <= N; j++) {
				var x = i - dt0 * u[i][j];
				var y = j - dt0 * v[i][j];
				if (x<0.5) x = 0.5;
				if (x>N+0.5) x=N +0.5;
				var i0 = Math.floor(x);
				var i1 = i0 + 1;
				if (y<0.5) y = 0.5;
				if (y>N+0.5) y=N +0.5;
				var j0 = Math.floor(y);
				var j1 = j0 + 1;
				var s1 = x-i0; var s0 = 1-s1; var t1=y-j0;var t0=1-t1;
				d[i][j]=s0*(t0*d0[i0][j0]+t1*d0[i0][j1])+
						s1*(t0*d0[i1][j0]+t1*d0[i1][j1]);
			}
		}
		set_bnd(N,b,d);
	}

	function add_source(N,x,x0,dt) {
		//var sx = 1 + Math.floor(N/2);
		//var sy = 1 + Math.floor(N/3);
		//x[sx][sy] += 5.0;
		//x[1][20] += 5.0;
		//x[sx-1][sy] += 1.0;
		//x[sx+1][sy] += 1.0;
		//x[sx][sy-1] += 1.0;
		//x[sx][sy+1] += 1.0;
	}

	function vel_step ( N, u, v, u0, v0, visc, dt )
	{	
		u[1][20] += dt * 10.0;
		//add_source ( N, u, u0, dt ); add_source ( N, v, v0, dt );
		var u0 = clone(u); //diffuse ( N, 1, u, u0, visc, d`t );
		var v0 = clone(v); //diffuse ( N, 2, v, v0, visc, dt );
		project ( N, u, v, u0, v0 );
		u0 = clone(u); v0 = clone(v);
		advect ( N, 1, u, u0, u0, v0, dt ); advect ( N, 2, v, v0, u0, v0, dt );
		project ( N, u, v, u0, v0 );
	}

	function project(N, u, v, p, div) {
		var h = 1.0/N;
		for ( i=1 ; i<=N ; i++ ) {
			for ( j=1 ; j<=N ; j++ ) {
				div[i][j] = -0.5*h*(u[i+1][j]-u[i-1][j]+
								v[i][j+1]-v[i][j-1]);
				p[i][j] = 0;
			}
		}
		set_bnd ( N, 0, div ); set_bnd ( N, 0, p );
		for ( k=0 ; k<20 ; k++ ) {
			for ( i=1 ; i<=N ; i++ ) {
				for ( j=1 ; j<=N ; j++ ) {
					p[i][j] = (div[i][j]+p[i-1][j]+p[i+1][j]+
					p[i][j-1]+p[i][j+1])/4;
				}
			}
			set_bnd ( N, 0, p );
		}
		for ( i=1 ; i<=N ; i++ ) {
			for ( j=1 ; j<=N ; j++ ) {
				u[i][j] -= 0.5*(p[i+1][j]-p[i-1][j])/h;
				v[i][j] -= 0.5*(p[i][j+1]-p[i][j-1])/h;
			}
		}
		set_bnd ( N, 1, u ); set_bnd ( N, 2, v );
	}
	return {
		vel_step: vel_step,
		dens_step: dens_step
	};
})();

var FluidSimulation = function(config) {
	this.config = config;
	
	this.x = [];	// Density
	this.u = [];	// Velocity-x
	this.v = [];	// Velocity-y
	for(var i=0; i < this.config.N + 2; i++) {
		this.x[i] = []; 
		this.u[i] = []; 
		this.v[i] = [];
		for(var j=0; j < this.config.N + 2; j++) {
			this.x[i][j] = 0.0;
			this.u[i][j] = 0.0;
			this.v[i][j] = 0.0;
		}
	}
};

FluidSimulation.prototype = {
	constructor: FluidSimulation,
	step: function() {		
		Solver.vel_step(this.config.N, this.u, this.v, [], [], this.config.visc, this.config.dt);
		var x0 = clone(this.x);
		Solver.dens_step(this.config.N, this.x, x0, this.u, this.v, this.config.diff, this.config.dt);
	}
};

function clone(x) {
	var c = [];
	for(var i=0; i < x.length; i++)
		c[i] = x[i].slice(0);
	return c;
}	

var x1 = 45; var x2 = 48;
var y1 = 5; var y2 = 38;