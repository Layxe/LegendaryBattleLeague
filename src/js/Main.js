var SUMM_INFO = document.getElementById("summoner-information");

var usedChampion = "";
var usedSkin     = 0; // Default Skin
var usedColor    = "#e67e22"; // Default Color

var loggedOut = false;

/**
 * Editiere das Hintergrundbild und ändere die Farbe
 */
function setTheme() {

    var randomNumber = Math.random();

    if(randomNumber < 0.25) {
        usedChampion = "Leona";
        usedSkin     = 4;
    } else if(randomNumber < 0.5) {
        usedChampion = "Thresh";
        usedColor = "#0F6D00";
    } else if(randomNumber < 0.75) {
        usedChampion = "Bard";
    } else {
        usedChampion = "Blitzcrank";
    }

    document.body.style.background = "url('http://ddragon.leagueoflegends.com/cdn/img/champion/splash/" + usedChampion + "_" + usedSkin + ".jpg') no-repeat center center fixed";
    document.body.style.backgroundSize = "cover";

    document.getElementById("searchButton").style.backgroundColor = usedColor;
    document.getElementById("verify-name").style.color            = usedColor;
    document.getElementById("loading-bar").style.backgroundColor  = usedColor;


}

/**
 * Methode um die Suche einzuleiten
 * @param _name
 */
function search(_name) {

    var name = _name.replace(/ /g,'');

    var hr = new XMLHttpRequest();
    hr.open("GET", "src/php/Search.php?name=" + name + "&type=First&token=" + token, false);
    hr.send();
    var summoner_data = hr.response.split(",");

    // Editieren der äußerlichen Aspekte
    // Ändern des Profil-Bildes
    document.getElementById("profile-img").setAttribute("src", "http://ddragon.leagueoflegends.com/cdn/6.7.1/img/profileicon/" + summoner_data[1] + ".png ");
    // Ändern des Beschwörer Levels
    document.getElementById("summoner-level").innerHTML   = summoner_data[0];
    // Ändern des angezeigten Namen
    document.getElementById("input-dummy").innerHTML      = _name;
    // Verschwinden des Such Knopfes
    document.getElementById("searchButton").style.display = "none";
    // Schieben des Namens nach Oben
    document.getElementById("wrapper").style.marginTop    = "35px";
    // Anzeigen der Beschwörer Informationen
    document.getElementById("profilePic").style.opacity     = "1";
    document.getElementById("summoner-level").style.opacity = "1";
    // Hochschieben der Info-Felder
    document.getElementById("dialogue").style.marginTop = "5px";
    document.getElementById("summoner-level").style.top = "165px";

    document.getElementById("verify-wrapper").style.height = "275px";

    document.getElementById("headline").innerHTML = "Please verify, that you are: <span id='verify-name'>" + name + "</span>";
    // Change color
    document.getElementById("verify-name").style.color = usedColor;


}

function loadLobbyContent() {

    document.getElementById("lobby-system").style.height = 50+"px";
    document.getElementById("lobby-system").style.padding = 20+"px";

}

function loadGameContent() {

    var lobbyScreen = document.getElementById("lobby-screen");
    lobbyScreen.style.height = "0";
    lobbyScreen.style.padding = "0";

    document.getElementById("start-button").style.display = "none";

    var lobbySystem = document.getElementById("lobby-system");
    lobbySystem.style.height  = "0";
    lobbySystem.style.padding = "0";

    var leaveButton = document.getElementById("leave-button");
    leaveButton.style.height  = "0px";
    leaveButton.style.padding = "0px";

    // Anzeigen des Spiels
    SUMM_INFO.style.display = "block";
    setTimeout(function() {
        SUMM_INFO.style.height = "400px";
    }, 10);

    // Initialisiere das Spiel
    initGame();

}

/**
 * Methode zum Ausloggen
 */

function logout() {

    if(loggedOut) {
        var hr = new XMLHttpRequest();
        hr.open("GET", "src/php/Search.php?type=logout&id=x&token=" + token, false);
        hr.send();
        eval(hr.response);
    } else {

        location.reload();

    }

}

