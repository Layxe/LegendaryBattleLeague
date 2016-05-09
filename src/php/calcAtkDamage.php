<?php

session_start();

class Attack {

    public $type, $effect;

    function __construct($attackType, $attackEffect) {

        $this->type   = $attackType;
        $this->effect = $attackEffect;

    }

}

class AttackType {

    public static $DASH      = 0;
    public static $JUMP      = 1;
    public static $JUMP_DASH = 2;
    public static $BLINK     = 3;
    public static $GRAB      = 4;
    public static $SHOT      = 5;
    public static $HEAL      = 6;
    public static $PROTECT   = 7;
    public static $MAGIC     = 8;
    public static $FIRE      = 9;

}

class AttackEffect {

    public static $KNOCK_UP   = 0;
    public static $STUN       = 1;
    public static $DAMAGE     = 2;
    public static $KNOCK_BACK = 3;
    public static $NONE       = 4;
    public static $BURN       = 5;

}

$allowed = false;

if(isset($_GET['champion']) && isset($_GET['token']) && isset($_SESSION['summonerName']) && isset($_SESSION['lobby'])) {

    $name = $_GET['champion'];

    $lobby = json_decode(Lobbies::getLobby($_SESSION['lobby']));

    if (
        $lobby->{"player1"} == $_SESSION['summonerName'] && $lobby->{"mode"} == 1 ||
        $lobby->{"player2"} == $_SESSION['summonerName'] && $lobby->{"mode"} == 2
    )
        $allowed = true;


    if(hasChampion($name, $_SESSION['summonerName']) && $allowed && $_GET['token'] == $_SESSION['token']) {
        if($lobby->{"mode"} == 1)
            $lobby->{"mode"} = 3;
        else
            $lobby->{"mode"} = 5;

        Lobbies::createLobby($_SESSION['lobby'], $lobby);

        // Get the champions "special" attack
        $attack = getAttack($name);
        // Get the players attack stats
        $playerObj = json_decode(file_get_contents("players/" . $_SESSION['summonerName'] . ".json"));
        // Physical Damage
        $damageValue = $playerObj->{"attack"};
        // Magical Damage
        $abilityValue = $playerObj->{"ability"};

        $useAbilityPower = false;

        // Calculate the damage
        switch($attack->type) {

            case AttackType::$DASH:
                $damageValue*=1.25;
                $abilityValue*=1.25;
                break;

            case AttackType::$JUMP:
                $damageValue*=1.5;
                $abilityValue*=1.5;
                break;

            case AttackType::$JUMP_DASH:
                $damageValue*=1.75;
                $abilityValue*=1.75;
                break;

            case AttackType::$BLINK:
                $damageValue*=1.3;
                $abilityValue*=1.3;
                break;

            case AttackType::$GRAB:
                $damageValue*=1.35;
                $abilityValue*=1.35;
                break;

            case AttackType::$SHOT:
                $damageValue*=2;
                $abilityValue*=2;
                break;

            case AttackType::$PROTECT:
                $damageValue*=0;
                $abilityValue*=0;
                break;
            case AttackType::$HEAL:
                $damageValue*=0.35;
                $abilityValue*=0.35;
                break;
            case AttackType::$FIRE:
                $damageValue*=1.6;
                $abilityValue*=1.6;
                break;
        }

        // Decide whether to use ability or physical damage
        switch($attack->effect) {

            case AttackEffect::$STUN:
                $useAbilityPower = true;
                break;

            case AttackEffect::$NONE:
                $useAbilityPower = true;
                break;
            case AttackEffecT::$BURN:
                $useAbilityPower = true;
                break;

        }

        // Calculated attack points
        $finalValue = $damageValue;

        if($useAbilityPower) {
            $finalValue = $abilityValue;
        }

        // Get enemy player and apply the damage

        $lobby = json_decode(Lobbies::getLobby($_SESSION['lobby']));
        $usedPlayer = "";
        $usedPlayerNumber = 1;

        // Decide used player
        if($lobby->{"player1"} == $_SESSION['summonerName']) {
            // Apply damage to player 2 if it isn't a heal
            if($attack->type == AttackType::$HEAL) {
                $usedPlayer = $lobby->{"player1"};
            } else {
                $usedPlayer = $lobby->{"player2"};
                $usedPlayerNumber = 1;
            }

        } else if($lobby->{"player2"} == $_SESSION['summonerName']) {
            // Same here
            $usedPlayerNumber = 2;
            if($attack->type == AttackType::$HEAL) {
                $usedPlayer = $lobby->{"player2"};
            } else {
                $usedPlayer = $lobby->{"player1"};
            }
        }

        $usedPlayerObj = json_decode(file_get_contents("players/" . $usedPlayer . ".json"));

        if($attack->type != AttackType::$HEAL) {
            if($usedPlayerObj->{"health"} - $finalValue >= 0)
                $usedPlayerObj->{"health"} -= $finalValue;
            else
                $usedPlayerObj->{"health"} = 0;

        } else {
            if($usedPlayerObj->{"health"} + $finalValue > $usedPlayerObj->{"maxHealth"}) {
                $usedPlayerObj->{"health"} = $usedPlayerObj->{"maxHealth"};
            } else {
                $usedPlayerObj->{"health"} += $finalValue;
            }

        }

        Player::updatePlayer($usedPlayer ,json_encode($usedPlayerObj));

        // Attack has been executed now make the client side and lobby thing ( much english such wow )
        $data = array(
            "player" => $usedPlayerNumber,
            "type"   => $attack->type,
            "effect" => $attack->effect
        );

        echo json_encode($data);

        $lobby->{"action"} = $usedPlayerNumber . "_" . $attack->type . "_" . $attack->effect . "_" . rand(0, 10000);
        Lobbies::createLobby($_SESSION['lobby'], $lobby);

    } else {

        echo "CHEAT";

    }


}

