/**
 * -=-=-=-=-=-( Physik Simulation )-=-=-=-=-=-=-
 * @author  = Alexander Niedermayer
 * @date    = 23.02.2016
 * @version = 1.0 Alpha
 * @description = Physikalische Simulation verschiedener kinetischer Experimente
 *  - Bewegungen
 *  - Kollision
 *  - (un)elastische Stöße
 *  - Gravitation
 *  - Reibung
 *
 * --------------------------------------
 *  - This is just an open-source school project of mine. It normally contains
 *    some more components but I cut it down for this special use
 */

//######## Kostanten  / Einstellungen ########//

var   WIDTH   = 535,
      HEIGHT  = 375,
      FPS     = 60,
      SCALE   = 100, // 100px = 1m
      g       = 9.81, // Gravitation
      THROW_STRENGTH = 0.5, // Wurfstärke der Maus -> Wie weit wird das Objekt fliegen
      CIRCLE_COLLSISION = false, // Beeinflussen der Y Geschwindigkeit bei seitlichem Aufeinanderprallen
      SOLID_BORDERS = true,// Werden die Objekte auf die andere Seite teleportiert, falls die die Grenze überschreiten

      //######### Elemente #########//
      DISPLAY = document.getElementById("display"),
      CTX     = DISPLAY.getContext("2d");

//#######################################//

//############## Variablen ##############//

var BOUNCE_SLOW = 0.75; // Wie stark wird die x Geschwindigkeit bei einem Aufprall veringert

//############## Objekte ################//

/**
 * Datenobjekt zum speichern versch. Daten
 * @constructor
 */

function Data() {
    // Größe des Datenspeichers
    this.size = 1000;
    // Array in dem die Daten gespeichert werden
    this.data = new Array(this.size);

    /**
     * Methode zum hinzufügen versch. Werte
     * Hierbei werden alle Werte einen Speicherplatz nach hinten geschoben
     * | 5 | 2 | 4 |
     * -> | 2 | 4 | neuer Wert |
     * @param data
     */

    this.addData = function addData(data) {
        var oldData = data;
        for(var i = this.size-1; i >= 0; i--) {
            var _oldData = this.data[i];
            this.data[i] = oldData;
            oldData = _oldData;
        }

    }

    /**
     * Leeren des Arrays und somit die damit verbundenen Daten
     */

    this.clear = function clear() {
        for(var i = 0; i < this.data.length; i++) {
            this.data[i] = null;
        }
    }
}

/**
 * In diesem Objekt werden alle Objekte, welche sich in der aktuellen Szene
 * befinden gespeichert und somit können diese auch untereinander interagieren.
 * Dies wird z.B. für das erkennen einer Kollision benötigt.
 * @constructor
 */

function MainHandler() {

    // In diesem Array werden alle Objekte gespeichert
    this.Entities    = new Array();
    this.id       = 1;

    /**
     * Methode zum Erstellen neuer Objekte, diese werden beim Erstellen sofort
     * dem Array Entities hinzugefügt
     * @param x
     * @param y
     * @param w
     * @param h
     * @param m
     * @returns {Entity}
     */

    this.createEntity = function createEntity(x,y,w,h,m) {
        // Erstelle eine neue Instanz einer "Entity"
        var e = new Entity(x,y,w,h,m);
        // Füge diese Instanz dem Array hinzu
        this.Entities[this.Entities.length] = e;
        return e;
    }

    this.deleteEntity = function deleteEntity(ent) {

        ent.w = 0;
        ent.h = 0;
        ent.hasGravity = false;
        ent.y = 1000;
        ent.hasVelocity = false;

        //selectedElement = null;

        for(var i = 0; i < this.Entities.length; i++) {

            if(this.Entities[i] == ent) {

                this.Entities.splice(i, 1);

                return 0;
            }

        }

    }

    /**
     * Erhalte ein Objekt nach seiner ID
     * @param id
     * @returns {Entity, null}
     */

    this.getEntityById = function getEntityById(id) {

        for(var i = 0; i < this.Entities.length; i++) {
            if(this.Entities[i].id == id) {
                return this.Entities[i];
            }
        }

        return null;

    }

}

// Erstellen einer Art statischen Klasse
var MH = new MainHandler();

/**
 * Verschiedene Modi zum Aufnehmen der Eigenschaften
 * @constructor
 */

function RecordMode() {
    this.VELOCITYX = 1;
    this.VELOCITYY = 2;
    this.VELOCITY  = 3;
    this.PULSE     = 4;
}

var RecordMode = new RecordMode();

/**
 * Objekt, welches in der Physik Simulation als Beispiel verwendet wird.
 * Hier werden alle möglichen Werte zum Objekt gespeichert. Ebenso stellt
 * dieses Objekt verschiedene Funktionen zur Verfügung, welche z.B. Kollisionen
 * mit anderen Objekten ermitteln
 * @param x coordinate
 * @param y coordinate
 * @param w width
 * @param h height
 * @param m mass in g
 * @constructor
 */