//################ Serverseitig Daten beziehen ##############//

function getSummonerInformation() {

    var hr = new XMLHttpRequest();
    hr.open("GET", "src/php/Search.php?type=summoner&token=" + token, false);
    hr.send();

    return JSON.parse(hr.response);


}


function getEnemyStats(interval) {

    var hr = new XMLHttpRequest();
    hr.open("GET", "src/php/Lobby.php?type=getEnemy&token=" + token, false);
    hr.send();
    try {
        return JSON.parse(hr.response);
    } catch(e) {
        leaveLobby(interval);
    }
}

function getPlayerPosition() {

    var hrLobby = new XMLHttpRequest();
    hrLobby.open("GET", "src/php/Lobby.php?type=getPlayer&token=" + token, false);
    hrLobby.send();

    return parseInt(hrLobby.response);

}

//######## Lobby System ##########//

function checkEndGame() {

    var hr = new XMLHttpRequest();
    hr.open("GET", "src/php/Lobby.php?type=endGame&token=" + token, false);
    hr.send();

    return hr.response == "true";

}

function endGameIfPossible(interval) {
    var gameStatus = checkEndGame();
    if(gameStatus != 0 && triggeredGame) {
        setTimeout(function() {
            leaveLobby(interval);

            var hr = new XMLHttpRequest();
            hr.open("GET", "src/php/Lobby.php?type=endGame&token=" + token);
            hr.send();
        }, 5000);

    }

}

function createLobby(password) {
    if(password != "" && password.length < 50) {
        var hr = new XMLHttpRequest();
        hr.open("GET", "src/php/Lobby.php?type=createLobby&password=" + password + "&token=" + token, false);
        hr.send();

        if(hr.response == "true") {

            var lobbyScreen = document.getElementById("lobby-screen");
            lobbyScreen.style.height = "253px";
            lobbyScreen.style.padding = "20px";

            document.getElementById("player1").innerHTML = "<h1>" + getSummonerInformation().name + "</h1>";
            document.getElementById("player2").innerHTML = "<h1>" + "Not joined" + "</h1>";

            var lobbySystem = document.getElementById("lobby-system");
            lobbySystem.style.height  = "0";
            lobbySystem.style.padding = "0";

            var leaveButton = document.getElementById("leave-button");
            leaveButton.style.height  = "50px";
            leaveButton.style.padding = "20px";

            document.getElementById("start-button").style.display = "block";


            var interval = setInterval(function() {

                updateLobby(interval);

            }, 500);

        }
    } else {

        alert("Please enter a valid password with max. 50 characters");

    }
}

function joinLobby(_lobbyName, password) {

    if(_lobbyName != "" && password != "") {

        var lobbyName = _lobbyName.replace(/ /g,'');

        var hr = new XMLHttpRequest();
        hr.open("GET", "src/php/Lobby.php?type=joinLobby&password=" + password + "&lobbyName=" + lobbyName + "&token=" + token, false);
        hr.send();

        if(hr.response == "true") {

            var lobbyScreen = document.getElementById("lobby-screen");
            lobbyScreen.style.height = "253px";
            lobbyScreen.style.padding = "20px";

            document.getElementById("player1").innerHTML = "<h1>" + getLobby().player1 + "</h1>";
            document.getElementById("player2").innerHTML = "<h1>" + getSummonerInformation().name + "</h1>";

            document.getElementById("start-button").style.display = "none";

            var lobbySystem = document.getElementById("lobby-system");
            lobbySystem.style.height  = "0";
            lobbySystem.style.padding = "0";

            var leaveButton = document.getElementById("leave-button");
            leaveButton.style.height  = "50px";
            leaveButton.style.padding = "20px";

            var interval = setInterval(function() {

                updateLobby(interval);

            }, 500);

        }

    }

}

var triggeredGame = false;
var oldResponse = 0;

