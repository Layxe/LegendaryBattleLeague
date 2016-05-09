// ###### Variablen ###### //
var DASH_SPEED  = 3;
var JUMP_HEIGHT = -4;

var useAbilities = true;

//---- Konstanten

const health = document.getElementById("health");
const mana   = document.getElementById("mana");

/* ######## Initialisierung ######## */


function initGame() {

    var summoner = getSummonerInformation();
    setAbilities(summoner.champs);
    updateStats();

}

/* ######## Fähigkeiten ###### */

/**
 * Verschiedene Modi, in denen der Angreifer zum Gegner gelangt
 * @constructor
 */

function AttackTypes() {
    this.DASH      = 0;
    this.JUMP      = 1;
    this.JUMP_DASH = 2;
    this.BLINK     = 3;
    this.GRAB      = 4;
    this.SHOT      = 5;
    this.HEAL      = 6;
    this.PROTECT   = 7;
    this.MAGIC     = 8;
    this.FIRE      = 9;
}

var AttackType = new AttackTypes();

/**
 * Verschiedene Auswirkungen der Attacken auf den Gegner
 * @constructor
 * */

function AttackEffects() {
    this.KNOCK_UP   = 0;
    this.STUN       = 1;
    this.DAMAGE     = 2;
    this.KNOCK_BACK = 3;
    this.NONE       = 4;
    this.BURN       = 5;
}

var AttackEffect = new AttackEffects();


// Array mit den 4 Fähigkeiten-Bilder
var image = new Array(4);

for(var i = 0; i < 4; i++) {
    image[i] = document.getElementById("image-" + i);
}

// Funktion zum Ändern der Bild-Quelle, für die Fähigkeiten
function setAbilities(champs) {

    for(var i = 0; i < image.length; i++) {
        image[i].setAttribute("src", "http://ddragon.leagueoflegends.com/cdn/6.7.1/img/champion/" + champs[i].name.replace(/\s/g, '') + ".png");
        image[i].setAttribute("name", champs[i].name.replace(/\s/g, ''));
    }

}

function updateStats(summoner, enemy) {

    if(enemy != null) {
        mana.firstElementChild.innerHTML = enemy.health + " / " + enemy.maxHealth;
        mana.style.width                 = enemy.health/enemy.maxHealth*100+"%";
    }
    if(summoner != null) {
        health.style.width                 = summoner.health / summoner.maxHealth * 100 + "%";
        health.firstElementChild.innerHTML = summoner.health + " / " + summoner.maxHealth;
    }

    return summoner;

}

/**
 * Methode zum de- aktivieren der klientseitigen Attacken
 * @param bool
 */

function allowAbilities(bool) {

    useAbilities = bool;

    if(!bool) {

        for(var i = 0; i < image.length; i++) {

            image[i].style.filter = "grayscale(1)";
            image[i].style.webkitFilter = "grayscale(1)";
            image[i].style.mozFilter = "grayscale(1)";

        }

    } else {

        for(var i = 0; i < image.length; i++) {

            image[i].style.filter = "grayscale(0)";
            image[i].style.webkitFilter = "grayscale(0)";
            image[i].style.mozFilter = "grayscale(0)";

        }

    }

}

/**
 * Methode zum serverseitigen Ausführen der Attacken
 * @param champion
 */

function executeAttack(champion) {
    if(useAbilities) {
        allowAbilities(false);
        var hr = new XMLHttpRequest();
        hr.open("GET", "src/php/calcAtkDamage.php?champion=" + champion + "&token=" + token, false);
        hr.send();

        console.log(hr.response);

    }
}