function Entity(x,y,w,h,m) {

    this.x = x; // x Koordinate
    this.y = y; // y Koordinate
    this.w = w; // Breite
    this.h = h; // Höhe
    this.m = m; // Masse

    this.id = MH.id++;

    this.c = "Red"; // Farbe des Objekts

    this.friction = 0.972; // Reibungszahl ( Falls das Objekt auf dem Boden gleitet wird die
                           // x Geschwindigkeit mit diesem Wert multipliziert

    this.energyLoss = 1;   // Verlust der Energie bei Stößen

    this.stickingObject = null; // Probeweise für Inelastische Stöße
    this.slidingObject = null;  // Objekt, auf dem dieses Objekt gerade gleitet
    this.inAir         = true;  // Boolscher Wert, welcher Angibt ob sich das Objekt in der Luft befindet
    this.selected      = false; // Boolscher Wert, welcher Angibt ob das Element zurteit selektiert ist
    this.hasGravity    = true;  // Boolscher Wert um die Gravitation zu (de)aktivieren
    this.hasVelocity   = true;  // Boolscher Wert um die Bewegung zu (de)aktivieren
    this.hasCollision  = true;
    this.isParticle    = false;

    this.data = new Data(); // Neue Instanz eines Data Objekt um dort die Daten zu speichern
    //this.dataStorage = new AfterwardsCalc(); // Datenspeicher für die nachträgliche Anzeige

    this.recordMode = 0; // Aufnahme Modus - Welcher Wert soll aufgenommen werden?

    this.oldPosition   = [x,y]; // Position ein Bild vorher zum ermitteln des Bewegungsvektor
    this.dragVelocity  = [0,0]; // Bewegungsvektor ( Verwendet im Editor für die Wurfbewegung )
    this.velocity      = [0, 0]; // Bewegung in x und y Richtung ( 0: x 1: y )

    /**
     * Funktion zum setzen der Bewegung
     * @param dx
     * @param dy
     */

    this.setVelocity = function setVelocity(dx, dy) {

        if(this.velocity[1] == 0 && dy != 0) {
            this.slidingObject = null;
            this.inAir = true;
        }

        this.velocity[0] = dx;
        this.velocity[1] = dy;

    }

    /**
     * Methode zum zeichnen des Objekts auf den Canvas
     */

    this.draw = function draw() {
        CTX.fillStyle = "Black"; // Setzt die Farbe auf schwarz
        //if(this.selected) // Falls das Element im Editor ausgewählt wurde soll..
            // Ein schwarzer Rahmen um das Objekt gezeichnet werden
            // ( in diesem Fall ein weiteres Viereck hinter dem Objekt )
            //CTX.fillRect(this.x-strokeWidth, this.y-strokeWidth, this.w + strokeWidth*2, this.h + strokeWidth*2);
        CTX.fillStyle = this.c; // Setzt die Farbe auf die eingestellte FArbe
        CTX.fillRect(this.x, this.y, this.w, this.h); // Zeichnet schlussendlich das Objekt

    }

    /**
     * Funktion zum simulieren einer gleichmäßigen Beschleunigung
     * @param a in m/s²
     * @param t in ms
     */

    this.accelerate = function accelerate(a, t) {

        var pA = a, object = this;

        var acc = setInterval(function() {
            object.velocity[0] += pA/FPS;
        }, 1000/FPS);

        setTimeout(function() {
            clearInterval(acc);
        }, t);
    }

    /**
     * Funktion zum Ermitteln der Gesamtgeschwindigkeit
     * @returns {number}
     */

    this.getSpeed = function getSpeed() {
        // Verwendung vom Satz des Pythagoras zur Ermittlung der Gesamtgeschwindigkeit
        return Math.sqrt(Math.pow(this.velocity[0], 2) + Math.pow(this.velocity[1], 2));
    }

    /**
     * Funktion zum Ermitteln des Impulses
     * @returns {number}
     */

    this.getPulse = function getPulse() {
        // p = m*v;
        return this.getSpeed()*this.m;
    }

    /**
     * Funktion zum berechnen des Geschwindigkeitsverlust auf einem anderen Objekt.
     * Sprich Reibung
     */

    this.frictionCalc = function frictionCalc() {
        if(this.slidingObject != null || !this.inAir) {
            // Berechnung der Reibung   μ1 + μ2
            //                        -----------
            //                             2
            // Masse wurde zurzeit noch nicht berücksichtigt
            var calculatedFriction = (this.friction + this.slidingObject.friction)/2;
            if(calculatedFriction != 0)
                this.velocity[0] *= calculatedFriction;

        }

    }

    /**
     * Aufnehmen von Daten
     */

    this.recordData = function recordData() {

        switch(this.recordMode) {
            case RecordMode.VELOCITYX:
                this.data.addData(this.velocity[0]);
                break;
            case RecordMode.VELOCITYY:
                this.data.addData(this.velocity[1]);
                break;
            case RecordMode.VELOCITY:
                this.data.addData(this.getSpeed());
                break;
            case RecordMode.PULSE:
                this.data.addData(this.getPulse());
                break;
            default:
                break;

        }

    };

    /**
     * Funktion um das Objekt zu bewegen, hier werden ebenso Kollisionen
     * und Stöße errechnet bzw. erkannt
     * @param x px
     * @param y px
     * @returns {number, Entity}
     */

    this.move = function move(x,y) {
        // Abspeichern der neuen Koordinaten
        var coord = {
            x: this.x +x,
            y: this.y +y
        };

        // Schleife, welche alle in der Szene vorkommenden Objekte überprüft
        for(var i = 0; i < MH.Entities.length; i++) {
            var e = MH.Entities[i];
            // Falls das aktuelle Objekt nicht dieses Objekt ist soll...
            if(e != this && this.hasCollision && !e.isParticle) {
                // Einerseits überprüft werden ob diese Objekte nicht überlappen
                if (coord.x < e.x + e.w &&
                    coord.x + this.w > e.x &&
                    coord.y < e.y + e.h &&
                    this.h + coord.y > e.y) {

                    // Berechnung des Energieverlusts bei Stößen
                    var energyLoss = (this.energyLoss + e.energyLoss) / 2;
                    // Berechne den Stoß, falls das vorhandene Objekt nicht statisch ist
                    if (e.hasVelocity) {
                    // Stoßberechnung für einen elastischen Stoß
                        if(energyLoss != 0) {

                            //############# Elastischer Stoß ################//

                            // Berechne v1' und v2' mit den physikalischen Formeln
                            var newVelocity1 = [this.velocity[0] * ((1 - e.m / this.m) / (1 + e.m / this.m)) * energyLoss, this.velocity[1] * ((1 - e.m / this.m) / (1 + e.m / this.m)) * energyLoss];
                            var newVelocity2 = [2 * this.velocity[0] / (1 + e.m / this.m) * energyLoss, 2 * this.velocity[1] / (1 + e.m / this.m) * energyLoss];

                            //---------- Speichern im Datenarray -----------//

                            /*var dataToSave = this.dataStorage.createData(1, [newVelocity1, newVelocity2, this.velocity]);
                            console.log("##############")
                            console.log(dataToSave[1]);
                            this.dataStorage.addDataSlot(dataToSave);
                            console.log("Added new Data");*/

                            //----------------------------------------------//

                            // Falls das Objekt nicht auf dem zweiten Objekt liegt soll die
                            // x Geschwindigkeit verändert werden ( ansonsten würde dieses Objekt
                            // wegrutschen
                            if (this.y + this.h > e.y)
                                e.velocity[0] = newVelocity2[0] + e.velocity[0];

                            // Überprüfe ob die Y Geschwindigkeit bei einem seitlichen Zusammenprall übertragen wird.
                            if(CIRCLE_COLLSISION)
                                e.velocity[1] = newVelocity2[1] + e.velocity[1];

                            // Überprüfe ob das Objekt  auf einem anderen Objekt gelandet ist
                            if (this.x + this.w > e.x && this.x < e.x + e.w && this.y + this.h <= e.y) {
                                this.inAir       = false;
                                this.velocity[1] = newVelocity1[1];
                                // Neu setzen des Y Werts auf die exakte Höhe des Objekts, andererseits
                                // würde es davor noch kurze Zeit auf dem Objekt schweben
                                this.y = e.y - this.h;
                                // Falls die y Geschwindigkeit nahezu 0 ist, gilt das Objekt nun als
                                // auf dem Boden gelandet
                                if (this.velocity[1] > -0.05) {
                                    this.slidingObject = e;
                                } else {
                                    // Falls das Objekt nicht auf dem Boden gelandet ist
                                    // Soll die x Geschwindigkeit veringert werden
                                    this.velocity[0] *= BOUNCE_SLOW;
                                }

                            } else {
                                // Falls das Objekt nicht auf dem 2. Objekt liegt wird
                                // die Geschwindigkeit mit der berechneten überschrieben
                                this.velocity[0] = newVelocity1[0];

                                if(CIRCLE_COLLSISION)
                                    this.velocity[1] = newVelocity1[1];

                            }

                            // Falls die y Geschindigkeit stark genug ist um das Objekt noch spürbar
                            // in die Luft zu katapultieren, werden die Werte geändert,
                            // damit es keine Reibung mehr erhält
                            if (this.velocity[1] < -0.05) {
                                this.inAir         = true;
                                this.slidingObject = null;
                            }

                            return e;

                        } else {

                            /* -------------------------------- *\
                             * Inelastischer Stoß muss über-
                             * arbeitet werden
                            \* -------------------------------- */

                            this.stickingObject = e;
                            // Neue Geschwindigkeit der Objekte wird berechnet siehe Formel
                            // für einen inelastischen Stoß
                            var newVelocity = [
                                ((this.m*this.velocity[0]) + (e.m*e.velocity[0])) / (this.m + e.m),
                                ((this.m*this.velocity[1]) + (e.m * e.velocity[1])) / (this.m + e.m)
                            ];
                            this.velocity = newVelocity;
                            e.velocity = newVelocity;

                            // Hiermit werden die Objekte aneinander "geheftet"
                            if(this.x < e.x) {
                                this.x = e.x - this.w+1;
                            } else {
                                this.x = e.x + e.w;
                            }

                        }

                    } else {
                        // Hier wird nun der Abprall des Objektes auf einem statischen
                        // Objekt ermittelt
                        this.velocity[1] *= 0;//-1*energyLoss; // vertikaler Geschwindigkeitsverlust
                        if(this.velocity[1] <= -0.05) {
                            this.velocity[0] *= 0.75; // horizontaler Geschwindigkeitsverlust
                            this.slidingObject = null;
                            this.inAir = true;
                        } else {
                            this.slidingObject = e;
                            this.inAir = false;
                        }
                        return e;

                    }
                }

            }

        }

        // Überprüfe ob das Objekt mit dem Rand kollidiert
        if(SOLID_BORDERS) {

            if(coord.x+this.w > WIDTH || coord.x < 0) {
                // Objekt bewegt sich nach links
                if(this.velocity[0] > 0) {
                    this.x = WIDTH-this.w;
                } else {
                    // Objekt bewegt sich nach rechts
                    this.x = 0;
                }

                this.velocity[0] = 0;

                return 1;
            }

        }

        // Falls es keine Kollision gab, werden einfach die Koordinaten neu gesetzt
        this.x += x;
        this.y += y;

        // Mit diesem Code wird ermittelt ob sich das Objekt auserhalb des Bildschirms
        // befindet, falls dies der Fall ist, werden die Koordinaten auf die andere
        // Seite des Bildschirms gesetzt
        if(!SOLID_BORDERS) {
            if (this.x >= WIDTH) {
                this.x = 1 - this.w;
            } else if (this.x + this.w < 0) {
                this.x = WIDTH - 1;
            }
        }
        return 0;

    }

}

