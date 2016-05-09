<?php

session_start();

if(isset($_GET['token']) && isset($_GET['type']) && isset($_SESSION['summonerName'])) {


    if($_GET['token'] == $_SESSION['token']) {

        $type = $_GET['type'];

        switch($type) {

            case "createLobby":

                if(!isset($_SESSION['lobby']) && isset($_GET['password'])) {
                    // Erstelle eine Lobby
                    $_SESSION['lobby'] = $_SESSION['summonerName'];

                    $data = array(
                        "player1"  => $_SESSION['summonerName'],
                        "player2"  => "",
                        "mode"     => 0,
                        "action"   => 0,
                        "password" => md5($_GET['password'])
                    );

                    Lobby::createLobby($_SESSION['lobby'], $data);
                    echo "true";

                }

                break;

            case "leaveLobby":

                if(isset($_SESSION['lobby'])) {

                    Lobby::leaveLobby($_SESSION['summonerName']);

                }

            break;

            case "joinLobby":

                if(!isset($_SESSION['lobby']) && isset($_GET['lobbyName']) && isset($_GET['password'])) {

                    Lobby::joinLobby($_GET['lobbyName'], $_GET['password']);

                }
            break;

            case "getInformation":

                if(isset($_SESSION['lobby'])) {

                    echo Lobby::getLobby($_SESSION['lobby']);

                }

            break;

            case "startGame":

                if(isset($_SESSION['lobby'])) {

                    $lobbyObj = json_decode(Lobby::getLobby($_SESSION['summonerName']));

                    if($lobbyObj->{"player1"} == $_SESSION['summonerName'] && $lobbyObj->{"player2"} != "") {

                        // Start game
                        $lobbyObj->{"mode"} = 4;
                        Lobby::createLobby($_SESSION['lobby'], $lobbyObj);
                        echo "true";

                    } else {

                        echo "false";

                    }

                }

            break;

            case "toggleCd":

                if(isset($_SESSION['lobby'])) {

                    $lobbyObj = json_decode(Lobby::getLobby($_SESSION['lobby']));

                    if($lobbyObj->{"player1"} == $_SESSION['summonerName']) {

                        if($lobbyObj->{"mode"} == 3) {
                            $lobbyObj->{"mode"} = 2;
                        } else if($lobbyObj->{"mode"} == 5) {
                            $lobbyObj->{"mode"} = 1;
                        } else if($lobbyObj->{"mode"} == 4) {
                            $lobbyObj->{"mode"} = 1;
                        }

                        Lobby::createLobby($_SESSION['lobby'], $lobbyObj);

                    }

                }

            break;

            case "getPlayer":

                if(isset($_SESSION['lobby'])) {

                    $lobbyObj = json_decode(Lobby::getLobby($_SESSION['lobby']));

                    if($lobbyObj->{"player1"} == $_SESSION['summonerName']) {
                        echo "1";
                    } else if($lobbyObj->{"player2"} == $_SESSION['summonerName']) {
                        echo "2";
                    } else {
                        echo "0";
                    }

                }

                break;


                case "getEnemy":

                    if(isset($_SESSION['lobby'])) {

                        $lobbyObj = json_decode(Lobby::getLobby($_SESSION['lobby']));

                        if($lobbyObj->{"player1"} == $_SESSION['summonerName']) {
                            echo file_get_contents("players/" . $lobbyObj->{"player2"} . ".json");
                        } else {
                            echo file_get_contents("players/" . $lobbyObj->{"player1"} . ".json");
                        }

                    }

                break;

            case "endGame":
                if(isset($_SESSION['lobby'])) {

                    $lobbyObj = json_decode(Lobby::getLobby($_SESSION['lobby']));
                    $p1 = json_decode(file_get_contents("players/" . $lobbyObj->{"player1"} . ".json"));
                    $p2 = json_decode(file_get_contents("players/" . $lobbyObj->{"player2"} . ".json"));
                    if($p1->{"health"} <= 0 || $p2->{"health"} <= 0) {

                        echo "true";
                        $p1->{"health"} = $p1->{"maxHealth"};
                        $p2->{"health"} = $p2->{"maxHealth"};

                        $dataP1 = json_encode($p1);
                        $dataP2 = json_encode($p2);

                        editFile($p1->{"name"}, $dataP1);
                        editFile($p2->{"name"}, $dataP2);


                    } else {

                        echo "false";

                    }

                }

                break;
        }

    }

}

function editFile($fileName, $data) {

    $handle = fopen("players/" . $fileName . ".json", "w");
    fwrite($handle, $data);
    fclose($handle);

}

class Lobby {

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


?>