function executeMove(attack) {

    var enemyUse = attack.player;

    var victim = enemy;
    var attacker = player;

    // Decide the motion of the attack
    var direction = 1;
    var tpCoord   = 450;
    var originCoord = 50;
    var particleColor = "white";

    if(enemyUse == 2) {

        victim    = player;
        attacker  = enemy;
        direction = -1;
        originCoord = 400;
        tpCoord   = 0;
        particleColor = "orange";

    }

    var Move = new Moves(attacker, victim, direction, tpCoord, originCoord);
    var particleTemplate = new ParticleTemplates(attacker, originCoord, particleColor, direction);
    var decideMove = new DecideMove(attack, Move);

    // Switch method doesn't work somehow, so I have to do it the ugly way :/

        if(attack.type == AttackType.DASH) {

            // ########## DASH ######## //

            attacker.velocity[0] = DASH_SPEED*direction*2;

            var particleInterval = setInterval(function() {
                // attacker.x+25 = Mitte des Objekts
                var ps = new ParticleSystem((attacker.x+25)-(26*direction), 325, "red", 5, 4000);
                ps.setCollsion(true);
                ps.start([ParticleType.SPREAD, direction*-3, -4]);

                var ps2 = new ParticleSystem((attacker.x+25)-(26*direction), 325, particleColor, 2, 4000);
                ps2.setCollsion(true);
                ps2.start([ParticleType.SPREAD, direction*-3, -4]);
            }, 50);

            setTimeout(function() {
                clearInterval(particleInterval);
            }, 500);

            setTimeout(function() {
                decideMove.decide();
            }, 750);

        } else if(attack.type == AttackType.GRAB) {

            // ########## GRAB ######## //

            victim.velocity[0] = -1.6*DASH_SPEED*direction;

        } else if(attack.type == AttackType.JUMP) {

            // ########## JUMP ######### //

            attacker.setVelocity(DASH_SPEED*direction*0.75, JUMP_HEIGHT);

            setTimeout(function() {
                particleTemplate.jumpParticle();
            }, 20);

            setTimeout(function() {
                decideMove.decide();
            }, 1000);

        } else if(attack.type == AttackType.BLINK) {

            // ######### BLINK ######### //

            attacker.x = tpCoord;

            particleTemplate.blinkParticle();

            setTimeout(function() {
                // Entscheide, wie der Schaden dem Gegner zugefügt wird
                decideMove.decide();

            }, 500);

        } else if(attack.type == AttackType.JUMP_DASH) {

            // ########## JUMP DASH ########## //

            attacker.setVelocity(0, -5);

            setTimeout(function() {
                var ps = new ParticleSystem(attacker.x+25, attacker.y+51, particleColor, 30, 3000);
                ps.start([ParticleType.EXPLOSION]);
            }, 50);

            setTimeout(function() {
                attacker.velocity = [4*direction, 0.5];
            }, 500);

            setTimeout(function() {
                decideMove.decide();
            }, 1200);

        } else if(attack.type == AttackType.HEAL) {

            // ############# HEAL ########### //

            Move.heal();

        } else if(attack.type == AttackType.SHOT) {

            // ############ SHOT ########### //

            var bullet = new Particle(attacker.x+(66*direction), attacker.y+25, 15, 10, "#555", true);
            bullet.getParticle().friction = 1;
            bullet.getParticle().hasGravity = false;
            bullet.getParticle().velocity[0] = 5*direction;

            var ps = new ParticleSystem(attacker.x+(55*direction), attacker.y+25, "yellow", 5, 200);
            ps.setCollsion(true);
            ps.start([ParticleType.EXPLOSION]);

            setTimeout(function() {
                MH.deleteEntity(bullet.getParticle());
                decideMove.decide();
            }, 520);

        } else if(attack.type == AttackType.MAGIC) {

            // ############## MAGIC ############# //

            var bullet = new Particle(attacker.x+(66*direction), attacker.y+25, 15, 10, "blue", true);
            bullet.getParticle().friction = 1;
            bullet.getParticle().hasGravity = false;
            bullet.getParticle().velocity[0] = 2.5*direction;

            var interval = setInterval(function() {
                var ps = new ParticleSystem(bullet.getParticle().x+4, bullet.getParticle().y+4, "lightblue", 5, 1000);
                ps.start([ParticleType.EXPLOSION]);
            }, 50);

            setTimeout(function() {
                MH.deleteEntity(bullet.getParticle());
                decideMove.decide();
                clearInterval(interval);
            }, 1040);

        } else if(attack.type == AttackType.FIRE) {

            // ############## FIRE ############# //

            var interval = setInterval(function() {

                var ps = new ParticleSystem((attacker.x+25)+(30*direction), attacker.y + 20, "red", 3, 750);
                ps.setCollsion(true);
                ps.start([ParticleType.SPREAD, direction*6, -3]);

                var ps2 = new ParticleSystem((attacker.x+25)+(30*direction), attacker.y + 20, "orange", 3, 750);
                ps2.setCollsion(true);
                ps2.start([ParticleType.SPREAD, direction*6, -3]);

            }, 50);

            var burnInterval = setInterval(function() {

                var ps = new ParticleSystem(victim.x+25, victim.y-5, "red", 3, 750);
                ps.setCollsion(true);
                ps.start([ParticleType.SPREAD, 1, -5]);


                var ps2 = new ParticleSystem(victim.x+25, victim.y-5, "red", 3, 750);
                ps2.setCollsion(true);
                ps2.start([ParticleType.SPREAD, -1, -5]);

            }, 200);

            setTimeout(function() {

                clearInterval(interval);
                clearInterval(burnInterval);

            }, 3000);

        }

    // Zurücksetzen der Positionen
    setTimeout(function() {

        player.x = 50;
        enemy.x  = 400;

    }, 5000);

}