function updateLobby(interval) {
    var enemy  = getEnemyStats(interval);
    var summoner = getSummonerInformation();

    updateStats(summoner, enemy);

    endGameIfPossible(interval);

    var lobby = getLobby(interval);

    if((lobby.player1 == "" || lobby.player2 == "") && triggeredGame) {
        leaveLobby(interval);
    }

    if(lobby.action != oldResponse) {

        oldResponse = lobby.action;

        var atkData = lobby.action.split("_");
        var attack = {
            player: atkData[0],
            type:   atkData[1],
            effect: atkData[2]
        };

        executeMove(attack);

        setTimeout(function() {
            var lobbyHr = new XMLHttpRequest();
            lobbyHr.open("GET", "src/php/Lobby.php?type=toggleCd&token=" + token, false);
            lobbyHr.send();
        }, 5000);

    }

    var playerPosition = getPlayerPosition();

    switch(lobby.mode) {

        case 0:
            document.getElementById("player1").innerHTML = "<h1>" + lobby.player1 + "</h1>";
            document.getElementById("player2").innerHTML = "<h1>" + lobby.player2 + "</h1>";
            break;

        case 1:
            if(playerPosition == 1)
                allowAbilities(true);
            else
                allowAbilities(false);

            break;

        case 2:
            if(playerPosition == 2)
                allowAbilities(true);
            else
                allowAbilities(false);
            break;

        case 4:

            allowAbilities(false);

            if(!triggeredGame) {

                triggeredGame = true;

                loadGameContent();



                setTimeout(function() {

                    var lobbyHr = new XMLHttpRequest();
                    lobbyHr.open("GET", "src/php/Lobby.php?type=toggleCd&token=" + token, false);
                    lobbyHr.send();


                }, 2000);

            }
            break;

    }
}

function getLobby(interval) {

    var hrLobby = new XMLHttpRequest();
    hrLobby.open("GET", "src/php/Lobby.php?type=getInformation&token=" + token, false);
    hrLobby.send();

    if(hrLobby.response.charAt(0) == "{") {

        return JSON.parse(hrLobby.response);

    } else {
        leaveLobby(interval);
    }
}

function leaveLobby(interval) {

    var hr = new XMLHttpRequest();
    hr.open("GET", "src/php/Lobby.php?type=leaveLobby&token=" + token, false);
    hr.send();

    var leaveButton = document.getElementById("leave-button");
    leaveButton.style.height  = "0";
    leaveButton.style.padding = "0";

    var lobbySystem = document.getElementById("lobby-system");
    lobbySystem.style.height  = "50px";
    lobbySystem.style.padding = "20px";

    var lobbyScreen = document.getElementById("lobby-screen");
    lobbyScreen.style.height = "0";
    lobbyScreen.style.padding = "0";

    SUMM_INFO.style.display = "none";
    SUMM_INFO.style.height  = "0";

    clearInterval(interval);

    triggeredGame = false;

}

function startGame() {

    var hr = new XMLHttpRequest();
    hr.open("GET", "src/php/Lobby.php?type=startGame&token=" + token, false);
    hr.send();

    if(hr.response == "true") {



    } else {

        alert("You can't start the game")

    }

}

//######## Verifizierung ##########//

var check = false;

function verifyAcc() {
    if(!check) {
        console.log("Checking...");

        check = true;

        // Change display to loading display
        var wrapper           = document.getElementById("verify-wrapper");
        wrapper.style.height  = "0px";
        wrapper.style.opacity = "0";

        document.getElementById("loading-bar").style.width = "70%";

        setTimeout(function () {

            document.getElementById("loading-bar").style.display = "none";
            document.getElementById("dialogue").style.height     = "150px";


            var hr = new XMLHttpRequest();
            hr.open("GET", "src/php/Search.php?type=masteries&token=" + token, false);
            hr.send();

            if (hr.response == "true") {
                // Acc verified
                loadLobbyContent();

            } else {
                alert("This Account is not trusted right now! It's recommended to try it again in a few minutes.");
                location.reload();

            }

            check = false;

        }, 10000);
    }
}