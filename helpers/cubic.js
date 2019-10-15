class Cubic {
    constructor(p0, p1, h0, h1) {

        var t0 = h0.sub(p0)
        var t1 = (h1.sub(p1)).scale(-1)

        //a = -2*p1 + t1 + t0 + 2*p0
        this.a = p1.scale(-2).add(t1).add(t0).add(p0.scale(2));
        //b = 3*p1 - t1 - 2*t0 - 3*p0
        this.b = p1.scale(3).sub(t1).sub(t0.scale(2)).sub(p0.scale(3));
        //c = t0
        this.c = t0;
        //d = p0
        this.d = p0;

    }

    evaluateAt(t) {
        var t3 = (this.a).scale( t*t*t )
        var t2 = (this.b).scale( t*t   )
        var t1 = (this.c).scale( t     )
        var t0 = (this.d).scale( 1     )

        return t3.add(t2).add(t1).add(t0)
    }

    derivativeAt(t) {
        var t3 = (this.a).scale( 3*t*t )
        var t2 = (this.b).scale( 2*t   )
        var t1 = (this.c).scale( 1     )

        return t3.add(t2).add(t1)
    }

    getPoints( n, t0, t1 ) {

        var points = []
        for(var i = 0; i < n; i++) {
            var t = t0 + ((t1-t0)/n) * i;
            var vec = this.evaluateAt(t)
            points.push( vec )
        }

        return points

    }

    print() {
      console.log(this.a);
      console.log(this.b);
      console.log(this.c);
      console.log(this.d);
    }

  }