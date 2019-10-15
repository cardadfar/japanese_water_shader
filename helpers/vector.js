class Vector3 {
    constructor(x,y,z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    add(v2) {
        return new Vector3(this.x + v2.x,
                           this.y + v2.y, 
                           this.z + v2.z)
    }

    sub(v2) {
        return new Vector3(this.x - v2.x,
                           this.y - v2.y, 
                           this.z - v2.z)
    }

    scale(s) {
        return new Vector3(this.x * s,
                           this.y * s, 
                           this.z * s)
    }

    print() {
      console.log(this.x);
      console.log(this.y);
      console.log(this.z);
    }
  }