function ParticleTemplates(attacker, originCoord, particleColor, direction) {

    this.attacker      = attacker;
    this.originCoord   = originCoord;
    this.particleColor = particleColor;
    this.direction     = direction;

    this.jumpParticle = function jumpParticle() {

        var ps = new ParticleSystem(this.attacker.x+25, this.attacker.y+51, this.particleColor, 30, 4000);
        ps.setCollsion(true);
        ps.start([ParticleType.SPREAD, this.direction*2, -4]);

    }

    this.blinkParticle = function blinkParticle() {

        var ps = new ParticleSystem(this.originCoord+25, 340, "#1F1F1F", 20, 1000);
        ps.setCollsion("true");
        ps.start([ParticleType.EXPLOSION]);

        var ps2 = new ParticleSystem(this.originCoord+25, 340, "darkgray", 20, 1000);
        ps2.setCollsion("true");
        ps2.start([ParticleType.EXPLOSION]);

    }

}

function DecideMove(attack, move) {

    this.move = move;
    this.attack = attack;

    this.decide = function decide() {

        if (attack.effect == AttackEffect.DAMAGE) {

            move.damage();

        } else if (attack.effect == AttackEffect.KNOCK_UP) {

            move.knockUp();

        } else if (attack.effect == AttackEffect.KNOCK_BACK) {

            if(attack.type == AttackType.BLINK) {
                move.blinkKnockBack();
            } else {
                move.knockBack();
            }

        } else if (attack.effect == AttackEffect.STUN) {
            move.stun();

        }

    }

}

function Moves(attacker, victim, direction, tpCoord, originCoord) {

    this.damage = function damage() {

        var ps = new ParticleSystem(victim.x+25, victim.y+25, "red", 15, 3000);
        ps.start([ParticleType.EXPLOSION]);

    }

    this.knockUp = function knockUp() {

        var ps = new ParticleSystem(victim.x+25, victim.y+25, "red", 20, 3000);
        ps.start([ParticleType.EXPLOSION]);
        victim.setVelocity(0, -4);

    }

    this.knockBack = function knockBack() {

        var ps = new ParticleSystem(victim.x+25, victim.y+25, "red", 20, 3000);
        ps.start([ParticleType.EXPLOSION]);
        victim.setVelocity(direction*3, 0);

    }

    this.heal = function heal() {

        var interval = setInterval(function() {
            var ps = new ParticleSystem(attacker.x+25, attacker.y+-5, "chartreuse", 10, 1000);
            ps.setCollsion(true);
            ps.start([ParticleType.EXPLOSION]);

            var ps2 = new ParticleSystem(attacker.x+25, attacker.y-5, "lightblue", 10, 1000);
            ps2.start([ParticleType.EXPLOSION]);
        }, 250);

        setTimeout(function() {
            clearInterval(interval);
        }, 3000);

    }

    this.stun = function stun() {
        var interval = setInterval(function() {

            var ps = new ParticleSystem(victim.x+25, victim.y+25, "blue", 15, 2000);
            ps.start([ParticleType.EXPLOSION]);

        }, 200);

        setTimeout(function() {
            attacker.x = originCoord;
        }, 400);

        setTimeout(function() {
            clearInterval(interval);
        }, 3000);

    }

    this.blinkKnockBack = function blinkKnockBack() {
        // Erstes Kicken des Opfers
        victim.setVelocity(-1*DASH_SPEED*2*direction, 0);
        setTimeout(function() {
            // Zweites Teleportieren
            attacker.x = originCoord;
            setTimeout(function() {
                // Kick auf die alte Position
                victim.setVelocity(DASH_SPEED*1.3*direction,0);
                setTimeout(function() {

                }, 500);

            }, 200);
        }, 650);
    }

}