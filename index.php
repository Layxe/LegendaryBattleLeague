<?php

session_start();
$randomNumber  = rand(1000, 100000);
$securityToken = md5($randomNumber);

$_SESSION['token'] = $securityToken;
$_SESSION['init']  = false;

// Generiere den Verifizierungscode
$_SESSION['verify'] = rand(10000000, 99999999);

?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RIOT API</title>

    <!-- #### CSS Imports ### -->
    <link rel="stylesheet" type="text/css" href="src/css/style.css">

</head>
<body onload="setTheme()" onbeforeunload="loggedOut = true; logout()">
<?php include("src/parts/header.php"); ?>
<div id="dialogue">
    <div id="profilePic">
        <img id="profile-img">
    </div>
    <div id="summoner-level">
        0
    </div>
    <div id="summoner-role">
    </div>
    <div id="wrapper">
        <div id="input-dummy">
            <input id="summonerName">
        </div>
        <div id="searchButton" onclick="setTimeout(function() { search(document.getElementById('summonerName').value) }, 10) ">Search</div>
    </div>
</div>
<div id="verify-wrapper">
    <h1 id="headline">Please verify, that you are: <span id="verify-name">Layxxe</span></h1>
    <h3><?php echo $_SESSION['verify']; ?></h3>
    <p>Please change the name of one of your mastery pages to this code. We recommend to change this code after you logged out, for security reasons.</p>
    <span id="verify-button" onclick="verifyAcc()">Verify</span>
</div>

<div id="loading-bar"></div>

<div id="lobby-system">
    <div id="buttons">
        <div class="button" onclick="joinLobby(prompt('Enter the name of the person you want to join'), prompt('Enter the password'))">Join Lobby</div>
        <div class="button" onclick="createLobby(prompt('Enter a password'))">Create Lobby</div>
    </div>
</div>

<div id="leave-button">
    <div onclick="leaveLobby()">Leave lobby</div>
</div>

<div id="lobby-screen">
    <div id="player-container">
        <div class="player" id="player1">
            <h1>Layxxe</h1>
        </div>
        <div class="player" id="player2">
            <h1>Phibimat</h1>
        </div>
    </div>
    <div id="start-button" onclick="startGame()">
        Start game
    </div>
</div>

<div id="summoner-information">
    <div id="content">
        <div id="abilities">
            <img src="http://ddragon.leagueoflegends.com/cdn/6.7.1/img/champion/Aatrox.png" id="image-0" onclick="executeAttack(this.getAttribute('name'))">
            <img src="http://ddragon.leagueoflegends.com/cdn/6.7.1/img/champion/Aatrox.png" id="image-1" onclick="executeAttack(this.getAttribute('name'))">
            <img src="http://ddragon.leagueoflegends.com/cdn/6.7.1/img/champion/Aatrox.png" id="image-2" onclick="executeAttack(this.getAttribute('name'))">
            <img src="http://ddragon.leagueoflegends.com/cdn/6.7.1/img/champion/Aatrox.png" id="image-3" onclick="executeAttack(this.getAttribute('name'))">
        </div>
        <div id="info">
            <div id="health-bar">
                <div id="health">
                    <div class="info-font">1000 / 1000</div>
                </div>
            </div>
            <!-- Right now this isn't used for mana -->
            <div id="mana-bar">
                <div id="mana">
                    <div class="info-font">1000 / 1000</div>
                </div>
            </div>
        </div>
        <div id="sidebar">
        </div>
        <canvas id="display"></canvas>
    </div>
</div>
<?php include("src/parts/footer.php"); ?>/

<script>
    const token  = "<?php echo $_SESSION['token']; ?>";
    const verify = "<?php echo $_SESSION['verify']; ?>";

    function test() {
        var hr = new XMLHttpRequest();
        hr.open("GET", "src/search/Search.php", false);
        hr.send();
        alert(hr.response);
    }

</script>
<!-- ##### Javascript Imports ##### -->
<script src="src/js/Main.js" type="text/javascript"></script>
<script src="src/js/GameEngine.js" type="text/javascript"></script>
<script src="src/js/Physic-Engine.js" type="text/javascript"></script>
<script src="src/js/ParticleLib.js" type="text/javascript"></script>
</body>
</html>