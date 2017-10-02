<?php

session_start();
$db = "block";
$server = "localhost";
$tbl = "users";
$user = "root";
$pass = "";
$name = "jk";

$con = mysql_connect($server,$user,$pass) or die("Error 1".mysql_error());
mysql_select_db($db, $con) or die("Error 2".mysql_error());

$array = array(1);

$sql = "SELECT * FROM $tbl WHERE username LIKE rumen";

$res = mysql_query($sql);

	echo "<table width =\"20%\" bgcolor=\"#F5F5FF\">";
	echo "<tr>";
	echo "<td ><b>Id</b></td> <td><b>Name</b></td>";
	echo "</tr>";
	while($sql_row=mysql_fetch_array($res)) {
		$id=$sql_row["id"];
		$name=$sql_row["username"];

		echo "<tr><td>".$id."</td>";
		echo "<td>".$name."</td>";
	}	
	echo "</table><br>";


$userNames = $name;

print_r($userNames);

?>