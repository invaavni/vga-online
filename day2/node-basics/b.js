console.log('b')

class Rect {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
    }

    area() {
        return this.width * this.height;
    }
}

const rect = new Rect(20, 40);
console.log(rect.area());