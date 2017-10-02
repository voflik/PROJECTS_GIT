<?php



// we'll generate XML output
header('Content-Type: text/xml');
// generate XML header
echo '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
// create the <response> element
echo '<response>';
// retrieve the user name
$name = $_GET['name'];
// generate output depending on the user name received from client

session_start();
$db = "block";
$server = "localhost";
$tbl = "users";
$user = "root";
$pass = "";

$con = mysql_connect($server,$user,$pass) or die("Error 1".mysql_error());
mysql_select_db($db, $con) or die("Error 2".mysql_error());

$sql = "SELECT * FROM $tbl WHERE username LIKE $name";

$res = mysql_query($sql);

$userNames = mysql_fetch_array($res);



//$userNames = array('CRISTIAN', 'BOGDAN', 'FILIP', 'MIHAI', 'YODA');
if (in_array(strtoupper($name), $userNames))
echo 'Hello, master ' . htmlentities($name) . '!';
else if (trim($name) == '')
echo 'Stranger, please tell me your name!';
else
echo htmlentities($name) . ', I don\'t know you!';
// close the <response> element
echo '</response>';
?>