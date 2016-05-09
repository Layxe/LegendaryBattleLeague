function ParticleTypes() {

    this.EXPLOSION = 0;
    this.SPREAD    = 1;

}

var ParticleType = new ParticleTypes();

function Particle(x, y, w, h, color, collision) {

    // ### Variablen ### //
    this.x      = x;
    this.y      = y;
    this.width  = w;
    this.height = h;
    this.color  = color;
    this.entity = MH.createEntity(this.x, this.y, this.width, this.height, 0.000001);
    this.entity.c = this.color;
    this.entity.hasCollision = collision;

    this.getParticle = function getParticle() {

        return this.entity;

    }

}

/**
 * @param x
 * @param y
 * @param color
 * @param amount
 * @param lifetime
 * @constructor
 */
function ParticleSystem(x, y, color, amount, lifetime) {

    this.x         = x;
    this.y         = y;
    this.color     = color;
    this.amount    = amount;
    this.lifetime  = lifetime;
    this.collision = false;

    // Advanced settings
    this.dimension = [3,3]; // 3px width and height
    this.strength  = [2,2]; // Velocity in x and y direction

    this.particles = new Array(this.amount);

    this.setCollsion = function setCollision(bool) {

        this.collision = bool;

    }

    this.start = function start(options) {

        var type = options[0];
        if(options.length > 1) {
            var dx = options[1];
            var dy = options[2];
        }

        var particleSystem = this;

        for(var i = 0; i < this.particles.length; i++) {

            this.particles[i] = new Particle(this.x, this.y, this.dimension[0], this.dimension[1], this.color, this.collision);
            this.particles[i].getParticle().isParticle = true;

        }

        switch(type) {

            case ParticleType.EXPLOSION:

                for(var i = 0; i < this.amount; i++) {

                    this.particles[i].getParticle().velocity = [(Math.random()*2-1)*this.strength[0], (Math.random()*-2)*this.strength[1]];

                }

                break;

            case ParticleType.SPREAD:

                for(var i = 0; i < this.amount; i++) {

                    this.particles[i].getParticle().velocity = [dx*Math.random(), dy*Math.random()];

                }

                break;

        }

        setTimeout(function() {

            for(var i = 0; i < particleSystem.amount; i++) {
                MH.deleteEntity(particleSystem.particles[i].getParticle());

            }
            particleSystem.particles = [];
        }, this.lifetime);

    }

}