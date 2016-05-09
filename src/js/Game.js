/*#######################
* TODO
* - Zufälliges Auslosen eines Gegners
* - KI
* - Rundensystem
* -
*
 */


/* ######## Variablen ######## */

var player, enemy;

var DASH_SPEED  = 2.5;
var JUMP_HEIGHT = -3.5;

var useAbilities = false;

//---- Konstanten

const health = document.getElementById("health");
const mana   = document.getElementById("mana");

/* ######## Initialisierung ######## */

function initGame() {

    var summoner = getSummonerInformation();
    setAbilities(summoner.champs);
    updateStats();
    initPhysX();

}

/* ######## Fähigkeiten ###### */

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

function updateStats() {

    var summoner = getSummonerInformation();

    mana.firstElementChild.innerHTML = summoner.mana + " / " + summoner.maxMana;
    health.firstElementChild.innerHTML = summoner.health + " / " + summoner.maxHealth;

    mana.style.width = summoner.mana/summoner.maxMana*100+"%";
    health.style.width = summoner.health/summoner.maxHealth*100+"%";

}



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

//################### ATTACKEN #################//

/**
 * Wie viel Schaden machen die Angriffe
 * @constructor
 */
/*
function SpellValues(enemyUse) {
    // Erhalte den Angreifer
    var attacker = enemyUse ? enemy : player;

    this.getAttackValue = function getAttackValue(attackType, attackEffect) {
        var value = 0;
        
            switch(attackType) {
                case AttackType.JUMP_DASH:
                    value += attacker.atk / 2;
                    break;
                case AttackType.GRAB:
                    value += attacker.ap / 2;
                    break;
                case AttackType.HEAL:
                    value += attacker.ap;
                    break;
    
            }
    
            switch(attackEffect) {
                case AttackEffect.DAMAGE:
                    value += (attacker.atk + attacker.ap)* 0.75;
                    break;
                case AttackEffect.STUN:
                    value += attacker.ap * 0.75;
                    break;
                case AttackEffect.KNOCK_BACK:
                    value += attacker.atk * 0.75;
                    break;
                case AttackEffect.KNOCK_UP:
                    value += attacker.atk * 0.75;
                    break;
            }

        return value;
    }
}

*/
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
}

var AttackEffect = new AttackEffects();

/**
 * Attacken Element
 * @param type
 * @param effect
 * @constructor
 */

function Attack(type, effect) {

    this.type   = type;
    this.effect = effect;

}

function executeAttack(attack, enemyUse) {

    switch(attack.type) {

        case AttackType.DASH:
            player.object.velocity[0] = DASH_SPEED;
            break;

        case AttackType.GRAB:
            enemy.object.velocity[0] = -1*DASH_SPEED;
            break;

        case AttackType.JUMP:
            player.object.setVelocity(DASH_SPEED, JUMP_HEIGHT);
            break;
        case AttackType.BLINK:
            player.object.x = 450;

            setTimeout(function() {
                // Teleportiere den Angreifer
                if(enemyUse)
                    enemy.object.x = 0;
                else
                    player.object.x = 450;
                // Entscheide, wie der Schaden dem Gegner zugefügt wird
                if(attack.effect == AttackEffect.KNOCK_BACK) {

                    new Moves(enemyUse).blinkKnockBack();

                } else if(attack.effect == AttackEffect.DAMAGE) {

                    new Moves(enemyUse).blinkDamage();

                }

            }, 500);

            break;


    }

    // Zurücksetzen der Positionen
    setTimeout(function() {

        player.object.x = 50;
        enemy.object.x  = 400;

    }, 5000);

}

function applyDamage(attackType, attackEffect, enemyUse) {

    var victim = enemyUse ? player : enemy;

    victim.health -= new SpellValues(enemyUse).getAttackValue(attackType, attackEffect);

}


