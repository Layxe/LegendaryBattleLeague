<?php

session_start();

error_reporting(0);

$api_key = "";

$userValue = "";
$useName = false;
$disableVerification = false;

// Entscheide, ob die Daten per ID oder Name aufgerufen werden
if(isset($_GET['name']) || isset($_GET['id'])) {
    if (isset($_GET['name'])) {
        // Wurde mit Name aufgerufen
        $userValue = $_GET['name'];
        $useName = true;

    } else {
        // Wurde per Id aufgerufen
        $userValue = $_GET['id'];

    }
}

if($userValue != "") { // Falls Name oder Id gesetzt wurden
    if (isset($_GET['token']) && isset($_GET['type'])) { // Überprüfen ob jeweils 2 Parameter vorhanden sind

        $token = $_GET['token'];
        $type = $_GET['type'];

        // Sicherheitscheck aktiv ( Der Auf dem Server liegenden Token stimmt mit dem Klientseitigen überein )
        if($token == $_SESSION['token']) {

            // Erste Suche
            if(!$_SESSION['init'] && $useName) {
                // Initialisiere den Spieler
                $_SESSION['init'] = true;
                $_SESSION['name'] = $userValue;
                // Erhalte Informationen über den Spieler ( Id, profileId, level )
                $playerInfos = getPlayerInfo($userValue);

                $nameLowerCase = strtolower($userValue);
                // Vereinfachen der Variablen
                $playerId     = $playerInfos->{$nameLowerCase}->{'id'};
                $playerIconId = $playerInfos->{$nameLowerCase}->{'profileIconId'};
                $playerLevel  = $playerInfos->{$nameLowerCase}->{'summonerLevel'};

                $_SESSION['id'] = $playerId;

                // Nun haben wir die ID, das SummonerIcon etc. zum Darstellen brauchen wir nur das Icon und das Level
                echo $playerLevel . "," . $playerIconId . "," . $playerId;

            }

            // Lösche die JSON Datei, falls der Spieler die Seite verlässt / neu lädt
            if($type == "logout") {

                if(isset($_SESSION['lobby'])) {

                    include_once("Lobby.php");
                    Lobby::leaveLobby($_SESSION['name']);

                }

                if(isset($_SESSION['name'])) {

                    Players::deletePlayer($_SESSION['name']);
                    session_destroy();
                    echo "location.reload()";

                } else {
                    echo "console.log('I guess someone doesnt want to logout properly?')";
                }

            }

        }

    }

} else if(isset($_SESSION['name']) && isset($_GET['token']) && $_SESSION['init']) {
    if($_SESSION['token'] == $_GET['token']) {

        if ($_GET['type'] == "summoner") {
            $summonerInformation = file_get_contents("players/" . $_SESSION['name'] . ".json");
            echo $summonerInformation;

        }

        // Vergleiche die Namen der Masteries um schlussendlich den Account zu verifizieren
        // Falls der Account erfolgreich verifiziert wurde ist der summonerName nicht ""
        if($_GET['type'] == "masteries" && isset($_SESSION['verify'])) {

            $id = $_SESSION['id'];

            if(searchForMasteries($id, $_SESSION['verify']) || $disableVerification) { // ####################################################
                $_SESSION['summonerName'] = $_SESSION['name']; // Official name
                echo "true";

                createPlayer();

            } else {
                echo "false";
            }

        }

    }

}

/**
 * Funktion zum erstellen des Spielers
 */

function createPlayer() {

    // Weiterhin brauchen wir jedoch auch die am häufigsten gespielten Champions und deren Informationen
    $champMastery = getMostPlayedChamps($_SESSION['id']);
    // Erstelle ein neues Array und fülle es mit den notwendigen Daten über die Champions
    $champs = array();

    for($i = 0; $i < 4; $i++) {

        $champs[$i] = getChampInfo($champMastery[$i]->{"championId"});
        $champs[$i]->{"name"} = str_replace(' ', '', $champs[$i]->{"name"});

    }

    // Berechne die notwendigen Daten für das Spiel ( serverseitig, sonst gibt es irgendwelche Cheater... )
    $sumAtk = 0;
    $sumDef = 0;
    $sumMag = 0;
    // Erfasse die Summe der Werte aller Champions
    for($i = 0; $i < 4; $i++) {
        // Falls jemand 200k Punkte auf einem Champion hat, werden dessen Werte verdoppelt
        $sumAtk += $champs[$i]->{"atk"} * (($champMastery[$i]->{"championPoints"}/200000) + 1);
        $sumDef += $champs[$i]->{"def"} * (($champMastery[$i]->{"championPoints"}/200000) + 1);
        $sumMag += $champs[$i]->{"magic"} * (($champMastery[$i]->{"championPoints"}/200000) + 1);

    }

    $attack = round($sumAtk*3);
    $health = round($sumDef/4*100);
    $mana = round($sumMag/4*100);
    $ability = round($sumMag*4);

    // Verändere die Stats je nach Level des Champion

    // Erstelle nun ein Spielerobjekt und speichere es als JSON Datei auf dem Server
    $playerObj = array(
        "name"      => $_SESSION['summonerName'],
        "id"        => $_SESSION['id'],
        //"iconId"  => $playerIconId, I guess these values are
        //"level"   => $playerLevel,  not necessary
        "attack"    => $attack,
        "ability"   => $ability,
        "health"    => $health,
        "mana"      => $mana,
        "maxMana"   => $mana,
        "maxHealth" => $health,
        "champs"    => $champs
    );

    Players::updatePlayer($_SESSION['name'], json_encode($playerObj));

}