function hasChampion($champ, $name) {

    $json_data = file_get_contents("players/" . $name . ".json");
    $json_obj  = json_decode($json_data);

    for($i = 0; $i < 4; $i++) {

        if($json_obj->{"champs"}[$i]->{"name"} == $champ) {
            return true;
        }

    }

    return false;

}

class Lobbies {

    public static function createLobby($name, $lobbyObj) {

        $fileHandle = fopen("lobby/" . $name . ".json", "w");
        fwrite($fileHandle, json_encode($lobbyObj));
        fclose($fileHandle);

    }

    public static function joinLobby($lobbyName, $password) {

        $lobbyData = self::getLobby($lobbyName);
        $lobbyObj  = json_decode($lobbyData);

        if($lobbyObj->{"password"} == md5($password)) {
            if ($lobbyObj->{"player1"} == "") {
                $lobbyObj->{"player1"} = $_SESSION['summonerName'];
                self::createLobby($lobbyName, $lobbyObj);
                $_SESSION['lobby'] = $lobbyName;

                echo "true";

            } else if ($lobbyObj->{"player2"} == "") {

                $lobbyObj->{"player2"} = $_SESSION['summonerName'];
                self::createLobby($lobbyName, $lobbyObj);
                $_SESSION['lobby'] = $lobbyName;

                echo "true";

            } else {

                echo "full";

            }

        } else {
            echo "pw";
        }

    }

    public static function getLobby($name) {

        $data = file_get_contents("lobby/" . $name . ".json");
        if($data != false) {
            return $data;
        } else {
            echo "<";
        }

    }

    public static function deleteLobby($name) {

        unlink("lobby/" . $name . ".json");

    }

    public static function leaveLobby($name) {

        $lobbyData      = self::getLobby($_SESSION['lobby']);
        $playerPosition = self::getPlayerPosition($name);
        $lobbyObj       = json_decode($lobbyData);

        if($playerPosition == 1) {
            $lobbyObj->{"player1"} = "";

        } else if($playerPosition == 2) {
            $lobbyObj->{"player2"} = "";

        }


        if($lobbyObj->{"player1"} == "" && $lobbyObj->{"player2"} == "") {

            self::deleteLobby($_SESSION['lobby']);

        } else {
            if($lobbyObj->{"player1"} == "") {
                self::deleteLobby($_SESSION['lobby']);
            } else {
                self::createLobby($_SESSION['lobby'], $lobbyObj);
            }
        }

        unset($_SESSION['lobby']);


    }

