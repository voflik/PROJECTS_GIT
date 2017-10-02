<?php
/*
* nas_mysql_result -- connect to mysql then load query result 
*                     into a two dimensional array. 
* ----- 
*/ 
function nas_mysql_result($dbhost,$dbuserlogin,$dbpassword,$dbname,$dbsql,$rstype) { 
  $dbconn = mysql_connect($dbhost,$dbuserlogin,$dbpassword) or die("Server 
Unavailable"); 
  mysql_select_db($dbname,$dbconn) or die("Database Unavailable"); 
  $result = mysql_query($dbsql) or die("Query Unavailable"); 

  //-- initial value -- 
  $iRows = 0; 
  $iCols = 0; 

  $iRows = mysql_num_rows($result); 
  $iCols = mysql_num_fields($result); 
  settype($arrContents,"array"); 

  switch ($rstype) { 
    case "byindex": 
      for($row=0; $row<$iRows; $row++){ 
        $rs = mysql_fetch_row($result); 
        for($col=0; $col<$iCols; $col++){ 
          $arrContents[$row][$col] = $rs[$col]; 
        }; 
      }; 
      return $arrContents; 
      break; 
    case "byname": 
      for($row=0; $row<$iRows; $row++){ 
        $rs = mysql_fetch_row($result); 
        for($col=0; $col<$iCols; $col++){ 
          $arrContents[$row][mysql_field_name($result,$col)] = $rs[$col]; 
        }; 
      }; 
      return $arrContents; 
      break; 
  }; 

  mysql_free_result($result); 
  mysql_close($dbconn); 
}; 
?> 

<!-- 
Example... 
Change the appropriate values with your own. 
--> 

<html> 
<head><title>Array From SQL Result</title></head> 
<body> 
<table border=1 cellpadding=0 cellspacing=0> 
<tr><th>#</th><th>Field 01</th><th>Field 02</th><th>Field 03</th></tr> 
<?php 
$dbhost = "localhost"; 
$dbuserlogin = "root"; 
$dbpassword = ""; 
$dbname = "block"; 
$dbsql = "SELECT username, password,id FROM usernames"; 

//-- by field index -- 
$myarray = nas_mysql_result($dbhost,$dbuserlogin,$dbpassword,$dbname,$dbsql,"byindex"); 

for ($i=0; $i < count($myarray); $i++) { 
  echo "<tr><td align=right>".$i."</td>"; 
  for ($j=0; $j < 3; $j++) { 
    echo "<td nowrap>".$myarray[$i][$j]."</td>"; 
  }
  echo "</tr>\n"; 
}

//-- by field name -- 
$myarray = nas_mysql_result 
($dbhost,$dbuserlogin,$dbpassword,$dbname,$dbsql,"byname"); 

for ($i=0; $i < count($myarray); $i++) { 
  echo "<tr><td align=left>".$i."</td><td nowrap>".$myarray[$i]["field1"]."</td><td nowrap>".$myarray[$i]["field2"]."</td><td nowrap>".$myarray[$i]["field3"]."</td></tr>\n"; 
}
?> 
</table> 
</body> 
</html>