var ground, player, enemy;

/**
 * Initialize function being called once at the start
 */

function initPhysX() {

    DISPLAY.setAttribute("width", WIDTH.toString());
    DISPLAY.setAttribute("height", HEIGHT.toString());

    player = MH.createEntity(50,300,50,50, 100);
    player.c = "White";
    player.energyLoss = 0.1;
    player.friction = 0.99;
    ground = MH.createEntity(0,350,800,50, 50);
    ground.hasGravity = false;
    ground.hasVelocity = false;
    ground.energyLoss = 0.0;
    ground.c = "#222";
    enemy = MH.createEntity(400,300,50,50, 100);
    enemy.energyLoss = 0.1;
    enemy.friction = 0.99;
    setTimeout(function() {
        enemy.c = usedColor;
    }, 500);

}

initPhysX();


/**
 * Loop methode welche sich FPS mal in der Sekunde wiederholt
 * Hier werden alle Berechnungen aufgerufen etc.
 */

function animate() {
    // Leert die Zeichenoberfläche
    CTX.clearRect(0,0, WIDTH, HEIGHT);
    // Geht alle Objekte durch und führt die Funktionen aus
    for(var i = 0; i < MH.Entities.length; i++) {
        var e = MH.Entities[i];
        // Das Objekt wird pro x Geschwindigkeit bewegt
        e.move(e.velocity[0]*SCALE/FPS, 0);
        // Die Reibung wird ausgerechnet falls vorhanden
        e.frictionCalc();
        // Falls Daten aufgenommen werden, werden diese hier erfasst
        e.recordData();
        // Das Objekt wird auf dem Bildschirm gezeichnet
        e.draw();

        if(e.hasGravity) {
            e.velocity[1] += g/SCALE; // Die m/s² werden der y Geschwindigkeit hinzugefügt
            e.move(0, e.velocity[1]*SCALE/FPS); // Das Objekt wird nun um die Geschwindigkeit nach unten bewegt
        }
    }

}

var ANIMATION = setInterval(animate, 1000/FPS); // Hier wird nun dafür gesorgt, dass animate FPS mal pro Sekunde
                                // ausgeführt wird
