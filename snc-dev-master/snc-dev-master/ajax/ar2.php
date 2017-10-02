<html>
<body>
<?php

$host = "localhost";
$user = "root";
$password = "";
$database = "block";
$name = "jk";
$connection = mysql_connect($host,$user,$password) 
	or die("Could not connect: ".mysql_error());

mysql_select_db($database,$connection) 
	or die("Error in selecting the database:".mysql_error());

$array = array(1);

foreach ($array as $value){

	$sql="Select * from users" ;

	$sql_result = mysql_query($sql,$connection) or exit("Sql Error".mysql_error());

	$sql_num = mysql_num_rows($sql_result);

	echo "<table width =\"20%\" bgcolor=\"#F5F5FF\">";
	echo "<tr>";
	echo "<td ><b>Id</b></td> <td><b>Name</b></td>";
	echo "</tr>";
	$arr[][] = mysql_fetch_assoc($sql_result);
	while($sql_row=mysql_fetch_array($sql_result)) {
		$id=$sql_row["id"];
		$name=$sql_row["username"];
			//for(i=0;i<mysql_fetch_array($sql_result);i++) {
				//$
			
		echo "<tr><td>".$id."</td>";
		echo "<td>".$name."</td>";
	}	
	echo "</table><br>";
	

print_r($arr);

	
}
?>
</body>
</html>