/** Methode zum Abgleichen des Verifizierungscode
 * @param $name
 * @param $verifyCode
 * @return bool
 */

function searchForMasteries($id, $verifyCode) {
    global $api_key;
    $url = "https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/75537519/masteries?api_key=$api_key";

    $json_data = file_get_contents($url);
    $json_obj  = json_decode($json_data);

    $masteries = $json_obj->{$id}->{"pages"};

    for($i = 0; $i < sizeof($masteries); $i++) {

        if($masteries[$i]->{"name"} == $verifyCode) {
            return true;

        }

    }


    return false;
}

/** Methode zum erhalten verschiedener Informationen über den Spieler
 * @param $name
 * @return mixed
 */

function getPlayerInfo($name) {

    global $api_key;
    $url           = "https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/by-name/$name?api_key=$api_key";
    $json_data     = file_get_contents($url);
    $json_obj      = json_decode($json_data);

    return $json_obj;

}

/** Methode zum erhalten der am meisten gespielten Champions
 * @param $id
 * @return array
 */

function getMostPlayedChamps($id) {

    global $api_key;

    $url = "https://euw.api.pvp.net/championmastery/location/EUW1/player/$id/topchampions?count=4&api_key=$api_key";

    $json_data = file_get_contents($url);

    $json_obj  = json_decode($json_data);

    $champs = array("x", "x", "x", "x");

    for($i = 0; $i < 4; $i++) {
        //$champs[$i] = $json_obj[$i]->{"championId"};
        $champs[$i] = $json_obj[$i];

    }

    return $champs;
}


/** Methode zum Erhalten verschiedener Attribute für Champions, falls diese schon
 *  einmal aufgerufen wurden, sollen diese Informationen von der Datenbank abgerufen werden
 * @param $id
 * @return mixed|null
 */

function getChampInfo($id)
{

    global $api_key;

    $url = "https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion/$id?champData=info&api_key=$api_key";

    if (!ChampionDatabase::contains($id)) {
        // Champion befindet sich noch nicht in der Datenbank
        $json_data = file_get_contents($url);

        $json_obj = json_decode($json_data);

        // In lokale Datenbank hinzufügen
        return ChampionDatabase::addChampion($json_obj);

    } else {
        // Champion befindet sich schon in der Datenbank
        $json_obj = ChampionDatabase::getChampion($id);

        return $json_obj;

    }
}

class ChampionDatabase
{

    //##### Variablen #####//
    private static $url = "data/champions.json";

    /** Methode zum hinzufügen eines neuen Champions
     * @param $data
     * @return mixed
     */

    public static function addChampion($data)
    {

        // Alte Daten
        $oldData = json_decode(file_get_contents(self::$url));

        // Neue Daten
        $dataToAdd = json_encode(array(
            'id'    => $data->{"id"},
            'name'  => $data->{"name"},
            'atk'   => $data->{"info"}->{"attack"},
            'def'   => $data->{"info"}->{"defense"},
            'magic' => $data->{"info"}->{"magic"}
        ), JSON_FORCE_OBJECT);

        //$oldData[sizeof($oldData)] = $dataToAdd;

        $oldDataString = json_encode($oldData);

        $newDataString = json_encode($dataToAdd);

        // Löschen der \ im String
        $newDataString = str_replace('\\', "", $newDataString);
        // Entfernen der " am Anfang und Ende des Strings
        $newDataString = substr($newDataString, 1);
        $newDataString = substr($newDataString, 0, -1);

        // Löschen des letzten Zeichens im "alten" Objekt
        $oldDataString = substr($oldDataString, 0, -1);

        // Zusammensetzen der beiden Strings
        $outputData = $oldDataString . "," . $newDataString . "]";

        // Datei editieren
        $edit_handle = fopen(self::$url, 'w');
        fwrite($edit_handle, $outputData);
        fclose($edit_handle);

        return json_decode($dataToAdd);
    }

    /** Methode zum Suchen nach einem Champion per ID
     * @param $idParam
     * @return null
     */

    public static function getChampion($idParam)
    {

        $json_data = file_get_contents(self::$url);

        $json_obj = json_decode($json_data);


        for ($i = 0; $i < sizeof($json_obj); $i++) {

            if ($json_obj[$i]->{"id"} == $idParam) {

                return $json_obj[$i];
            }
        }

        return null;

    }

    /** Methode zum Überprüfen ob der Champion schon in der Datenbank
     *  vorhanden ist
     * @param $id
     * @return bool
     */

    public static function contains($id) {
        if(self::getChampion($id) != null) {
            return true;
        } else {
            return false;
        }
    }

}

class Players {

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

?>