    public static function getPlayerPosition($name) {

        $lobbyData = self::getLobby($_SESSION['lobby']);
        $lobbyObj  = json_decode($lobbyData);

        if($lobbyObj->{"player1"} == $name) {
            return 1;
        } else if($lobbyObj->{"player2"} == $name) {
            return 2;
        } else {
            return 0;
        }

    }

}

class Player {

    public static function updatePlayer($name, $playerData) {

        $fileHandle = fopen("players/" . $name . ".json", "w");
        fwrite($fileHandle, $playerData);
        fclose($fileHandle);

    }

    public static function getPlayer($name) {

        $data = file_get_contents("players/" . $name . ".json");

        return $data;

    }

    public static function deletePlayer($name) {

        unlink("players/" . $name . ".json");

    }

}


function getAttack($name) {

    switch($name) {

        case "Thresh":
            return new Attack(AttackType::$GRAB, AttackEffect::$STUN);
            break;

        case "Aatrox":
            return new Attack(AttackType::$JUMP_DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Ahri":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Akali":
            return new Attack(AttackType::$BLINK, AttackEffect::$KNOCK_BACK);
            break;

        case "Alistar":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Amumu":
            return new Attack(AttackType::$JUMP, AttackEffect::$STUN);
            break;

        case "Anivia":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Annie":
            return new Attack(AttackType::$FIRE, AttackEffect::$BURN);
            break;

        case "Ashe":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "AurelionSol":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Azir":
            return new Attack(AttackType::$JUMP, AttackEffect::$KNOCK_BACK);
            break;

        case "Bard":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Blitzcrank":
            return new Attack(AttackType::$GRAB, AttackEffect::$DAMAGE);
            break;

        case "Brand":
            return new Attack(AttackType::$FIRE, AttackEffect::$BURN);
            break;

        case "Braum":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Caitlyn":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Cassiopeia":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Cho'Gath":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Corki":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Darius":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Diana":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Dr.Mundo":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Draven":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Ekko":
            return new Attack(AttackType::$BLINK, AttackEffect::$KNOCK_BACK);
            break;

        case "Elise":
            return new Attack(AttackType::$JUMP, AttackEffect::$DAMAGE);
            break;

        case "Evelynn":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Ezreal":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Fiddlesticks":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Fiora":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Fizz":
            return new Attack(AttackType::$JUMP, AttackEffect::$DAMAGE);
            break;

        case "Galio":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Gangplank":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Garen":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Gnar":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Gragas":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Graves":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Hecarim":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Heimerdinger":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Illaoi":
            return new Attack(AttackType::$JUMP_DASH, AttackEffect::$DAMAGE);
            break;

        case "Irelia":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Janna":
            return new Attack(AttackType::$HEAL, AttackEffect::$NONE);
            break;

        case "JarvanIV":
            return new Attack(AttackType::$JUMP_DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Jax":
            return new Attack(AttackType::$JUMP, AttackEffect::$DAMAGE);
            break;

        case "Jayce":
            return new Attack(AttackType::$JUMP_DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Jhin":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Jinx":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Kalista":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Karma":
            return new Attack(AttackType::$HEAL, AttackEffect::$DAMAGE);
            break;

        case "Karthus":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Kassadin":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Katarina":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Kayle":
            return new Attack(AttackType::$FIRE, AttackEffect::$BURN);
            break;

        case "Kennen":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Kha'Zix":
            return new Attack(AttackType::$JUMP, AttackEffect::$DAMAGE);
            break;

        case "Kindred":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Kog'Maw":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "LeBlanc":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "LeeSin":
            return new Attack(AttackType::$BLINK, AttackEffect::$KNOCK_BACK);
            break;

        case "Leona":
            return new Attack(AttackType::$DASH, AttackEffect::$STUN);
            break;

        case "Lissandra":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Lucian":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Lulu":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Lux":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Malphite":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Malzahar":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Maokai":
            return new Attack(AttackType::$DASH, AttackEffect::$STUN);
            break;

        case "MasterYi":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "MissFortune":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Mordekaiser":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Morgana":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Nami":
            return new Attack(AttackType::$HEAL, AttackEffect::$NONE);
            break;

        case "Nasus":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Nautilus":
            return new Attack(AttackType::$GRAB, AttackEffect::$DAMAGE);
            break;

        case "Nidalee":
            return new Attack(AttackType::$JUMP, AttackEffect::$DAMAGE);
            break;

        case "Nocturne":
            return new Attack(AttackType::$JUMP_DASH, AttackEffect::$DAMAGE);
            break;

        case "Nunu":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Olaf":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Orianna":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Pantheon":
            return new Attack(AttackType::$JUMP, AttackEffect::$STUN);
            break;

        case "Poppy":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Quinn":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Rammus":
            return new Attack(AttackType::$DASH, AttackEffect::$STUN);
            break;

        case "Rek'Sai":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Renekton":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Rengar":
            return new Attack(AttackType::$JUMP, AttackEffect::$DAMAGE);
            break;

        case "Riven":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Rumble":
            return new Attack(AttackType::$FIRE, AttackEffect::$DAMAGE);
            break;

        case "Ryze":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Sejuani":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Shaco":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Shen":
            return new Attack(AttackType::$DASH, AttackEffect::$STUN);
            break;

        case "Shyvana":
            return new Attack(AttackType::$FIRE, AttackEffect::$KNOCK_BACK);
            break;

        case "Singed":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Sion":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Sivir":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Skarner":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Sona":
            return new Attack(AttackType::$HEAL, AttackEffect::$NONE);
            break;

        case "Soraka":
            return new Attack(AttackType::$HEAL, AttackEffect::$NONE);
            break;

        case "Swain":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Syndra":
            return new Attack(AttackType::$MAGIC, AttackEffect::$KNOCK_BACK);
            break;

        case "TahmKench":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Talon":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Taric":
            return new Attack(AttackType::$HEAL, AttackEffect::$NONE);
            break;

        case "Teemo":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Tristana":
            return new Attack(AttackType::$SHOT, AttackEffect::$KNOCK_BACK);
            break;

        case "Trundle":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "Tryndamere":
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
            break;

        case "TwistedFate":
            return new Attack(AttackType::$BLINK, AttackEffect::$STUN);
            break;

        case "Twitch":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Udyr":
            return new Attack(AttackType::$DASH, AttackEffect::$STUN);
            break;

        case "Urgot":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Varus":
            return new Attack(AttackType::$SHOT, AttackEffect::$DAMAGE);
            break;

        case "Vayne":
            return new Attack(AttackType::$SHOT, AttackEffect::$KNOCK_BACK);
            break;

        case "Veigar":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Vel'Koz":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Vi":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Viktor":
            return new Attack(AttackType::$MAGIC, AttackEffect::$DAMAGE);
            break;

        case "Vladimir":
            return new Attack(AttackType::$HEAL, AttackEffect::$DAMAGE);
            break;

        case "Volibear":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_BACK);
            break;

        case "Warwick":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Wukong":
            return new Attack(AttackType::$BLINK, AttackEffect::$KNOCK_BACK);
            break;

        case "Xerath":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "XinZhao":
            return new Attack(AttackType::$DASH, AttackEffect::$KNOCK_UP);
            break;

        case "Yasuo":
            return new Attack(AttackType::$BLINK, AttackEffect::$KNOCK_UP);
            break;

        case "Yorick":
            return new Attack(AttackType::$PROTECT, AttackEffect::$NONE);
            break;

        case "Zac":
            return new Attack(AttackType::$JUMP, AttackEffect::$KNOCK_UP);
            break;

        case "Zed":
            return new Attack(AttackType::$BLINK, AttackEffect::$DAMAGE);
            break;

        case "Ziggs":
            return new Attack(AttackType::$FIRE, AttackEffect::$DAMAGE);
            break;

        case "Zilean":
            return new Attack(AttackType::$MAGIC, AttackEffect::$STUN);
            break;

        case "Zyra":
            return new Attack(AttackType::$MAGIC, AttackEffect::$KNOCK_UP);
        break;

        default:
            return new Attack(AttackType::$DASH, AttackEffect::$DAMAGE);
        break;
    }

}

?>