function Moves(enemyUse) {

    var direction  = 1,
        originPos  = 50;

    if(enemyUse) {
        direction  = -1;
        originPos = 400;
    }

    this.blinkDamage = function blinkDamage() {



    }

    this.blinkKnockBack = function blinkKnockBack() {
        // Erstes Kicken des Opfers
        enemy.object.setVelocity(-1*DASH_SPEED*2*direction, 0);
        setTimeout(function() {
            // Zweites Teleportieren
            player.object.x = originPos;
            setTimeout(function() {
                // Kick auf die alte Position
                enemy.object.setVelocity(DASH_SPEED*1.3*direction,0);
                setTimeout(function() {
                    applyDamage(AttackType.BLINK, AttackEffect.KNOCK_BACK, enemyUse);
                }, 500);

            }, 200);
        }, 650);
    }

}

function callAttack(name) {

    // Welche Attackenart soll angewendet werden?
    switch(name) {

        case "Thresh":
            return new Attack(AttackType.GRAB, AttackEffect.STUN);
        break;

        case "Aatrox":
            return new Attack(AttackType.JUMP_DASH, AttackEffect.KNOCK_UP);
        break;

        case "Ahri":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Akali":
            return new Attack(AttackType.BLINK, AttackEffect.KNOCK_BACK);
        break;

        case "Alistar":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_UP);
        break;

        case "Amumu":
            return new Attack(AttackType.JUMP, AttackEffect.STUN);
        break;

        case "Anivia":
            return new Attack(AttackType.SHOT, AttackEffect.STUN);
        break;

        case "Annie":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Ashe":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "AurelionSol":
            return new Attack(AttackType.SHOT, AttackEffect.STUN);
        break;

        case "Azir":
            return new Attack(AttackType.JUMP, AttackEffect.KNOCK_BACK);
        break;

        case "Bard":
            return new Attack(AttackType.SHOT, AttackEffect.STUN);
        break;

        case "Blitzcrank":
            return new Attack(AttackType.GRAB, AttackEffect.DAMAGE);
        break;

        case "Brand":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Braum":
            return new Attack(AttackType.PROTECT, AttackEffect.DAMAGE);
        break;

        case "Caitlyn":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Cassiopeia":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Cho'Gath":
            return new Attack(AttackType.SHOT, AttackEffect.KNOCK_UP);
        break;

        case "Corki":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Darius":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Diana":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Dr.Mundo":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Draven":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Ekko":
            return new Attack(AttackType.BLINK, AttackEffect.KNOCK_BACK); //########################################
        break;

        case "Elise":
            return new Attack(AttackType.JUMP, AttackEffect.DAMAGE);
        break;

        case "Evelynn":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Ezreal":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Fiddlesticks":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Fiora":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Fizz":
            return new Attack(AttackType.JUMP, AttackEffect.DAMAGE);
        break;

        case "Galio":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Gangplank":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Garen":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Gnar":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Gragas":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Graves":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Hecarim":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Heimerdinger":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Illaoi":
            return new Attack(AttackType.JUMP_DASH, AttackEffect.DAMAGE);
        break;

        case "Irelia":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Janna":
            return new Attack(AttackType.HEAL, AttackEffect.NONE);
        break;

        case "JarvanIV":
            return new Attack(AttackType.JUMP_DASH, AttackEffect.KNOCK_UP);
        break;

        case "Jax":
            return new Attack(AttackType.JUMP, AttackEffect.DAMAGE);
        break;

        case "Jayce":
            return new Attack(AttackType.JUMP_DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Jhin":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Jinx":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Kalista":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Karma":
            return new Attack(AttackType.HEAL, AttackEffect.DAMAGE);
        break;

        case "Karthus":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Kassadin":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Katarina":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Kayle":
            return new Attack(AttackType.PROTECT, AttackEffect.NONE);
        break;

        case "Kennen":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Kha'Zix":
            return new Attack(AttackType.JUMP, AttackEffect.DAMAGE);
        break;

        case "Kindred":
            return new Attack(AttackType.PROTECT, AttackEffect.DAMAGE);
        break;

        case "Kog'Maw":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "LeBlanc":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "LeeSin":
            return new Attack(AttackType.BLINK, AttackEffect.KNOCK_BACK);
        break;

        case "Leona":
            return new Attack(AttackType.DASH, AttackEffect.STUN);
        break;

        case "Lissandra":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Lucian":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Lulu":
            return new Attack(AttackType.PROTECT, AttackEffect.NONE);
        break;

        case "Lux":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Malphite":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_UP);
        break;

        case "Malzahar":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Maokai":
            return new Attack(AttackType.DASH, AttackEffect.STUN);
        break;

        case "MasterYi":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "MissFortune":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Mordekaiser":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Morgana":
            return new Attack(AttackType.SHOT, AttackEffect.STUN);
        break;

        case "Nami":
            return new Attack(AttackType.HEAL, AttackEffect.NONE);
        break;

        case "Nasus":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Nautilus":
            return new Attack(AttackType.GRAB, AttackEffect.DAMAGE);
        break;

        case "Nidalee":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Nocturne":
            return new Attack(AttackType.JUMP_DASH, AttackEffect.DAMAGE);
        break;

        case "Nunu":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Olaf":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Orianna":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Pantheon":
            return new Attack(AttackType.JUMP, AttackEffect.STUN);
        break;

        case "Poppy":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Quinn":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Rammus":
            return new Attack(AttackType.DASH, AttackEffect.STUN);
        break;

        case "Rek'Sai":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_UP);
        break;

        case "Renekton":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Rengar":
            return new Attack(AttackType.JUMP, AttackEffect.DAMAGE);
        break;

        case "Riven":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_UP);
        break;

        case "Rumble":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Ryze":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Sejuani":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Shaco":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Shen":
            return new Attack(AttackType.DASH, AttackEffect.STUN);
        break;

        case "Shyvana":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Singed":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Sion":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Sivir":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Skarner":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Sona":
            return new Attack(AttackType.HEAL, AttackEffect.NONE);
        break;

        case "Soraka":
            return new Attack(AttackType.HEAL, AttackEffect.NONE);
        break;

        case "Swain":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Syndra":
            return new Attack(AttackType.SHOT, AttackEffect.KNOCK_BACK);
        break;

        case "TahmKench":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Talon":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Taric":
            return new Attack(AttackType.HEAL, AttackEffect.NONE);
        break;

        case "Teemo":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Tristana":
            return new Attack(AttackType.SHOT, AttackEffect.KNOCK_BACK);
        break;

        case "Trundle":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "Tryndamere":
            return new Attack(AttackType.DASH, AttackEffect.DAMAGE);
        break;

        case "TwistedFate":
            return new Attack(AttackType.SHOT, AttackEffect.STUN);
        break;

        case "Twitch":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Udyr":
            return new Attack(AttackType.DASH, AttackEffect.STUN);
        break;

        case "Urgot":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Varus":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Vayne":
            return new Attack(AttackType.SHOT, AttackEffect.KNOCK_BACK);
        break;

        case "Veigar":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Vel'Koz":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Vi":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_UP);
        break;

        case "Viktor":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Vladimir":
            return new Attack(AttackType.HEAL, AttackEffect.DAMAGE);
        break;

        case "Volibear":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_BACK);
        break;

        case "Warwick":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Wukong":
            return new Attack(AttackType.BLINK, AttackEffect.KNOCK_BACK);
        break;

        case "Xerath":
            return new Attack(AttackType.SHOT, AttackEffect.STUN);
        break;

        case "XinZhao":
            return new Attack(AttackType.DASH, AttackEffect.KNOCK_UP);
        break;

        case "Yasuo":
            return new Attack(AttackType.BLINK, AttackEffect.KNOCK_UP);
        break;

        case "Yorick":
            return new Attack(AttackType.PROTECT, AttackEffect.NONE);
        break;

        case "Zac":
            return new Attack(AttackType.JUMP, AttackEffect.KNOCK_UP);
        break;

        case "Zed":
            return new Attack(AttackType.BLINK, AttackEffect.DAMAGE);
        break;

        case "Ziggs":
            return new Attack(AttackType.SHOT, AttackEffect.DAMAGE);
        break;

        case "Zilean":
            return new Attack(AttackType.PROTECT, AttackEffect.NONE);
        break;

        case "Zyra":
            return new Attack(AttackType.SHOT, AttackEffect.KNOCK_UP);

    }

}